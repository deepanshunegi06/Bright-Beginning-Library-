import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const { userId, phone } = await request.json();

    if (!userId || !phone) {
      return NextResponse.json(
        { message: 'User ID and phone are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Delete all attendance records
    await Attendance.deleteMany({ phone });

    // Delete user
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: 'User and all records deleted successfully' });
  } catch (error) {
    console.error('User delete error:', error);
    return NextResponse.json(
      { message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
