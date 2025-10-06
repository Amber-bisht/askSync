import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UnifiedTest } from '@/models/UnifiedTest';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Fetch a public test by testLink
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testLink: string }> }
) {
  try {
    await connectDB();
    const { testLink } = await params;
    const session = await getServerSession(authOptions);

    const test = await UnifiedTest.findOne({
      testLink: testLink,
      isActive: true
    }).lean() as {
      _id: string;
      testName: string;
      description: string;
      questions: Array<{
        id: string;
        type: 'mcq' | 'qa';
        question: string;
        options?: string[];
        correctAnswer?: string;
        explanation?: string;
        points: number;
        isRequired: boolean;
      }>;
      testLink: string;
      isPublic: boolean;
      showResults: boolean;
      allowAnonymous: boolean;
      timeLimit?: number;
      accessListId?: string;
      settings: {
        allowAnonymous: boolean;
        showResults: boolean;
        timeLimit?: number;
        isPublic: boolean;
        accessListId?: string;
      };
      createdAt: Date;
    } | null;

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or inactive' },
        { status: 404 }
      );
    }

    // Check access control for private tests
    if (!test.isPublic) {
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Authentication required to access this test' },
          { status: 401 }
        );
      }

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

    // Return test data without sensitive information
    const publicTest = {
      _id: test._id,
      testName: test.testName,
      description: test.description,
      questions: test.questions,
      testLink: test.testLink,
      isPublic: test.isPublic,
      showResults: test.showResults,
      allowAnonymous: test.allowAnonymous,
      timeLimit: test.timeLimit,
      settings: test.settings,
      createdAt: test.createdAt
    };

    return NextResponse.json({ test: publicTest });

  } catch (error) {
    console.error('Error fetching public test:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test' },
      { status: 500 }
    );
  }
}
