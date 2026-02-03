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
    const user = await User.findOne({ phone });

    if (!user) {
      return NextResponse.json(
        { message: 'Phone number not registered. Please register first.' },
        { status: 404 }
      );
    }

    // Check if user already marked IN today (IST)
    const now = new Date();
    const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const today = new Date(istNow);
    today.setHours(0, 0, 0, 0);
    
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
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    const attendance = new Attendance({
      name: user.name,
      phone: user.phone,
      date: istTime,
      inTime: istTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }),
    });

    await attendance.save();

    return NextResponse.json({
      name: user.name,
      phone: user.phone
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { message: 'Failed to sign in' },
      { status: 500 }
    );
  }
}
