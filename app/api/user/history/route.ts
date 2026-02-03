import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
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

    // Get last 30 days of attendance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const records = await Attendance.find({
      phone,
      date: { $gte: thirtyDaysAgo }
    })
      .sort({ date: -1 })
      .limit(30);

    const history = records.map(record => ({
      date: new Date(record.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      inTime: record.inTime,
      outTime: record.outTime
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
