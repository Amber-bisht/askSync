import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UnifiedTest, UnifiedTestResponse, IUnifiedTestResponse } from '@/models/UnifiedTest';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// POST - Submit a test response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ testLink: string }> }
) {
  try {
    // Check authentication first
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to submit the test.' },
        { status: 401 }
      );
    }

    await connectDB();

    const { responses } = await request.json();
    const { testLink } = await params;

    // Find the test
    const test = await UnifiedTest.findOne({
      testLink: testLink,
      isActive: true
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or inactive' },
        { status: 404 }
      );
    }

    // Check access control
    if (!test.isPublic) {
      // For private tests, check if user has access via access list
      if (test.accessListId) {
        const { validateUserAccess } = await import('@/lib/accessControl');
        const accessResult = await validateUserAccess(session.user.email, {
          isPrivate: true,
          accessListId: test.accessListId
        });
        
        if (!accessResult.hasAccess) {
          return NextResponse.json(
            { error: accessResult.reason || 'Access denied' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'This test is private and requires access' },
          { status: 403 }
        );
      }
    }

    // Check if user has already submitted this test
    const existingResponse = await UnifiedTestResponse.findOne({
      testId: test._id.toString(),
      'submittedBy.email': session.user.email
    });

    if (existingResponse) {
      return NextResponse.json(
        { error: 'You have already submitted this test. Only one attempt is allowed.' },
        { status: 403 }
      );
    }

    // Create test response
    const testResponse = new UnifiedTestResponse({
      testId: test._id.toString(),
      testName: test.testName,
      responses: responses.map((response: { questionId: string; answer: string }) => {
        // Try to find question by id first, then by _id
        const question = test.questions.find((q: { _id?: string; id?: string; points: number }) => 
          q.id === response.questionId || 
          q._id === response.questionId ||
          q._id === response.questionId.replace('question_', '')
        );
        return {
          questionId: response.questionId,
          question: question?.question || 'Unknown question',
          questionType: question?.type || 'qa',
          answer: response.answer,
          isCorrect: question?.type === 'mcq' ? response.answer === question.correctAnswer : undefined,
          pointsEarned: question?.type === 'mcq' && response.answer === question.correctAnswer ? (question.points || 1) : 0,
          maxPoints: question?.points || 1,
          correctAnswer: question?.type === 'mcq' ? question?.correctAnswer : undefined
        };
      }),
      submittedBy: {
        userId: session.user.id || session.user.email,
        name: session.user.name || 'Unknown User',
        email: session.user.email
      },
      submittedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      isAnonymous: false, // Always false since we require authentication
      totalScore: 0,
      maxScore: test.questions.reduce((sum: number, q: { points: number }) => sum + (q.points || 1), 0),
      percentage: 0,
      isGraded: false
    });

    await testResponse.save();

    // Calculate score if showResults is enabled
    let score = null;
    let results = null;

    if (test.showResults) {
      const totalScore = testResponse.responses.reduce((sum: number, response: { pointsEarned: number }) => sum + (response.pointsEarned || 0), 0);
      const maxScore = testResponse.maxScore;
      score = Math.min(100, Math.round((totalScore / maxScore) * 100));
      
      // Update the response with calculated scores
      testResponse.totalScore = totalScore;
      testResponse.percentage = score;
      await testResponse.save();

      results = testResponse.responses.map((response: IUnifiedTestResponse['responses'][0]) => ({
        questionId: response.questionId,
        question: response.question,
        userAnswer: response.answer,
        correctAnswer: response.questionType === 'mcq' ? response.correctAnswer : undefined,
        isCorrect: response.isCorrect,
        type: response.questionType,
        pointsEarned: response.pointsEarned,
        maxPoints: response.maxPoints
      }));
    }

    return NextResponse.json({
      success: true,
      message: 'Test submitted successfully',
      score,
      results,
      showResults: test.showResults
    });

  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json(
      { error: 'Failed to submit test' },
      { status: 500 }
    );
  }
}
