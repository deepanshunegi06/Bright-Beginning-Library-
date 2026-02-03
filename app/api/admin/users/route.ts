import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();

    const users = await User.find({}).sort({ joiningDate: -1 });

    const usersData = users.map((user) => ({
      _id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      joiningDate: user.joiningDate,
      lastPaymentDate: user.lastPaymentDate,
      lastPaymentAmount: user.lastPaymentAmount,
      lastPaymentMonths: user.lastPaymentMonths,
      subscriptionExpiryDate: user.subscriptionExpiryDate,
      createdAt: user.createdAt
    }));

    return NextResponse.json({ users: usersData });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
