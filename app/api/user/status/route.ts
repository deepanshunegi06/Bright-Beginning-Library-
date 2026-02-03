import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';

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
    const user = await User.findOne({ phone });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Use IST timezone
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const today = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

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
    });
  } catch (error: any) {
    console.error('User status error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
