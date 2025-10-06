import mongoose from 'mongoose';

// Base interface for form fields
export interface IFormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'rating' | 'date' | 'question';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  // Question-specific fields
  questionData?: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    imageUrl?: string;
    hasImage: boolean;
    points?: number; // Points for correct answer
    allowPartialCredit?: boolean; // For multiple correct answers
    multipleCorrectAnswers?: string[]; // For questions with multiple correct options
  };
}

// Interface for form templates
export interface IForm {
  _id?: string;
  title: string;
  description?: string;
  type: 'feedback' | 'inquiry' | 'complaint' | 'custom' | 'survey';
  fields: IFormField[];
  formLink: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
  isPublic: boolean;
  allowAnonymous: boolean;
  accessControl: {
    isPrivate: boolean;
    accessListId?: string; // Reference to AccessList
    allowedEmails?: string[]; // Direct email list for simple cases
  };
  settings: {
    showProgressBar: boolean;
    closeAfterSubmission: boolean;
    limitResponses: number;
    expiryDate: Date;
  };
  responseCount: number;
}

// Interface for form responses
export interface IFormResponse {
  _id?: string;
  formId: string;
  formTitle: string;
  responses: {
    fieldId: string;
    fieldLabel: string;
    value: string | string[] | number;
    isCorrect?: boolean; // For question fields
    pointsEarned?: number; // Points earned for this response
    maxPoints?: number; // Maximum points possible for this field
    correctAnswer?: string; // The correct answer for reference
  }[];
  submittedBy?: {
    userId?: string;
    name?: string;
    email?: string;
  };
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isAnonymous: boolean;
  // Scoring fields
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  isGraded?: boolean;
  gradedAt?: Date;
}

// Mongoose schemas
const FormFieldSchema = new mongoose.Schema<IFormField>({
  id: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['text', 'email', 'number', 'textarea', 'select', 'radio', 'checkbox', 'rating', 'date', 'question']
  },
  label: { type: String, required: true },
  placeholder: { type: String },
  required: { type: Boolean, default: false },
  options: [{ type: String }],
  validation: {
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String },
    minLength: { type: Number },
    maxLength: { type: Number }
  },
  questionData: {
    question: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: String },
    explanation: { type: String },
    imageUrl: { type: String },
    hasImage: { type: Boolean, default: false }
  }
});

const FormSchema = new mongoose.Schema<IForm>({
  title: { type: String, required: true },
  description: { type: String },
  type: { 
    type: String, 
    required: true,
    enum: ['feedback', 'inquiry', 'complaint', 'custom', 'survey']
  },
  fields: [FormFieldSchema],
  formLink: { type: String, required: true, unique: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true },
  allowAnonymous: { type: Boolean, default: true },
  accessControl: {
    isPrivate: { type: Boolean, default: false },
    accessListId: { type: String },
    allowedEmails: [{ type: String }]
  },
  settings: {
    showProgressBar: { type: Boolean, default: true },
    closeAfterSubmission: { type: Boolean, default: true },
    limitResponses: { type: Number, default: 1 },
    expiryDate: { type: Date, default: () => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date;
    }}
  },
  responseCount: { type: Number, default: 0 }
});

const FormResponseSchema = new mongoose.Schema<IFormResponse>({
  formId: { type: String, required: true },
  formTitle: { type: String, required: true },
  responses: [{
    fieldId: { type: String, required: true },
    fieldLabel: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
  }],
  submittedBy: {
    userId: { type: String },
    name: { type: String },
    email: { type: String }
  },
  submittedAt: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String },
  isAnonymous: { type: Boolean, default: false }
});

// Create indexes for better performance
FormSchema.index({ formLink: 1 });
FormSchema.index({ createdBy: 1 });
FormSchema.index({ type: 1 });
FormResponseSchema.index({ formId: 1 });
FormResponseSchema.index({ submittedAt: -1 });

export const Form = mongoose.models.Form || mongoose.model<IForm>('Form', FormSchema);
export const FormResponse = mongoose.models.FormResponse || mongoose.model<IFormResponse>('FormResponse', FormResponseSchema);
