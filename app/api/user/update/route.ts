import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';

export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json();

    if (!phone || !name) {
      return NextResponse.json(
        { message: 'Phone and name are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Update user
    const user = await User.findOneAndUpdate(
      { phone },
      { name },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Update attendance records
    await Attendance.updateMany(
      { phone },
      { name }
    );

    return NextResponse.json({
      message: 'Profile updated successfully',
      name: user.name
    });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
