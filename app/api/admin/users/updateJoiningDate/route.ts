import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { userId, joiningDate } = await request.json();

    if (!userId || !joiningDate) {
      return NextResponse.json(
        { message: 'User ID and joining date are required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    user.joiningDate = new Date(joiningDate);
    await user.save();

    return NextResponse.json({ message: 'Joining date updated successfully' });
  } catch (error: any) {
    console.error('Update joining date error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
