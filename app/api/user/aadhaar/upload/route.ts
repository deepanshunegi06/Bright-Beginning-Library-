import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const { phone, aadhaarImage } = await request.json();

    if (!phone || !aadhaarImage) {
      return NextResponse.json(
        { message: 'Phone number and Aadhaar image are required' },
        { status: 400 }
      );
    }

    // Validate base64 image format
    if (!aadhaarImage.startsWith('data:image/')) {
      return NextResponse.json(
        { message: 'Invalid image format' },
        { status: 400 }
      );
    }

    // Extract MIME type from base64 string
    const mimeTypeMatch = aadhaarImage.match(/data:([^;]+);/);
    if (!mimeTypeMatch || !ALLOWED_TYPES.includes(mimeTypeMatch[1])) {
      return NextResponse.json(
        { message: 'Invalid image type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Estimate base64 size (base64 is ~33% larger than original)
    const base64Data = aadhaarImage.split(',')[1];
    const estimatedSize = (base64Data.length * 3) / 4;

    if (estimatedSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'Image size exceeds 5MB limit. Please upload a smaller image' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user and update Aadhaar card image
    const user = await User.findOne({ phone });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Get current IST time using utility function
    const istTime = new Date();

    user.aadhaarCardImage = aadhaarImage;
    user.aadhaarUploadedAt = istTime;
    await user.save();

    return NextResponse.json(
      {
        message: 'Aadhaar card uploaded successfully',
        uploadedAt: istTime,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload Aadhaar card error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
