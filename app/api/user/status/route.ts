import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import { getISTToday, getISTTomorrow } from '@/lib/utils';
import { ONE_DAY_MS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { message: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ phone }).select('name phone joiningDate subscriptionExpiryDate aadhaarCardImage');

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Use IST timezone with utility functions
    const today = getISTToday();
    const tomorrow = getISTTomorrow();
    const yesterday = new Date(today.getTime() - ONE_DAY_MS);

    // Check yesterday's record
    const yesterdayRecord = await Attendance.findOne({ 
      phone, 
      date: { $gte: yesterday, $lt: today } 
    });
    const forgotYesterday = yesterdayRecord && !yesterdayRecord.outTime;

    // Check today's record
    const todayRecord = await Attendance.findOne({ 
      phone, 
      date: { $gte: today, $lt: tomorrow } 
    });

    if (!todayRecord) {
      return NextResponse.json({
        name: user.name,
        phone: user.phone,
        forgotYesterday,
        subscriptionExpiryDate: user.subscriptionExpiryDate,
        joiningDate: user.joiningDate,
        hasAadhaar: !!user.aadhaarCardImage,
      });
    }

    // Check if already completed today
    if (todayRecord.outTime) {
      return NextResponse.json({
        name: user.name,
        phone: user.phone,
        todayInTime: todayRecord.inTime,
        todayOutTime: todayRecord.outTime,
        forgotYesterday,
        alreadyCompletedToday: true,
        subscriptionExpiryDate: user.subscriptionExpiryDate,
        joiningDate: user.joiningDate,
        hasAadhaar: !!user.aadhaarCardImage,
      });
    }

    return NextResponse.json({
      name: user.name,
      phone: user.phone,
      todayInTime: todayRecord.inTime,
      todayOutTime: todayRecord.outTime,
      forgotYesterday,
      subscriptionExpiryDate: user.subscriptionExpiryDate,
      joiningDate: user.joiningDate,
      hasAadhaar: !!user.aadhaarCardImage,
    });
  } catch (error: any) {
    console.error('User status error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
