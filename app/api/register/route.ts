import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import {
  createValidationError,
  createErrorResponse,
  validateRequiredFields,
  sanitizeInput,
} from '@/lib/api-utils';
import { getISTNow, getISTToday, getISTTomorrow, formatTimeIST } from '@/lib/utils';
import { ONE_DAY_MS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequiredFields(body, ['name', 'phone']);
    if (!validation.valid) {
      return createValidationError(
        `${validation.missing.join(', ')} ${validation.missing.length > 1 ? 'are' : 'is'} required`
      );
    }

    const { name, phone } = sanitizeInput(body);

    // Get today's date (IST)
    const today = getISTToday();
    const tomorrow = getISTTomorrow();
    const yesterday = new Date(today.getTime() - ONE_DAY_MS);

    // Check if user exists
    let user: any = await User.findOne({ phone }).select('name phone').lean();

    if (!user) {
      // Create new user
      const newUser = await User.create({ name, phone });
      user = { _id: newUser._id, name: newUser.name, phone: newUser.phone };
    }

    // Check yesterday's attendance
    const yesterdayRecord: any = await Attendance.findOne({ 
      phone, 
      date: { $gte: yesterday, $lt: today } 
    }).lean();
    const forgotYesterday = yesterdayRecord && !yesterdayRecord.outTime;

    // Check today's attendance
    const todayRecord: any = await Attendance.findOne({ 
      phone, 
      date: { $gte: today, $lt: tomorrow } 
    }).lean();

    if (todayRecord) {
      if (todayRecord.outTime) {
        // Already marked OUT today - cannot mark IN again
        return NextResponse.json({
          name: user.name,
          phone: user.phone,
          alreadyCompletedToday: true,
          forgotYesterday,
        });
      }

      // Already marked IN today
      return NextResponse.json({
        name: user.name,
        phone: user.phone,
        todayInTime: todayRecord.inTime,
        todayOutTime: todayRecord.outTime,
        forgotYesterday,
      });
    }

    // Create new IN record for today (IST)
    const istNow = getISTNow();
    const inTime = formatTimeIST(new Date());

    await Attendance.create({
      name: user.name,
      phone: user.phone,
      date: istNow,
      inTime,
      outTime: null,
    });

    return NextResponse.json({
      name: user.name,
      phone: user.phone,
      todayInTime: inTime,
      todayOutTime: null,
      forgotYesterday,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      500
    );
  }
}
