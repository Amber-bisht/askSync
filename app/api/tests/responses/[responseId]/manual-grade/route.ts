import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { UnifiedTest, UnifiedTestResponse, IUnifiedTestResponse } from '@/models/UnifiedTest';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  try {
    const { questionId, isCorrect, manualScore, manualFeedback } = await request.json();
    const { responseId } = await params;

    if (!questionId || isCorrect === undefined) {
      return NextResponse.json(
        { error: 'Question ID and correctness status are required' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get the test response
    const testResponse = await UnifiedTestResponse.findById(responseId);
    if (!testResponse) {
      return NextResponse.json(
        { error: 'Test response not found' },
        { status: 404 }
      );
    }

    // Get the original test to verify ownership
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

    // Update the question response with manual grading
    const updatedResponses = testResponse.responses.map((response: IUnifiedTestResponse['responses'][0]) => {
      if (response.questionId === questionId) {
        const pointsEarned = manualScore !== undefined ? Math.min(manualScore, response.maxPoints || 1) : (isCorrect ? (response.maxPoints || 1) : 0);
        
        return {
          ...response,
          isCorrect: isCorrect,
          pointsEarned: pointsEarned,
          manuallyGraded: true,
          manualScore: manualScore,
          manualFeedback: manualFeedback || ''
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

    return NextResponse.json({
      message: 'Question graded successfully',
      updatedResponse: {
        totalScore,
        maxScore,
        percentage,
        isGraded: true
      }
    });

  } catch (error) {
    console.error('Error manually grading question:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to grade question manually' },
      { status: 500 }
    );
  }
}
