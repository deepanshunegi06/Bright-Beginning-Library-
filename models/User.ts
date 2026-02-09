import mongoose, { Schema, model, models } from 'mongoose';

export interface IUser {
  name: string;
  phone: string;
  joiningDate: Date;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  lastPaymentMonths?: number;
  subscriptionExpiryDate?: Date;
  aadhaarCardImage?: string;
  aadhaarUploadedAt?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  joiningDate: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    },
  },
  lastPaymentDate: {
    type: Date,
  },
  lastPaymentAmount: {
    type: Number,
  },
  lastPaymentMonths: {
    type: Number,
    enum: [1, 3],
  },
  subscriptionExpiryDate: {
    type: Date,
  },
  aadhaarCardImage: {
    type: String,
    default: null,
  },
  aadhaarUploadedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: () => {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    },
  },
});

// Indexes for faster queries
UserSchema.index({ joiningDate: -1 });
UserSchema.index({ subscriptionExpiryDate: 1 });

const User = models.User || model<IUser>('User', UserSchema);

export default User;
