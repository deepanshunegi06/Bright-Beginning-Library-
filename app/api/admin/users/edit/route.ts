import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';

export async function POST(request: NextRequest) {
  try {
    const { userId, name, phone, oldPhone } = await request.json();

    if (!userId || !name || !phone) {
      return NextResponse.json(
        { message: 'User ID, name, and phone are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if new phone number already exists (if phone was changed)
    if (phone !== oldPhone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser && existingUser._id.toString() !== userId) {
        return NextResponse.json(
          { message: 'Phone number already registered to another user' },
          { status: 400 }
        );
      }
    }

    // Update user
    await User.findByIdAndUpdate(userId, { name, phone });

    // Update all attendance records
    await Attendance.updateMany(
      { phone: oldPhone },
      { name, phone }
    );

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { message: 'Failed to update user' },
      { status: 500 }
    );
  }
}
