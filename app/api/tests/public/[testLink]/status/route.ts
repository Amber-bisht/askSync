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
      isPublic: true
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or not public' },
        { status: 404 }
      );
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
