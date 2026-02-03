import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
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

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check yesterday's record
    const yesterdayRecord = await Attendance.findOne({ phone, date: yesterday });
    const forgotYesterday = yesterdayRecord && !yesterdayRecord.outTime;

    // Check today's record
    const todayRecord = await Attendance.findOne({ phone, date: today });

    if (!todayRecord) {
      return NextResponse.json({
        name: user.name,
        phone: user.phone,
        forgotYesterday,
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
      });
    }

    return NextResponse.json({
      name: user.name,
      phone: user.phone,
      todayInTime: todayRecord.inTime,
      todayOutTime: todayRecord.outTime,
      forgotYesterday,
    });
  } catch (error: any) {
    console.error('User status error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
