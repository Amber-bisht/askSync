import mongoose from 'mongoose';

// Interface for individual users in access lists
export interface IAccessUser {
  email: string;
  name?: string;
  addedAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
}

// Interface for access lists
export interface IAccessList {
  _id?: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  users: IAccessUser[];
  isActive: boolean;
  usageCount: number; // How many forms/tests use this list
}

// Mongoose schemas
const AccessUserSchema = new mongoose.Schema<IAccessUser>({
  email: { type: String, required: true },
  name: { type: String },
  addedAt: { type: Date, default: Date.now },
  lastAccessedAt: { type: Date },
  accessCount: { type: Number, default: 0 }
});

const AccessListSchema = new mongoose.Schema<IAccessList>({
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  users: [AccessUserSchema],
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 }
});

// Create indexes for better performance
AccessListSchema.index({ createdBy: 1 });
AccessListSchema.index({ 'users.email': 1 });

export const AccessList = mongoose.models.AccessList || mongoose.model<IAccessList>('AccessList', AccessListSchema);
