import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import { Form, FormResponse } from '@/models/Form';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { formId, formLink, responses } = body;

    if (!formId && !formLink) {
      return NextResponse.json({ error: 'Form ID or form link is required' }, { status: 400 });
    }

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json({ error: 'Responses are required' }, { status: 400 });
    }

    // Find form by ID or link
    const form = await Form.findOne(
      formId ? { _id: formId } : { formLink: formLink }
    );

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.isActive) {
      return NextResponse.json({ error: 'This form is no longer accepting responses' }, { status: 400 });
    }

    // Check expiry date
    if (form.settings.expiryDate && new Date() > form.settings.expiryDate) {
      return NextResponse.json({ error: 'This form has expired' }, { status: 400 });
    }

    // Check response limit
    if (form.settings.limitResponses && form.responseCount >= form.settings.limitResponses) {
      return NextResponse.json({ error: 'This form has reached its response limit' }, { status: 400 });
    }

    // Get session for user info
    const session = await getServerSession(authOptions);

    // Check authentication requirement (always required now)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required to submit this form' }, { status: 401 });
    }

    // Validate responses against form fields
    const fieldMap = new Map(form.fields.map((field: { 
      id: string; 
      label: string; 
      required: boolean; 
      type: string; 
      options?: string[];
    }) => [field.id, field]));
    const validatedResponses = [];

    for (const response of responses) {
      const field = fieldMap.get(response.fieldId);
      if (!field) {
        continue; // Skip unknown fields
      }

      // Type assertion after null check
      const typedField = field as { 
        id: string; 
        label: string; 
        required: boolean; 
        type: string; 
        options?: string[];
      };

      // Check required fields
      if (typedField.required && (!response.value || response.value === '')) {
        return NextResponse.json({ 
          error: `Field "${typedField.label}" is required` 
        }, { status: 400 });
      }

      // Validate field types and constraints
      if (response.value && response.value !== '') {
        const validation = validateFieldValue(typedField, response.value);
        if (!validation.isValid) {
          return NextResponse.json({ 
            error: `Invalid value for field "${typedField.label}": ${validation.error}` 
          }, { status: 400 });
        }
      }

      validatedResponses.push({
        fieldId: response.fieldId,
        fieldLabel: typedField.label,
        value: response.value
      });
    }

    // Create form response
    const formResponse = new FormResponse({
      formId: form._id.toString(),
      formTitle: form.title,
      responses: validatedResponses,
      submittedBy: session?.user ? {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email
      } : undefined,
      submittedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      isAnonymous: !session?.user
    });

    await formResponse.save();

    // Increment response count
    await Form.findByIdAndUpdate(form._id, {
      $inc: { responseCount: 1 }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Response submitted successfully',
      responseId: formResponse._id
    });
  } catch (error) {
    console.error('Error submitting form response:', error);
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 });
  }
}

function validateFieldValue(field: { type: string; validation?: { min?: number; max?: number; minLength?: number; maxLength?: number; pattern?: string }; options?: string[] }, value: string | string[] | number): { isValid: boolean; error?: string } {
  switch (field.type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return { isValid: false, error: 'Invalid email format' };
      }
      break;

    case 'number':
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { isValid: false, error: 'Must be a number' };
      }
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return { isValid: false, error: `Must be at least ${field.validation.min}` };
      }
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return { isValid: false, error: `Must be at most ${field.validation.max}` };
      }
      break;

    case 'text':
    case 'textarea':
      const strValue = String(value);
      if (field.validation?.minLength && strValue.length < field.validation.minLength) {
        return { isValid: false, error: `Must be at least ${field.validation.minLength} characters` };
      }
      if (field.validation?.maxLength && strValue.length > field.validation.maxLength) {
        return { isValid: false, error: `Must be at most ${field.validation.maxLength} characters` };
      }
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(strValue)) {
          return { isValid: false, error: 'Invalid format' };
        }
      }
      break;

    case 'select':
    case 'radio':
      if (field.options && !field.options.includes(String(value))) {
        return { isValid: false, error: 'Invalid option selected' };
      }
      break;

    case 'checkbox':
      if (!Array.isArray(value)) {
        return { isValid: false, error: 'Checkbox value must be an array' };
      }
      if (field.options) {
        const invalidOptions = value.filter((v: string) => !field.options!.includes(v));
        if (invalidOptions.length > 0) {
          return { isValid: false, error: 'Invalid options selected' };
        }
      }
      break;

    case 'rating':
      const ratingValue = Number(value);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > (field.validation?.max || 5)) {
        return { isValid: false, error: `Rating must be between 1 and ${field.validation?.max || 5}` };
      }
      break;

    case 'date':
      const dateValue = new Date(String(value));
      if (isNaN(dateValue.getTime())) {
        return { isValid: false, error: 'Invalid date format' };
      }
      break;
  }

  return { isValid: true };
}
