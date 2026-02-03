import mongoose, { Schema, model, models } from 'mongoose';

export interface IUser {
  name: string;
  phone: string;
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = models.User || model<IUser>('User', UserSchema);

export default User;
