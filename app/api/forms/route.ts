import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import { Form } from '@/models/Form';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/forms - Get all forms for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const filter: { createdBy: string; type?: string } = { createdBy: session.user.email };
    if (type && type !== 'all') {
      filter.type = type;
    }

    const forms = await Form.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Form.countDocuments(filter);

    return NextResponse.json({
      forms,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
  }
}

// POST /api/forms - Create a new form
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

        // Check if user has reached their form creation limit
        if (user.formsCreated >= user.formsLimit) {
          return NextResponse.json({
            error: user.isPaid 
              ? 'Form limit reached. Please contact support for assistance.'
              : 'Free form limit reached. Please upgrade to create more forms.',
            limitReached: true,
            currentPlan: user.isPaid ? 'paid' : 'free',
            upgradeRequired: !user.isPaid
          }, { status: 403 });
        }

    const body = await request.json();
    const { title, description, type, fields, settings, allowAnonymous, isPublic, accessControl } = body;

    // Validate required fields
    if (!title || !type || !fields || !Array.isArray(fields)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique form link
    const formLink = `form-${uuidv4().slice(0, 8)}`;

    // Create form
    const form = new Form({
      title,
      description: description || '',
      type,
      fields,
      formLink,
      createdBy: session.user.email,
      isActive: true,
      isPublic: isPublic !== undefined ? isPublic : true,
      allowAnonymous: allowAnonymous !== undefined ? allowAnonymous : true,
      accessControl: {
        isPrivate: accessControl?.isPrivate || false,
        accessListId: accessControl?.accessListId,
        allowedEmails: accessControl?.allowedEmails || []
      },
      settings: {
        showProgressBar: settings?.showProgressBar !== undefined ? settings.showProgressBar : true,
        closeAfterSubmission: settings?.closeAfterSubmission !== undefined ? settings.closeAfterSubmission : true,
        limitResponses: settings?.limitResponses || 1,
        expiryDate: settings?.expiryDate ? new Date(settings.expiryDate) : (() => {
          const date = new Date();
          date.setMonth(date.getMonth() + 1);
          return date;
        })()
      },
      responseCount: 0
    });

    await form.save();

        // Update user's form count
        await User.findByIdAndUpdate(user._id, {
          $inc: { formsCreated: 1 }
        });

        // Get updated user data to return current limits
        const updatedUser = await User.findOne({ email: session.user.email });
        
        return NextResponse.json({
          success: true,
          form: {
            _id: form._id,
            title: form.title,
            type: form.type,
            formLink: form.formLink,
            createdAt: form.createdAt,
            responseCount: form.responseCount,
            isActive: form.isActive
          },
          limits: {
            formsUsed: updatedUser?.formsCreated || 0,
            formsLimit: updatedUser?.formsLimit || 5,
            remaining: Math.max(0, (updatedUser?.formsLimit || 5) - (updatedUser?.formsCreated || 0))
          }
        });
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
  }
}
