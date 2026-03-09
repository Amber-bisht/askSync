import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UnifiedTest, UnifiedTestResponse } from '@/models/UnifiedTest';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Check if user has already started/submitted this test
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testLink: string }> }
) {
  try {
    // Check authentication first
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();
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

    const isCreator = session?.user?.email === test.createdBy;

    // Check access control for private tests
    if (!test.isPublic && !isCreator) {
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
      return NextResponse.json({
        hasAttempted: true,
        hasSubmitted: true,
        submittedAt: existingResponse.submittedAt,
        score: existingResponse.percentage,
        message: 'You have already submitted this test'
      });
    }

    return NextResponse.json({
      hasAttempted: false,
      hasSubmitted: false,
      message: 'You can take this test'
    });

  } catch (error) {
    console.error('Error checking test status:', error);
    return NextResponse.json(
      { error: 'Failed to check test status' },
      { status: 500 }
    );
  }
}
