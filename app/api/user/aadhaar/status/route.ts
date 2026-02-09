import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { message: 'Phone number is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ phone }).select('aadhaarCardImage aadhaarUploadedAt');

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        hasAadhaar: !!user.aadhaarCardImage,
        aadhaarUploadedAt: user.aadhaarUploadedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get Aadhaar status error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
