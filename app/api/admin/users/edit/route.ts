import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import {
  createValidationError,
  createConflictError,
  createErrorResponse,
  validateRequiredFields,
  sanitizeInput,
} from '@/lib/api-utils';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequiredFields(body, ['userId', 'name', 'phone']);
    if (!validation.valid) {
      return createValidationError(
        `${validation.missing.join(', ')} ${validation.missing.length > 1 ? 'are' : 'is'} required`
      );
    }

    const { userId, name, phone, oldPhone, joiningDate } = sanitizeInput(body);

    await connectDB();

    // Check if new phone number already exists (if phone was changed)
    if (phone !== oldPhone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser && existingUser._id.toString() !== userId) {
        return createConflictError('Phone number already registered to another user');
      }
    }

    // Prepare update data
    const updateData: any = { name, phone };
    
    // Always update joining date field - set to Date if valid, null otherwise
    if (joiningDate && typeof joiningDate === 'string' && joiningDate.trim() !== '') {
      updateData.joiningDate = new Date(joiningDate);
    } else {
      updateData.joiningDate = null;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return createValidationError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Update all attendance records if phone changed
    if (phone !== oldPhone) {
      await Attendance.updateMany(
        { phone: oldPhone },
        { name, phone }
      );
    }

    return NextResponse.json({
      message: SUCCESS_MESSAGES.USER_UPDATED,
      user: {
        _id: updatedUser._id.toString(),
        name: updatedUser.name,
        phone: updatedUser.phone,
        joiningDate: updatedUser.joiningDate,
      },
    });
  } catch (error: any) {
    console.error('Edit user error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      500
    );
  }
}
