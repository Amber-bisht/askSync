import mongoose from 'mongoose';

export interface IAnswer {
  questionIndex: number;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
}

export interface ITestAttempt {
  _id: string;
  testId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  answers: IAnswer[];
  score: number;
  totalQuestions: number;
  timeTaken: number; // in seconds
  startedAt: Date;
  submittedAt?: Date;
  isCompleted: boolean;
}

const AnswerSchema = new mongoose.Schema<IAnswer>({
  questionIndex: { type: Number, required: true },
  selectedAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  timeSpent: { type: Number, required: true },
});

const TestAttemptSchema = new mongoose.Schema<ITestAttempt>({
  testId: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  answers: [AnswerSchema],
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  timeTaken: { type: Number, required: true },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  isCompleted: { type: Boolean, default: false },
});

export default mongoose.models.TestAttempt || mongoose.model<ITestAttempt>('TestAttempt', TestAttemptSchema);
