import mongoose from 'mongoose';

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface ITest {
  _id: string;
  title?: string; // Optional for unpublished MCQs
  topic: string;
  reference: string;
  questions: IQuestion[];
  timeLimit?: number; // Optional for unpublished MCQs, in minutes
  testLink?: string; // Optional for unpublished MCQs
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
  isPublished: boolean; // New field to track if MCQ is published as test
  accessControl: {
    isPrivate: boolean;
    accessListId?: string; // Reference to AccessList
    allowedEmails?: string[]; // Direct email list for simple cases
  };
}

const QuestionSchema = new mongoose.Schema<IQuestion>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String },
});

const TestSchema = new mongoose.Schema<ITest>({
  title: { type: String, required: false }, // Optional for unpublished MCQs
  topic: { type: String, required: true },
  reference: { type: String, required: true },
  questions: [QuestionSchema],
  timeLimit: { type: Number, required: false }, // Optional for unpublished MCQs
  testLink: { type: String, required: false, unique: true, sparse: true }, // Optional, sparse index for uniqueness
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: false }, // New field with default false
  accessControl: {
    isPrivate: { type: Boolean, default: false },
    accessListId: { type: String },
    allowedEmails: [{ type: String }]
  }
});

export default mongoose.models.Test || mongoose.model<ITest>('Test', TestSchema);
