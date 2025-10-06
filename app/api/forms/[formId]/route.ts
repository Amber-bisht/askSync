import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import { Form } from '@/models/Form';
import { authOptions } from '@/lib/auth';

// GET /api/forms/[formId] - Get a specific form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    await connectDB();
    const { formId } = await params;

    const form = await Form.findById(formId).lean() as {
      _id: string;
      title: string;
      description: string;
      fields: Array<{
        id: string;
        type: string;
        label: string;
        required: boolean;
        options?: string[];
      }>;
      createdBy: string;
      isPublic: boolean;
      isActive: boolean;
      allowAnonymous: boolean;
      settings: {
        showProgressBar: boolean;
        closeAfterSubmission: boolean;
        limitResponses: number;
        expiryDate: Date;
      };
      createdAt: Date;
      updatedAt: Date;
    } | null;
    
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if user has access to this form
    const session = await getServerSession(authOptions);
    if (form.createdBy !== session?.user?.email && !form.isPublic) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 });
  }
}

// PUT /api/forms/[formId] - Update a form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { formId } = await params;

    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if user owns this form
    if (form.createdBy !== session.user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, fields, settings, isActive, isPublic, allowAnonymous } = body;

    // Update form
    const updatedForm = await Form.findByIdAndUpdate(
      formId,
      {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(fields && { fields }),
        ...(settings && { settings: { ...form.settings, ...settings } }),
        ...(isActive !== undefined && { isActive }),
        ...(isPublic !== undefined && { isPublic }),
        ...(allowAnonymous !== undefined && { allowAnonymous })
      },
      { new: true, lean: true }
    );

    return NextResponse.json({ success: true, form: updatedForm });
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 });
  }
}

// DELETE /api/forms/[formId] - Delete a form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { formId } = await params;

    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if user owns this form
    if (form.createdBy !== session.user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await Form.findByIdAndDelete(formId);

    return NextResponse.json({ success: true, message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 });
  }
}
