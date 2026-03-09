import { NextRequest, NextResponse } from 'next/server';
import { generateGroqContent } from '@/lib/groq';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { UnifiedTest, UnifiedTestResponse, IUnifiedTestResponse, IUnifiedTestQuestion } from '@/models/UnifiedTest';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ testId: string }> }
) {
    try {
        const { testId } = await params;

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

        // Get the original test to verify ownership
        const test = await UnifiedTest.findById(testId);
        if (!test) {
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        // Check if user owns the test
        if (test.createdBy !== session.user.email) {
            return NextResponse.json({ error: 'Unauthorized to grade this test' }, { status: 403 });
        }

        // Get all responses for this test
        const responses = await UnifiedTestResponse.find({ testId });
        if (responses.length === 0) {
            return NextResponse.json({ message: 'No responses found to grade' });
        }

        let totalGradedCount = 0;

        // Process each response
        for (const testResponse of responses) {
            let responseUpdated = false;
            const updatedResponses = [...testResponse.responses];

            for (let i = 0; i < updatedResponses.length; i++) {
                const questionResponse = updatedResponses[i];

                // Only grade ungraded 'qa' questions
                if (questionResponse.questionType === 'qa' && questionResponse.isCorrect === undefined) {

                    // Check limits before each AI call
                    if (dbUser.aiGradingUsed >= dbUser.aiGradingLimit) {
                        // Stop processing if limit reached
                        break;
                    }

                    // Find original question
                    const originalQuestion = test.questions.find((q: IUnifiedTestQuestion) => q.id === questionResponse.questionId);
                    if (!originalQuestion) continue;

                    // AI Grading Logic (similar to individual endpoint)
                    const prompt = `You are an expert teacher grading student answers. Evaluate:
Question: "${originalQuestion.question}"
${originalQuestion.correctAnswer ? `Key Points: "${originalQuestion.correctAnswer}"` : ''}
Student Answer: "${questionResponse.answer}"

JSON format:
{
  "score": <0-10>,
  "percentage": <0-100>,
  "feedback": "...",
  "isCorrect": <boolean>,
  "reasoning": "..."
}`;

                    const content = await generateGroqContent(prompt, "Respond with valid JSON.");
                    if (!content) continue;

                    try {
                        const result = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || content);

                        updatedResponses[i] = {
                            ...questionResponse,
                            aiGraded: true,
                            aiScore: result.score,
                            aiPercentage: result.percentage,
                            aiFeedback: result.feedback,
                            aiReasoning: result.reasoning,
                            pointsEarned: Math.min(result.score, questionResponse.maxPoints || 1),
                            isCorrect: result.isCorrect
                        };

                        responseUpdated = true;
                        totalGradedCount++;

                        // Increment usage per question
                        dbUser.aiGradingUsed += 1;
                    } catch (e) {
                        console.error('Failed to parse AI response for a question');
                    }
                }
            }

            if (responseUpdated) {
                // Recalculate scores for this specific response
                const totalScore = updatedResponses.reduce((sum, r) => sum + (r.pointsEarned || 0), 0);
                const maxScore = testResponse.maxScore || updatedResponses.reduce((sum, r) => sum + (r.maxPoints || 1), 0);
                const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

                await UnifiedTestResponse.findByIdAndUpdate(testResponse._id, {
                    responses: updatedResponses,
                    totalScore,
                    maxScore,
                    percentage,
                    isGraded: true,
                    gradedAt: new Date()
                });
            }

            if (dbUser.aiGradingUsed >= dbUser.aiGradingLimit) break;
        }

        // Save final usage count
        await dbUser.save();

        return NextResponse.json({
            success: true,
            gradedCount: totalGradedCount,
            limitReached: dbUser.aiGradingUsed >= dbUser.aiGradingLimit
        });

    } catch (error) {
        console.error('Error in bulk AI grading:', error);
        return NextResponse.json({ error: 'Failed to perform bulk AI grading' }, { status: 500 });
    }
}
