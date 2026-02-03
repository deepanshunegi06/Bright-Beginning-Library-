import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      date: {
        $gte: start,
        $lte: end
      }
    }).sort({ date: -1, inTime: -1 }).lean();

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

    return NextResponse.json({ records: formattedRecords });
  } catch (error) {
    console.error('Reports fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
