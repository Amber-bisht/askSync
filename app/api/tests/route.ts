import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UnifiedTest, IUnifiedTestQuestion } from '@/models/UnifiedTest';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { nanoid } from 'nanoid';

// POST - Create a new unified test
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      testName,
      description,
      questions,
      isPublic,
      showResults,
      allowAnonymous,
      accessListId,
      timeLimit,
      createdBy
    } = await request.json();

    if (!testName || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Test name and questions are required' },
        { status: 400 }
      );
    }

    // Validate test settings
    const hasMcqQuestions = questions.some((q: IUnifiedTestQuestion) => q.type === 'mcq');
    
    // Show results immediately is only valid for MCQ tests
    if (showResults && !hasMcqQuestions) {
      return NextResponse.json(
        { error: 'Show results immediately is only available for MCQ tests' },
        { status: 400 }
      );
    }

    // Anonymous submissions are only allowed for logged in users
    if (allowAnonymous) {
      // This is always true since we require authentication to create tests
      // But we can add additional validation here if needed
    }

    await connectDB();

    // Check user limits
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

        // Check if user has reached their test creation limit
        if (user.testsCreated >= user.testsLimit) {
          return NextResponse.json({
            error: user.isPaid 
              ? 'Test limit reached. Please contact support for assistance.'
              : 'Free test limit reached. Please upgrade to create more tests.',
            limitReached: true,
            currentPlan: user.isPaid ? 'paid' : 'free',
            upgradeRequired: !user.isPaid
          }, { status: 403 });
        }

    // Generate unique test link
    const testLink = nanoid(10);

    // Create the test
    const testData: {
      testName: string;
      description?: string;
      questions: IUnifiedTestQuestion[];
      testLink: string;
      createdBy: string;
      isPublic: boolean;
      showResults: boolean;
      allowAnonymous: boolean;
      timeLimit?: number;
      accessListId?: string;
      isActive: boolean;
      settings: {
        allowAnonymous: boolean;
        showResults: boolean;
        timeLimit?: number;
        isPublic: boolean;
        accessListId?: string;
      };
    } = {
      testName,
      description,
      questions,
      testLink,
      createdBy,
      isPublic,
      showResults,
      allowAnonymous,
      timeLimit,
      isActive: true,
      settings: {
        allowAnonymous,
        showResults,
        timeLimit,
        isPublic
      }
    };

    // Only add accessListId if test is private and accessListId is provided
    if (!isPublic && accessListId) {
      testData.accessListId = accessListId;
      testData.settings.accessListId = accessListId;
    }

    const test = new UnifiedTest(testData);

    await test.save();

        // Update user's test count
        await User.findByIdAndUpdate(user._id, {
          $inc: { testsCreated: 1 }
        });

    return NextResponse.json({ 
      test,
      message: 'Test created successfully'
    });

  } catch (error) {
    console.error('Error creating unified test:', error);
    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    );
  }
}

// GET - Fetch user's tests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query based on type filter
    let query: Record<string, unknown> = { createdBy: session.user.email };
    
    if (type !== 'all') {
      if (type === 'mcq') {
        query = {
          ...query,
          'questions.type': 'mcq',
          'questions': { $not: { $elemMatch: { type: 'qa' } } }
        };
      } else if (type === 'qa') {
        query = {
          ...query,
          'questions.type': 'qa',
          'questions': { $not: { $elemMatch: { type: 'mcq' } } }
        };
      } else if (type === 'mixed') {
        query = {
          ...query,
          'questions.type': { $in: ['mcq', 'qa'] },
          $expr: {
            $gt: [
              { $size: { $setIntersection: ['$questions.type', ['mcq', 'qa']] } },
              1
            ]
          }
        };
      }
    }

    const tests = await UnifiedTest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await UnifiedTest.countDocuments(query);

    return NextResponse.json({ 
      tests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}
