import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { name, phone, joiningDate, aadhaarImage } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { message: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Validate phone format (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { message: 'Phone number must be 10 digits' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this phone number already exists' },
        { status: 400 }
      );
    }

    // Get IST time
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);

    // Use provided joining date or default to today
    const joining = joiningDate ? new Date(joiningDate) : istNow;

    // Validate Aadhaar image if provided
    if (aadhaarImage) {
      if (!aadhaarImage.startsWith('data:image/')) {
        return NextResponse.json(
          { message: 'Invalid Aadhaar image format' },
          { status: 400 }
        );
      }
    }

    // Create new user
    const newUser = new User({
      name: name.trim(),
      phone: phone.trim(),
      joiningDate: joining,
      aadhaarCardImage: aadhaarImage || null,
      aadhaarUploadedAt: aadhaarImage ? istNow : null,
    });

    await newUser.save();

    return NextResponse.json(
      {
        message: 'User added successfully',
        user: {
          _id: newUser._id.toString(),
          name: newUser.name,
          phone: newUser.phone,
          joiningDate: newUser.joiningDate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add user error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
