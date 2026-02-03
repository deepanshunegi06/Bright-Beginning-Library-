import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's attendance record
    const todayRecord = await Attendance.findOne({ 
      phone, 
      date: { $gte: today, $lt: tomorrow } 
    });

    if (!todayRecord) {
      return NextResponse.json(
        { message: 'You are not marked inside today' },
        { status: 400 }
      );
    }

    if (todayRecord.outTime) {
      return NextResponse.json(
        { message: 'You have already marked OUT today' },
        { status: 400 }
      );
    }

    // Mark OUT with server time
    const now = new Date();
    const outTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    todayRecord.outTime = outTime;
    await todayRecord.save();

    return NextResponse.json({
      message: 'Successfully marked OUT',
      outTime,
    });
  } catch (error: any) {
    console.error('Mark OUT error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
