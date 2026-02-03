import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get expired subscriptions
    const expiredUsers = await User.find({
      subscriptionExpiryDate: { $lt: now }
    }).select('name phone subscriptionExpiryDate');

    // Get expiring soon (within 7 days)
    const expiringSoonUsers = await User.find({
      subscriptionExpiryDate: {
        $gte: now,
        $lte: sevenDaysFromNow
      }
    }).select('name phone subscriptionExpiryDate');

    // Get users with no payment
    const noPaymentUsers = await User.find({
      subscriptionExpiryDate: null
    }).select('name phone');

    return NextResponse.json({
      expired: expiredUsers.map(u => ({
        _id: u._id.toString(),
        name: u.name,
        phone: u.phone,
        expiryDate: u.subscriptionExpiryDate
      })),
      expiringSoon: expiringSoonUsers.map(u => ({
        _id: u._id.toString(),
        name: u.name,
        phone: u.phone,
        expiryDate: u.subscriptionExpiryDate,
        daysLeft: Math.ceil((new Date(u.subscriptionExpiryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      })),
      noPayment: noPaymentUsers.map(u => ({
        _id: u._id.toString(),
        name: u.name,
        phone: u.phone
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
