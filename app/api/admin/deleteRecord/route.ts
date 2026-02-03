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
