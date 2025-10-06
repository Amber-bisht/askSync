import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UnifiedTest, UnifiedTestResponse } from '@/models/UnifiedTest';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { testId } = await params;
    
    // Get the test to check ownership
    const test = await UnifiedTest.findById(testId);
    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }
    
    // Check if user owns the test
    if (test.createdBy !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized to view responses' },
        { status: 403 }
      );
    }
    
    // Get responses
    const responses = await UnifiedTestResponse.find({ testId: testId })
      .sort({ submittedAt: -1 })
      .lean();
    
    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Error fetching test responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}

