import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import { Form } from '@/models/Form';
import { authOptions } from '@/lib/auth';
import { validateUserAccess } from '@/lib/accessControl';

// GET /api/forms/link/[formLink] - Get form by link (public access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formLink: string }> }
) {
  try {
    await connectDB();
    const { formLink } = await params;

    const form = await Form.findOne({ 
      formLink: formLink,
      isActive: true 
    }).lean() as {
      _id: string;
      title: string;
      description: string;
      type: string;
      fields: Array<{
        id: string;
        type: string;
        label: string;
        required: boolean;
        options?: string[];
      }>;
      formLink: string;
      allowAnonymous: boolean;
      settings: {
        expiryDate: Date;
        limitResponses: number;
        showProgressBar: boolean;
        closeAfterSubmission: boolean;
      };
      responseCount: number;
      accessControl: {
        isPrivate: boolean;
        allowAnonymous: boolean;
        accessListId?: string;
      };
    } | null;
    
    if (!form) {
      return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 });
    }

    // Check if form has expired
    if (form.settings.expiryDate && new Date() > form.settings.expiryDate) {
      return NextResponse.json({ error: 'This form has expired' }, { status: 400 });
    }

    // Check if form has reached response limit
    if (form.settings.limitResponses && form.responseCount >= form.settings.limitResponses) {
      return NextResponse.json({ error: 'This form has reached its response limit' }, { status: 400 });
    }

    // Check access control
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email || null;
    
    const accessValidation = await validateUserAccess(userEmail, form.accessControl);
    
    if (!accessValidation.hasAccess) {
      return NextResponse.json({ 
        error: accessValidation.reason || 'Access denied',
        requiresAuth: !userEmail && form.accessControl.isPrivate
      }, { status: 403 });
    }

    // Return form without sensitive information
    const publicForm = {
      _id: form._id,
      title: form.title,
      description: form.description,
      type: form.type,
      fields: form.fields,
      formLink: form.formLink,
      allowAnonymous: form.allowAnonymous,
      settings: {
        showProgressBar: form.settings.showProgressBar,
        closeAfterSubmission: form.settings.closeAfterSubmission,
        limitResponses: form.settings.limitResponses,
        expiryDate: form.settings.expiryDate
      },
      responseCount: form.responseCount
    };

    return NextResponse.json({ form: publicForm });
  } catch (error) {
    console.error('Error fetching form by link:', error);
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 });
  }
}
