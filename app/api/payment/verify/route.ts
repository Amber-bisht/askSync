import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated using NextAuth
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, paymentType } = await request.json();
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    await connectDB();
    
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle different payment types
    if (paymentType === 'subscription') {
      // Subscription payment logic
      if (!plan) {
        return NextResponse.json({ error: 'Plan is required for subscription payments' }, { status: 400 });
      }

      // Calculate subscription end date
      const now = new Date();
      let subscriptionEndDate: Date;
      
      if (plan === 'monthly') {
        subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      } else {
        subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 days
      }

        // Update user subscription with new simplified limits
        console.log('Updating user to paid with new limits structure');
        
        const updateResult = await User.findByIdAndUpdate(dbUser._id, {
          $set: {
            isPaid: true,
            subscriptionEndDate,
            expiryDate: subscriptionEndDate,
            razorpayCustomerId: razorpay_payment_id,
            // Update to paid user limits
            testsLimit: 10,
            formsLimit: 10,
            accessListsLimit: 10,
            aiGradingLimit: 20,
            mcqAiLimit: 100,
            questionAiLimit: 100
          }
        }, { new: true, upsert: false });
      
      console.log('User updated successfully:', {
        email: updateResult.email,
        isPaid: updateResult.isPaid,
        testsLimit: updateResult.testsLimit,
        formsLimit: updateResult.formsLimit,
        accessListsLimit: updateResult.accessListsLimit,
        aiGradingLimit: updateResult.aiGradingLimit,
        mcqAiLimit: updateResult.mcqAiLimit,
        questionAiLimit: updateResult.questionAiLimit,
        expiryDate: updateResult.expiryDate
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified and subscription activated',
        subscriptionEndDate,
      });

    } else if (paymentType === 'test-creation') {
      // Test creation payment logic
      // Increment test count
      await User.findByIdAndUpdate(dbUser._id, {
        $inc: { testsCreated: 1 }
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified and test creation allowed',
        testsCreated: dbUser.testsCreated + 1,
      });

    } else {
      return NextResponse.json({ error: 'Invalid payment type. Must be "subscription" or "test-creation"' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
