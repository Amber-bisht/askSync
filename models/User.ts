import mongoose from 'mongoose';

export interface IUser {
  _id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
  isPaid: boolean;
  subscriptionEndDate?: Date;
  razorpayCustomerId?: string;
  isTrialUsed?: boolean;
  
  // Test limits
  testsCreated: number;
  testsLimit: number; // 5 for free user, 10 for paid user
  maxFreeTests?: number; // Legacy support
  monthlyTestsUsed?: number;
  maxMonthlyTests?: number;
  
  // Form limits
  formsCreated: number;
  formsLimit: number; // 5 for free user, 10 for paid user
  maxFreeForms?: number; // Legacy support
  monthlyFormsUsed?: number;
  maxMonthlyForms?: number;
  
  // Access list limits
  accessListsCreated: number;
  accessListsLimit: number; // 1 for free user, 10 for paid user
  maxFreeAccessLists?: number; // Legacy support
  monthlyAccessListsUsed?: number;
  maxMonthlyAccessLists?: number;
  
  // AI grading limits
  aiGradingUsed: number;
  aiGradingLimit: number; // 2 for free, 20 for paid user
  maxFreeAiGrading?: number; // Legacy support
  monthlyAiGradingUsed?: number;
  maxMonthlyAiGrading?: number;
  
  // MCQ generation limits
  mcqAiUsed: number;
  mcqAiLimit: number; // 10 for free, 100 for paid
  freeMcqUsed?: number; // Legacy support
  maxFreeMcq?: number; // Legacy support
  monthlyMcqUsed?: number;
  maxMonthlyMcq?: number;
  
  // Question/Answer generation limits
  questionAiUsed: number;
  questionAiLimit: number; // 10 for free, 100 for paid
  freeQaUsed?: number; // Legacy support
  maxFreeQa?: number; // Legacy support
  monthlyQaUsed?: number;
  maxMonthlyQa?: number;
  
  // Expiry date - after this date, update limits to free user limits
  expiryDate?: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isPaid: { type: Boolean, default: false },
  subscriptionEndDate: { type: Date },
  razorpayCustomerId: { type: String },
  isTrialUsed: { type: Boolean, default: false },
  
  // Test limits
  testsCreated: { type: Number, default: 0 },
  testsLimit: { type: Number, default: 5 }, // 5 tests for free users
  maxFreeTests: { type: Number, default: 5 }, // Legacy support
  monthlyTestsUsed: { type: Number, default: 0 },
  maxMonthlyTests: { type: Number, default: 100 },
  
  // Form limits
  formsCreated: { type: Number, default: 0 },
  formsLimit: { type: Number, default: 5 }, // 5 forms for free users
  maxFreeForms: { type: Number, default: 5 }, // Legacy support
  monthlyFormsUsed: { type: Number, default: 0 },
  maxMonthlyForms: { type: Number, default: 10 },
  
  // Access list limits
  accessListsCreated: { type: Number, default: 0 },
  accessListsLimit: { type: Number, default: 1 }, // 1 access list for free users
  maxFreeAccessLists: { type: Number, default: 1 }, // Legacy support
  monthlyAccessListsUsed: { type: Number, default: 0 },
  maxMonthlyAccessLists: { type: Number, default: 10 },
  
  // AI grading limits
  aiGradingUsed: { type: Number, default: 0 },
  aiGradingLimit: { type: Number, default: 2 }, // 2 AI gradings for free users
  maxFreeAiGrading: { type: Number, default: 2 }, // Legacy support
  monthlyAiGradingUsed: { type: Number, default: 0 },
  maxMonthlyAiGrading: { type: Number, default: 20 },
  
  // MCQ generation limits
  mcqAiUsed: { type: Number, default: 0 },
  mcqAiLimit: { type: Number, default: 10 }, // 10 MCQ generations for free users
  freeMcqUsed: { type: Number, default: 0 }, // Legacy support
  maxFreeMcq: { type: Number, default: 5 }, // Legacy support
  monthlyMcqUsed: { type: Number, default: 0 },
  maxMonthlyMcq: { type: Number, default: 100 },
  
  // Question/Answer generation limits
  questionAiUsed: { type: Number, default: 0 },
  questionAiLimit: { type: Number, default: 10 }, // 10 Q&A generations for free users
  freeQaUsed: { type: Number, default: 0 }, // Legacy support
  maxFreeQa: { type: Number, default: 10 }, // Legacy support
  monthlyQaUsed: { type: Number, default: 0 },
  maxMonthlyQa: { type: Number, default: 100 },
  
  // Expiry date
  expiryDate: { type: Date }
});

// Method to check if subscription has expired and update limits accordingly
UserSchema.methods.checkAndUpdateExpiry = async function() {
  if (this.isPaid && this.expiryDate && new Date() > this.expiryDate) {
    // Subscription expired, reset to free user limits
    this.isPaid = false;
    this.testsLimit = 5;
    this.formsLimit = 5;
    this.accessListsLimit = 1;
    this.aiGradingLimit = 2;
    this.mcqAiLimit = 10;
    this.questionAiLimit = 10;
    this.subscriptionEndDate = undefined;
    this.expiryDate = undefined;
    this.razorpayCustomerId = undefined;
    
    await this.save();
    return true; // Limits were updated
  }
  return false; // No update needed
};

// Method to upgrade to paid user limits
UserSchema.methods.upgradeToPaid = async function(subscriptionEndDate: Date) {
  this.isPaid = true;
  this.subscriptionEndDate = subscriptionEndDate;
  this.expiryDate = subscriptionEndDate;
  this.testsLimit = 10;
  this.formsLimit = 10;
  this.accessListsLimit = 10;
  this.aiGradingLimit = 20;
  this.mcqAiLimit = 100;
  this.questionAiLimit = 100;
  
  await this.save();
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
