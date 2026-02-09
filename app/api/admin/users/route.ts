import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    // Exclude aadhaarCardImage to reduce payload size and improve performance
    const users = await User.find({})
      .select('name phone joiningDate lastPaymentDate lastPaymentAmount lastPaymentMonths subscriptionExpiryDate aadhaarUploadedAt createdAt')
      .sort({ joiningDate: -1 });

    const usersData = users.map((user) => ({
      _id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      joiningDate: user.joiningDate,
      lastPaymentDate: user.lastPaymentDate,
      lastPaymentAmount: user.lastPaymentAmount,
      lastPaymentMonths: user.lastPaymentMonths,
      subscriptionExpiryDate: user.subscriptionExpiryDate,
      hasAadhaar: !!user.aadhaarUploadedAt,
      aadhaarUploadedAt: user.aadhaarUploadedAt,
      createdAt: user.createdAt
    }));

    const response = NextResponse.json({ users: usersData });
    // Prevent caching for admin data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
