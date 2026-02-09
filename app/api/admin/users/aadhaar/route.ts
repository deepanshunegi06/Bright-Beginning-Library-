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

    const user = await User.findById(userId).select('aadhaarCardImage aadhaarUploadedAt name phone');

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.aadhaarCardImage) {
      return NextResponse.json(
        { message: 'No Aadhaar card uploaded for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        aadhaarCardImage: user.aadhaarCardImage,
        aadhaarUploadedAt: user.aadhaarUploadedAt,
        name: user.name,
        phone: user.phone,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch Aadhaar error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
