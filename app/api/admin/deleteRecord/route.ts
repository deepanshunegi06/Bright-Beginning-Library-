import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { getISTToday, getISTTomorrow } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Use IST timezone with utility functions
    const today = getISTToday();
    const tomorrow = getISTTomorrow();

    // Delete today's record
    const result = await Attendance.deleteOne({ 
      phone, 
      date: { $gte: today, $lt: tomorrow } 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: 'No record found for today' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Record deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete record error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
