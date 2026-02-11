import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import {
  createValidationError,
  createNotFoundError,
  createErrorResponse,
  validateRequiredFields,
  sanitizeInput,
} from '@/lib/api-utils';
import { getISTNow, getISTToday, getISTTomorrow, formatTimeIST } from '@/lib/utils';
import { ERROR_MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequiredFields(body, ['phone']);
    if (!validation.valid) {
      return createValidationError(ERROR_MESSAGES.REQUIRED_FIELD('Phone number'));
    }

    const { phone } = sanitizeInput(body);

    await connectDB();

    // Check if user exists
    const user: any = await User.findOne({ phone }).select('name phone').lean();

    if (!user) {
      return createNotFoundError('Phone number not registered. Please register first.');
    }

    // Check if user already marked IN today (IST)
    const today = getISTToday();
    const tomorrow = getISTTomorrow();

    const existingAttendance: any = await Attendance.findOne({
      phone,
      date: { $gte: today, $lt: tomorrow }
    }).lean();

    if (existingAttendance) {
      return NextResponse.json({
        name: user.name,
        phone: user.phone,
        alreadyIn: true,
        todayInTime: existingAttendance.inTime,
        todayOutTime: existingAttendance.outTime,
      });
    }

    // Create new attendance record with IST time
    const istNow = getISTNow();
    const inTime = formatTimeIST(new Date());
    
    const attendance = new Attendance({
      name: user.name,
      phone: user.phone,
      date: istNow,
      inTime: inTime,
    });

    await attendance.save();

    return NextResponse.json({
      name: user.name,
      phone: user.phone,
      todayInTime: inTime,
      todayOutTime: null,
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      500
    );
  }
}
