import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateUserToPaidLimits } from '@/lib/userLimits';

export async function POST() {
  try {
    // Check if user is authenticated using NextAuth
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user to paid status with dynamic limits
    const paidLimits = updateUserToPaidLimits();
    console.log('Fixing user limits:', { email: dbUser.email, currentIsPaid: dbUser.isPaid, paidLimits });
    
    const updatedUser = await User.findByIdAndUpdate(
      dbUser._id,
      {
        $set: {
          isPaid: true,
          subscriptionEndDate: dbUser.subscriptionEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Keep existing or 30 days from now
          maxMonthlyTests: 100,
          maxMonthlyForms: 10,
          maxMonthlyAiGrading: 20,
          maxMonthlyMcq: 100,
          maxMonthlyQa: 100,
          maxMonthlyAccessLists: 10,
          monthlyTestsUsed: 0,
          monthlyFormsUsed: 0,
          monthlyAccessListsUsed: 0,
          monthlyAiGradingUsed: 0,
          monthlyMcqUsed: 0,
          monthlyQaUsed: 0,
          currentMonthStart: new Date()
        }
      },
      { new: true }
    );
    
    console.log('User limits fixed:', {
      email: updatedUser.email,
      isPaid: updatedUser.isPaid,
      maxMonthlyTests: updatedUser.maxMonthlyTests,
      maxMonthlyForms: updatedUser.maxMonthlyForms,
      maxMonthlyAiGrading: updatedUser.maxMonthlyAiGrading,
      maxMonthlyMcq: updatedUser.maxMonthlyMcq,
      maxMonthlyQa: updatedUser.maxMonthlyQa,
      maxMonthlyAccessLists: updatedUser.maxMonthlyAccessLists
    });

    return NextResponse.json({
      success: true,
      message: 'User upgraded to paid status with dynamic limits',
      user: {
        email: updatedUser.email,
        isPaid: updatedUser.isPaid,
        subscriptionEndDate: updatedUser.subscriptionEndDate,
        limits: {
          tests: updatedUser.maxMonthlyTests,
          forms: updatedUser.maxMonthlyForms,
          accessLists: updatedUser.maxMonthlyAccessLists,
          aiGrading: updatedUser.maxMonthlyAiGrading,
          mcqGeneration: updatedUser.maxMonthlyMcq,
          qaGeneration: updatedUser.maxMonthlyQa
        }
      }
    });
  } catch (error) {
    console.error('Error upgrading user to paid:', error);
    
    return NextResponse.json(
      { error: 'Failed to upgrade user to paid status' },
      { status: 500 }
    );
  }
}
