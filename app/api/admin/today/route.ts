import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const today = new Date().toISOString().split('T')[0];

    // Get all today's records
    const records = await Attendance.find({ date: today }).sort({ inTime: 1 });

    return NextResponse.json({
      records,
      count: records.length,
      insideCount: records.filter((r) => !r.outTime).length,
    });
  } catch (error: any) {
    console.error('Admin today error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
