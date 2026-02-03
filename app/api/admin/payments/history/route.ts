import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payment from '@/models/Payment';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    const payments = await Payment.find({ userId })
      .sort({ paymentDate: -1 })
      .limit(10);

    const formattedPayments = payments.map(payment => ({
      _id: payment._id.toString(),
      amount: payment.amount,
      months: payment.months,
      paymentDate: payment.paymentDate.toISOString(),
      expiryDate: payment.expiryDate.toISOString(),
    }));

    return NextResponse.json({ payments: formattedPayments });
  } catch (error: any) {
    console.error('Get payment history error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
