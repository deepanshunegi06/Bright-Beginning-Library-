import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { userId, phone, months, paymentDate: providedDate } = await request.json();

    if (!userId || !phone || !months) {
      return NextResponse.json(
        { message: 'User ID, phone, and months are required' },
        { status: 400 }
      );
    }

    if (![1, 3].includes(months)) {
      return NextResponse.json(
        { message: 'Months must be 1 or 3' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Use provided payment date or default to today
    const paymentDate = providedDate ? new Date(providedDate) : new Date();
    
    // Calculate amount based on months (you can adjust these rates)
    const amount = months === 1 ? 500 : 1400; // Example: ₹500 for 1 month, ₹1400 for 3 months
    
    // Calculate expiry date directly from the payment date
    // This ensures late payments are calculated from when fees were actually paid
    const expiryDate = new Date(paymentDate);
    expiryDate.setMonth(expiryDate.getMonth() + months);

    // Create payment record
    await Payment.create({
      userId,
      phone,
      amount,
      months,
      paymentDate,
      expiryDate,
    });

    // Update user's payment info
    user.lastPaymentDate = paymentDate;
    user.lastPaymentAmount = amount;
    user.lastPaymentMonths = months;
    user.subscriptionExpiryDate = expiryDate;
    await user.save();

    return NextResponse.json({
      message: 'Payment added successfully',
      expiryDate: expiryDate.toISOString(),
      paymentDate: paymentDate.toISOString(),
    });
  } catch (error: any) {
    console.error('Add payment error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
