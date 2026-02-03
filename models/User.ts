import mongoose, { Schema, model, models } from 'mongoose';

export interface IUser {
  name: string;
  phone: string;
  registeredAt: Date;
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
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

const User = models.User || model<IUser>('User', UserSchema);

export default User;
