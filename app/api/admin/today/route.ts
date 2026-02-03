import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get today's date range (IST)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const today = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all today's records using date range
    const records = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ inTime: 1 });

    // Format records for frontend
    const formattedRecords = records.map(record => ({
      _id: record._id.toString(),
      name: record.name,
      phone: record.phone,
      date: new Date(record.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      inTime: record.inTime,
      outTime: record.outTime
    }));

    return NextResponse.json({
      records: formattedRecords,
      count: formattedRecords.length,
      insideCount: formattedRecords.filter((r) => !r.outTime).length,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Admin today error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
