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

    // Use IST timezone
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const today = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());
    
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

    // Mark OUT with IST time
    const outNow = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istOutTime = new Date(outNow.getTime() + istOffset);
    
    // Format time in IST (HH:MM:SS AM/PM)
    const hours = istOutTime.getUTCHours();
    const minutes = istOutTime.getUTCMinutes();
    const seconds = istOutTime.getUTCSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const outTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;

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
