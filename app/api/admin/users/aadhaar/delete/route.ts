import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Remove Aadhaar card image
    user.aadhaarCardImage = null;
    user.aadhaarUploadedAt = null;
    await user.save();

    return NextResponse.json(
      { message: 'Aadhaar card deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete Aadhaar error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
