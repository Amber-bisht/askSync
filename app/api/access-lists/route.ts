import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import { AccessList } from '@/models/AccessList';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

// GET /api/access-lists - Get all access lists for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const filter = { createdBy: session.user.email };

    const accessLists = await AccessList.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AccessList.countDocuments(filter);

    return NextResponse.json({
      accessLists,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Error fetching access lists:', error);
    return NextResponse.json({ error: 'Failed to fetch access lists' }, { status: 500 });
  }
}

// POST /api/access-lists - Create a new access list
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Check user limits
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

        // Check if user has reached their access list creation limit
        if (user.accessListsCreated >= user.accessListsLimit) {
          return NextResponse.json({
            error: user.isPaid 
              ? 'Access list limit reached. Please contact support for assistance.'
              : 'Free access list limit reached. Please upgrade to create more access lists.',
            limitReached: true,
            currentPlan: user.isPaid ? 'paid' : 'free',
            upgradeRequired: !user.isPaid
          }, { status: 403 });
        }

    const body = await request.json();
    const { name, description, users = [] } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 });
    }

    // Process users array
    const processedUsers = users.map((user: { email: string; name?: string }) => ({
      email: user.email.toLowerCase(),
      name: user.name || '',
      addedAt: new Date(),
      accessCount: 0
    }));

    // Create access list
    const accessList = new AccessList({
      name,
      description: description || '',
      createdBy: session.user.email,
      users: processedUsers,
      isActive: true,
      usageCount: 0
    });

    await accessList.save();

        // Update user's access list count
        await User.findByIdAndUpdate(user._id, {
          $inc: { accessListsCreated: 1 }
        });

    return NextResponse.json({
      success: true,
      accessList: {
        _id: accessList._id,
        name: accessList.name,
        description: accessList.description,
        userCount: accessList.users.length,
        createdAt: accessList.createdAt,
        usageCount: accessList.usageCount,
        isActive: accessList.isActive
      }
    });
  } catch (error) {
    console.error('Error creating access list:', error);
    return NextResponse.json({ error: 'Failed to create access list' }, { status: 500 });
  }
}
