import mongoose from 'mongoose';

// Interface for Unified Test Questions
export interface IUnifiedTestQuestion {
  id: string;
  type: 'mcq' | 'qa';
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  isRequired: boolean;
}

// Interface for Unified Test
export interface IUnifiedTest {
  _id?: string;
  testName: string;
  description?: string;
  questions: IUnifiedTestQuestion[];
  testLink: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
  isPublic: boolean;
  allowAnonymous: boolean;
  showResults: boolean;
  timeLimit?: number; // in minutes
  accessListId?: string; // Reference to AccessList for private tests
  responseCount: number;
  settings: {
    allowAnonymous: boolean;
    showResults: boolean;
    timeLimit?: number;
    isPublic: boolean;
    accessListId?: string;
  };
}

// Interface for Unified Test Response
export interface IUnifiedTestResponse {
  _id?: string;
  testId: string;
  testName: string;
  responses: {
    questionId: string;
    question: string;
    questionType: 'mcq' | 'qa';
    answer: string;
    isCorrect?: boolean;
    pointsEarned?: number;
    maxPoints?: number;
    correctAnswer?: string;
    explanation?: string;
    // AI Grading fields for Q&A
    aiGraded?: boolean;
    aiScore?: number;
    aiPercentage?: number;
    aiFeedback?: string;
    aiStrengths?: string[];
    aiImprovements?: string[];
    aiReasoning?: string;
    manuallyGraded?: boolean;
    manualScore?: number;
    manualFeedback?: string;
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
const UnifiedTestQuestionSchema = new mongoose.Schema<IUnifiedTestQuestion>({
  id: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['mcq', 'qa']
  },
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String },
  explanation: { type: String },
  points: { type: Number, default: 1 },
  isRequired: { type: Boolean, default: true }
});

const UnifiedTestSchema = new mongoose.Schema<IUnifiedTest>({
  testName: { type: String, required: true },
  description: { type: String },
  questions: [UnifiedTestQuestionSchema],
  testLink: { type: String, required: true, unique: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true },
  allowAnonymous: { type: Boolean, default: true },
  showResults: { type: Boolean, default: true },
  timeLimit: { type: Number },
  accessListId: { type: String },
  responseCount: { type: Number, default: 0 },
  settings: {
    allowAnonymous: { type: Boolean, default: true },
    showResults: { type: Boolean, default: true },
    timeLimit: { type: Number },
    isPublic: { type: Boolean, default: true },
    accessListId: { type: String }
  }
});

const UnifiedTestResponseSchema = new mongoose.Schema<IUnifiedTestResponse>({
  testId: { type: String, required: true },
  testName: { type: String, required: true },
  responses: [{
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    questionType: { 
      type: String, 
      required: true,
      enum: ['mcq', 'qa']
    },
    answer: { type: String, required: true },
    isCorrect: { type: Boolean },
    pointsEarned: { type: Number },
    maxPoints: { type: Number },
    correctAnswer: { type: String },
    explanation: { type: String },
    // AI Grading fields
    aiGraded: { type: Boolean, default: false },
    aiScore: { type: Number },
    aiPercentage: { type: Number },
    aiFeedback: { type: String },
    aiStrengths: [{ type: String }],
    aiImprovements: [{ type: String }],
    aiReasoning: { type: String },
    manuallyGraded: { type: Boolean, default: false },
    manualScore: { type: Number },
    manualFeedback: { type: String }
  }],
  submittedBy: {
    userId: { type: String },
    name: { type: String },
    email: { type: String }
  },
  submittedAt: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String },
  isAnonymous: { type: Boolean, default: false },
  totalScore: { type: Number },
  maxScore: { type: Number },
  percentage: { type: Number },
  isGraded: { type: Boolean, default: false },
  gradedAt: { type: Date }
});

// Create indexes for better performance
UnifiedTestSchema.index({ testLink: 1 });
UnifiedTestSchema.index({ createdBy: 1 });
UnifiedTestResponseSchema.index({ testId: 1 });
UnifiedTestResponseSchema.index({ submittedAt: -1 });

export const UnifiedTest = mongoose.models.UnifiedTest || mongoose.model<IUnifiedTest>('UnifiedTest', UnifiedTestSchema);
export const UnifiedTestResponse = mongoose.models.UnifiedTestResponse || mongoose.model<IUnifiedTestResponse>('UnifiedTestResponse', UnifiedTestResponseSchema);

