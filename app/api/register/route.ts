import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, phone } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { message: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if user exists
    let user = await User.findOne({ phone });

    if (!user) {
      // Create new user
      user = await User.create({ name, phone });
    }

    // Check yesterday's attendance
    const yesterdayRecord = await Attendance.findOne({ phone, date: yesterday });
    const forgotYesterday = yesterdayRecord && !yesterdayRecord.outTime;

    // Check today's attendance
    const todayRecord = await Attendance.findOne({ phone, date: today });

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

    // Create new IN record for today
    const now = new Date();
    const inTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    await Attendance.create({
      name: user.name,
      phone: user.phone,
      date: today,
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
