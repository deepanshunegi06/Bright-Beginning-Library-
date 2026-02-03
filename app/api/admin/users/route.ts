import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Attendance from '@/models/Attendance';

export async function GET() {
  try {
    await connectDB();

    const users = await User.find({}).sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const totalVisits = await Attendance.countDocuments({ phone: user.phone });

        return {
          _id: user._id.toString(),
          name: user.name,
          phone: user.phone,
          createdAt: user.createdAt,
          totalVisits
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
