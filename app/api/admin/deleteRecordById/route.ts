import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const { recordId } = await request.json();

    if (!recordId) {
      return NextResponse.json(
        { message: 'Record ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    await Attendance.findByIdAndDelete(recordId);

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { message: 'Failed to delete record' },
      { status: 500 }
    );
  }
}
