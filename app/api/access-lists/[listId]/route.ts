import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import { AccessList } from '@/models/AccessList';
import { authOptions } from '@/lib/auth';

// GET /api/access-lists/[listId] - Get a specific access list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { listId } = await params;

    const accessList = await AccessList.findById(listId).lean() as {
      _id: string;
      createdBy: string;
      name: string;
      description: string;
      users: Array<{
        email: string;
        name: string;
        addedAt: Date;
        lastAccessedAt?: Date;
        accessCount: number;
      }>;
      isActive: boolean;
      usageCount: number;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    
    if (!accessList) {
      return NextResponse.json({ error: 'Access list not found' }, { status: 404 });
    }

    // Check if user owns this access list
    if (accessList.createdBy !== session.user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ accessList });
  } catch (error) {
    console.error('Error fetching access list:', error);
    return NextResponse.json({ error: 'Failed to fetch access list' }, { status: 500 });
  }
}

// PUT /api/access-lists/[listId] - Update an access list
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { listId } = await params;

    const accessList = await AccessList.findById(listId);
    if (!accessList) {
      return NextResponse.json({ error: 'Access list not found' }, { status: 404 });
    }

    // Check if user owns this access list
    if (accessList.createdBy !== session.user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, users, isActive } = body;

    // Process users if provided
    let processedUsers = accessList.users;
    if (users) {
      processedUsers = users.map((user: { email: string; name?: string; addedAt?: string; lastAccessedAt?: string; accessCount?: number }) => ({
        email: user.email.toLowerCase(),
        name: user.name || '',
        addedAt: user.addedAt || new Date(),
        lastAccessedAt: user.lastAccessedAt,
        accessCount: user.accessCount || 0
      }));
    }

    // Update access list
    const updatedAccessList = await AccessList.findByIdAndUpdate(
      listId,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(users && { users: processedUsers }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true, lean: true }
    );

    return NextResponse.json({ success: true, accessList: updatedAccessList });
  } catch (error) {
    console.error('Error updating access list:', error);
    return NextResponse.json({ error: 'Failed to update access list' }, { status: 500 });
  }
}

// DELETE /api/access-lists/[listId] - Delete an access list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { listId } = await params;

    const accessList = await AccessList.findById(listId);
    if (!accessList) {
      return NextResponse.json({ error: 'Access list not found' }, { status: 404 });
    }

    // Check if user owns this access list
    if (accessList.createdBy !== session.user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if the list is being used by any forms or tests
    if (accessList.usageCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete access list that is being used by forms or tests. Please remove it from all forms/tests first.' 
      }, { status: 400 });
    }

    await AccessList.findByIdAndDelete(listId);

    return NextResponse.json({ success: true, message: 'Access list deleted successfully' });
  } catch (error) {
    console.error('Error deleting access list:', error);
    return NextResponse.json({ error: 'Failed to delete access list' }, { status: 500 });
  }
}
