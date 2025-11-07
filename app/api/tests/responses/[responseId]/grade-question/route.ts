import { NextRequest, NextResponse } from 'next/server';
import { generateGroqContent } from '@/lib/groq';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { UnifiedTest, UnifiedTestResponse, IUnifiedTestResponse, IUnifiedTestQuestion } from '@/models/UnifiedTest';

// Using Groq AI instead of Google Gemini

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  try {
    const { questionId, maxPoints = 10 } = await request.json();
    const { responseId } = await params;

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check AI grading usage limits
    const aiGradingUsage = dbUser.isPaid 
      ? (dbUser.monthlyAiGradingUsed || 0) 
      : (dbUser.aiGradingUsed || 0);
    const aiGradingLimit = dbUser.isPaid 
      ? (dbUser.maxMonthlyAiGrading || 20) 
      : (dbUser.maxFreeAiGrading || 2);

    if (aiGradingUsage >= aiGradingLimit) {
      return NextResponse.json({ 
        error: dbUser.isPaid 
          ? 'AI grading limit reached. Please contact support for assistance.'
          : 'Free AI grading limit reached. Please upgrade to grade more responses.',
        limitReached: true,
        upgradeRequired: !dbUser.isPaid
      }, { status: 403 });
    }

    // Get the test response
    const testResponse = await UnifiedTestResponse.findById(responseId);
    if (!testResponse) {
      return NextResponse.json(
        { error: 'Test response not found' },
        { status: 404 }
      );
    }

    // Get the original test to verify ownership and get question details
    const test = await UnifiedTest.findById(testResponse.testId);
    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Check if user owns the test
    if (test.createdBy !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized to grade this response' },
        { status: 403 }
      );
    }

    // Find the specific question response
    const questionResponse = testResponse.responses.find(
      (response: IUnifiedTestResponse['responses'][0]) => response.questionId === questionId
    );

    if (!questionResponse) {
      return NextResponse.json(
        { error: 'Question response not found' },
        { status: 404 }
      );
    }

    // Only grade question-answer type questions (not MCQ)
    if (questionResponse.questionType === 'mcq') {
      return NextResponse.json(
        { error: 'MCQ questions are automatically graded. This endpoint is for question-answer type questions only.' },
        { status: 400 }
      );
    }

    // Find the original question in the test
    const originalQuestion = test.questions.find(
      (q: IUnifiedTestQuestion) => q.id === questionId
    );

    if (!originalQuestion) {
      return NextResponse.json(
        { error: 'Original question not found' },
        { status: 404 }
      );
    }

    // Build prompt for AI grading
    const prompt = `You are an expert teacher grading student answers. Please evaluate the following answer and provide a detailed assessment.

Question: "${originalQuestion.question}"
${originalQuestion.correctAnswer ? `Expected Answer/Key Points: "${originalQuestion.correctAnswer}"` : ''}
${originalQuestion.explanation ? `Additional Context: "${originalQuestion.explanation}"` : ''}

Student Answer: "${questionResponse.answer}"

Please provide your evaluation in the following JSON format:
{
  "score": <number from 0 to ${maxPoints}>,
  "percentage": <number from 0 to 100>,
  "feedback": "<detailed feedback explaining the grade>",
  "strengths": ["<list of what the student got right>"],
  "improvements": ["<list of areas for improvement>"],
  "isCorrect": <boolean - true if score is 8 or above out of 10>,
  "reasoning": "<brief explanation of the scoring decision>"
}

Grading criteria:
- 0-2: Completely incorrect or irrelevant
- 3-4: Partially correct but major errors
- 5-6: Somewhat correct with some understanding
- 7-8: Mostly correct with minor errors
- 9-10: Completely correct or excellent answer

Be fair but thorough in your evaluation. Consider partial credit for partially correct answers.`;

    const systemPrompt = "You are an expert educator grading student answers. Always respond with valid JSON.";
    const content = await generateGroqContent(prompt, systemPrompt);
    
    if (!content) {
      throw new Error('No response from Groq AI');
    }

    // Try to parse the JSON response
    let gradingResult;
    try {
      gradingResult = JSON.parse(content);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        gradingResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI grading response');
      }
    }

    // Validate the response structure
    if (typeof gradingResult.score !== 'number' || 
        gradingResult.score < 0 || 
        gradingResult.score > maxPoints) {
      throw new Error('Invalid score from AI grading');
    }

    // Update the question response with AI grading results
    const updatedResponses = testResponse.responses.map((response: IUnifiedTestResponse['responses'][0]) => {
      if (response.questionId === questionId) {
        return {
          ...response,
          aiGraded: true,
          aiScore: gradingResult.score,
          aiPercentage: gradingResult.percentage,
          aiFeedback: gradingResult.feedback,
          aiStrengths: gradingResult.strengths || [],
          aiImprovements: gradingResult.improvements || [],
          aiReasoning: gradingResult.reasoning,
          pointsEarned: Math.min(gradingResult.score, response.maxPoints || 1),
          isCorrect: gradingResult.isCorrect
        };
      }
      return response;
    });

    // Recalculate total score
    const totalScore = updatedResponses.reduce((sum: number, response: IUnifiedTestResponse['responses'][0]) => {
      return sum + (response.pointsEarned || 0);
    }, 0);

    const maxScore = updatedResponses.reduce((sum: number, response: IUnifiedTestResponse['responses'][0]) => {
      return sum + (response.maxPoints || 1);
    }, 0);

    const percentage = maxScore > 0 ? Math.min(100, Math.round((totalScore / maxScore) * 100)) : 0;

    // Update the test response
    await UnifiedTestResponse.findByIdAndUpdate(responseId, {
      responses: updatedResponses,
      totalScore,
      maxScore,
      percentage,
      isGraded: true,
      gradedAt: new Date()
    });

    // Update user's AI grading count
    if (dbUser.isPaid) {
      await User.findByIdAndUpdate(dbUser._id, {
        $inc: { monthlyAiGradingUsed: 1 }
      });
    } else {
      await User.findByIdAndUpdate(dbUser._id, {
        $inc: { aiGradingUsed: 1 }
      });
    }

    return NextResponse.json({
      grading: gradingResult,
      message: 'Question graded successfully',
      updatedResponse: {
        totalScore,
        maxScore,
        percentage,
        isGraded: true
      }
    });

  } catch (error) {
    console.error('Error grading question with AI:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to grade question with AI' },
      { status: 500 }
    );
  }
}
