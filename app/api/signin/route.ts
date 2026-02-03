import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { message: 'Phone number is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const user = await User.findOne({ phone }).select('name phone').lean();

    if (!user) {
      return NextResponse.json(
        { message: 'Phone number not registered. Please register first.' },
        { status: 404 }
      );
    }

    // Check if user already marked IN today (IST)
    const now = new Date();
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istNow = new Date(now.getTime() + istOffset);
    const today = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      phone,
      date: { $gte: today, $lt: tomorrow },
      outTime: null
    });

    if (existingAttendance) {
      return NextResponse.json({
        name: user.name,
        phone: user.phone,
        alreadyIn: true
      });
    }

    // Create new attendance record with IST time
    const istTime = new Date(now.getTime() + istOffset);
    
    // Format time in IST (HH:MM:SS AM/PM)
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const seconds = istTime.getUTCSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const inTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;
    
    const attendance = new Attendance({
      name: user.name,
      phone: user.phone,
      date: istTime,
      inTime: inTime,
    });

    await attendance.save();

    return NextResponse.json({
      name: user.name,
      phone: user.phone,
      todayInTime: inTime,
      todayOutTime: null
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { message: 'Failed to sign in' },
      { status: 500 }
    );
  }
}
