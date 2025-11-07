import { NextRequest, NextResponse } from 'next/server';
import { generateGroqContent } from '@/lib/groq';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Using Groq AI instead of Google Gemini

export async function POST(request: NextRequest) {
  try {
    const { question, userAnswer, correctAnswer, explanation, maxPoints = 10 } = await request.json();

    if (!question || !userAnswer) {
      return NextResponse.json(
        { error: 'Question and user answer are required' },
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

        // Check usage limits based on subscription status
        if (dbUser.aiGradingUsed >= dbUser.aiGradingLimit) {
          return NextResponse.json({ 
            error: dbUser.isPaid 
              ? 'AI grading limit reached. Please contact support for assistance.'
              : 'Free AI grading limit reached. Please upgrade to grade more responses.',
            limitReached: true,
            upgradeRequired: !dbUser.isPaid
          }, { status: 403 });
        }

    // Build prompt for AI grading
    const prompt = `You are an expert teacher grading student answers. Please evaluate the following answer and provide a detailed assessment.

Question: "${question}"
${correctAnswer ? `Correct Answer: "${correctAnswer}"` : ''}
${explanation ? `Explanation: "${explanation}"` : ''}

Student Answer: "${userAnswer}"

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

    // Update user's AI grading count
    await User.findByIdAndUpdate(dbUser._id, {
      $inc: { aiGradingUsed: 1 }
    });

    return NextResponse.json({
      grading: gradingResult,
      message: 'Answer graded successfully'
    });
  } catch (error) {
    console.error('Error grading answer with AI:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to grade answer with AI' },
      { status: 500 }
    );
  }
}
