import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UnifiedTest, IUnifiedTestQuestion, IUnifiedTest } from '@/models/UnifiedTest';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Fetch a specific test
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

    const test = await UnifiedTest.findOne({
      _id: testId,
      createdBy: session.user.email
    }).lean() as IUnifiedTest | null;

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or access denied' },
        { status: 404 }
      );
    }

    // Debug logging
    console.log('GET test data from database:', {
      testId: test._id,
      isPublic: test.isPublic,
      accessListId: test.accessListId,
      settingsAccessListId: test.settings?.accessListId,
      fullTest: test
    });

    return NextResponse.json({ test });

  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test' },
      { status: 500 }
    );
  }
}

// PUT - Update a test
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      testName,
      description,
      questions,
      timeLimit,
      isPublic,
      showResults,
      allowAnonymous,
      accessListId
    } = await request.json();

    // Debug logging
    console.log('Test update request received:', {
      testName,
      isPublic,
      accessListId,
      hasAccessListId: !!accessListId
    });

    if (!testName || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Test name and questions are required' },
        { status: 400 }
      );
    }

    await connectDB();
    const { testId } = await params;

    // Debug: Check current test state
    const currentTest = await UnifiedTest.findOne({ _id: testId, createdBy: session.user.email });
    console.log('Current test state:', {
      testId,
      currentIsPublic: currentTest?.isPublic,
      currentAccessListId: currentTest?.accessListId,
      currentSettingsAccessListId: currentTest?.settings?.accessListId
    });

    // Prepare update data
    const updateData: {
      testName?: string;
      description?: string;
      questions?: IUnifiedTestQuestion[];
      timeLimit?: number;
      isPublic?: boolean;
      showResults?: boolean;
      allowAnonymous?: boolean;
      accessListId?: string;
      updatedAt?: Date;
      settings?: {
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
      timeLimit,
      isPublic,
      showResults,
      allowAnonymous,
      settings: {
        allowAnonymous,
        showResults,
        timeLimit,
        isPublic
      },
      updatedAt: new Date()
    };

    // Only add accessListId if test is private and accessListId is provided
    if (!isPublic && accessListId) {
      updateData.accessListId = accessListId;
      if (updateData.settings) {
        updateData.settings.accessListId = accessListId;
      }
    } else if (isPublic) {
      // For public tests, explicitly set accessListId to undefined to clear it
      updateData.accessListId = undefined;
      if (updateData.settings) {
        updateData.settings.accessListId = undefined;
      }
    }

    // Debug logging
    console.log('Updating test with data:', {
      testId,
      isPublic,
      accessListId,
      updateAccessListId: updateData.accessListId,
      settingsAccessListId: updateData.settings?.accessListId
    });

    // Find and update the test
    const test = await UnifiedTest.findOneAndUpdate(
      { _id: testId, createdBy: session.user.email },
      updateData,
      { new: true }
    );

    // Debug: Check if test was found
    if (!test) {
      console.log('Test not found:', { testId, createdBy: session.user.email });
    } else {
      // Debug: Check if the update actually worked
      console.log('Test found after update:', {
        testId: test._id,
        isPublic: test.isPublic,
        accessListId: test.accessListId,
        settingsAccessListId: test.settings?.accessListId
      });
    }

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or access denied' },
        { status: 404 }
      );
    }

    // Debug logging
    console.log('Test updated successfully:', {
      testId: test._id,
      isPublic: test.isPublic,
      accessListId: test.accessListId,
      settingsAccessListId: test.settings?.accessListId
    });

    return NextResponse.json({ 
      test,
      message: 'Test updated successfully'
    });

  } catch (error) {
    console.error('Error updating test:', error);
    return NextResponse.json(
      { error: 'Failed to update test' },
      { status: 500 }
    );
  }
}

// PATCH - Update specific test properties
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData = await request.json();
    await connectDB();
    const { testId } = await params;

    // Only allow updating specific fields
    const allowedFields = ['showResults', 'isPublic', 'isActive'];
    const filteredUpdateData: Partial<typeof updateData> = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    }

    // Also update settings if showResults is being updated
    if (updateData.showResults !== undefined) {
      filteredUpdateData['settings.showResults'] = updateData.showResults;
    }

    const test = await UnifiedTest.findOneAndUpdate(
      { _id: testId, createdBy: session.user.email },
      filteredUpdateData,
      { new: true }
    );

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      test,
      message: 'Test updated successfully'
    });

  } catch (error) {
    console.error('Error updating test:', error);
    return NextResponse.json(
      { error: 'Failed to update test' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a test
export async function DELETE(
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

    const test = await UnifiedTest.findOneAndDelete({
      _id: testId,
      createdBy: session.user.email
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Test deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting test:', error);
    return NextResponse.json(
      { error: 'Failed to delete test' },
      { status: 500 }
    );
  }
}