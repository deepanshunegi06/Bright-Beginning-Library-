import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';

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

    // Use IST timezone
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const today = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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
