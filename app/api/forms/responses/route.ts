import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import { Form, FormResponse } from '@/models/Form';
import { authOptions } from '@/lib/auth';

// GET /api/forms/responses - Get responses for user's forms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (formId) {
      // Get responses for a specific form
      const form = await Form.findById(formId);
      if (!form || form.createdBy !== session.user.email) {
        return NextResponse.json({ error: 'Form not found or access denied' }, { status: 404 });
      }

      const responses = await FormResponse.find({ formId })
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await FormResponse.countDocuments({ formId });

      return NextResponse.json({
        responses,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total
        },
        formTitle: form.title
      });
    } else {
      // Get all responses for user's forms
      const userForms = await Form.find({ createdBy: session.user.email }, '_id').lean() as Array<{ _id: string }>;
      const formIds = userForms.map(form => form._id.toString());

      const responses = await FormResponse.find({ formId: { $in: formIds } })
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await FormResponse.countDocuments({ formId: { $in: formIds } });

      return NextResponse.json({
        responses,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total
        }
      });
    }
  } catch (error) {
    console.error('Error fetching form responses:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}
