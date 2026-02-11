import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import {
  createValidationError,
  createConflictError,
  createErrorResponse,
  validateRequiredFields,
  sanitizeInput,
} from '@/lib/api-utils';
import { validatePhone } from '@/lib/utils';
import { getISTNow } from '@/lib/utils';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequiredFields(body, ['name', 'phone']);
    if (!validation.valid) {
      return createValidationError(
        `${validation.missing.join(', ')} ${validation.missing.length > 1 ? 'are' : 'is'} required`
      );
    }

    const { name, phone, joiningDate, aadhaarImage } = sanitizeInput(body);

    // Validate phone format
    if (!validatePhone(phone)) {
      return createValidationError(ERROR_MESSAGES.INVALID_PHONE);
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return createConflictError(ERROR_MESSAGES.PHONE_EXISTS);
    }

    // Use provided joining date (no default)
    const istNow = getISTNow();
    const joining = joiningDate ? new Date(joiningDate) : null;

    // Validate Aadhaar image if provided
    if (aadhaarImage && !aadhaarImage.startsWith('data:image/')) {
      return createValidationError('Invalid Aadhaar image format');
    }

    // Create new user
    const userData: any = {
      name,
      phone,
      aadhaarCardImage: aadhaarImage || null,
      aadhaarUploadedAt: aadhaarImage ? istNow : null,
    };
    
    if (joining) {
      userData.joiningDate = joining;
    }

    const newUser = new User(userData);

    await newUser.save();

    return NextResponse.json(
      {
        message: SUCCESS_MESSAGES.USER_ADDED,
        user: {
          _id: newUser._id.toString(),
          name: newUser.name,
          phone: newUser.phone,
          joiningDate: newUser.joiningDate,
        },
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error: any) {
    console.error('Add user error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      500
    );
  }
}
