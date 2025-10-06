import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
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

    // Check if subscription has expired and update limits accordingly
    if (dbUser.isPaid && dbUser.expiryDate && new Date() > dbUser.expiryDate) {
          // Subscription expired, reset to free user limits
          await User.findByIdAndUpdate(dbUser._id, {
            isPaid: false,
            testsLimit: 5,
            formsLimit: 5,
            accessListsLimit: 1,
            aiGradingLimit: 2,
            mcqAiLimit: 10,
            questionAiLimit: 10,
            subscriptionEndDate: undefined,
            expiryDate: undefined,
            razorpayCustomerId: undefined
          });
          dbUser.isPaid = false;
          dbUser.testsLimit = 5;
          dbUser.formsLimit = 5;
          dbUser.accessListsLimit = 1;
          dbUser.aiGradingLimit = 2;
          dbUser.mcqAiLimit = 10;
          dbUser.questionAiLimit = 10;
        }


    return NextResponse.json({
      // Test limits
      tests: {
        used: dbUser.isPaid ? (dbUser.monthlyTestsUsed || 0) : (dbUser.testsCreated || 0),
        limit: dbUser.isPaid ? (dbUser.maxMonthlyTests || 100) : (dbUser.testsLimit || 5),
        remaining: dbUser.isPaid 
          ? Math.max(0, (dbUser.maxMonthlyTests || 100) - (dbUser.monthlyTestsUsed || 0))
          : Math.max(0, (dbUser.testsLimit || 5) - (dbUser.testsCreated || 0))
      },
      // Form limits
      forms: {
        used: dbUser.isPaid ? (dbUser.monthlyFormsUsed || 0) : (dbUser.formsCreated || 0),
        limit: dbUser.isPaid ? (dbUser.maxMonthlyForms || 10) : (dbUser.formsLimit || 5),
        remaining: dbUser.isPaid 
          ? Math.max(0, (dbUser.maxMonthlyForms || 10) - (dbUser.monthlyFormsUsed || 0))
          : Math.max(0, (dbUser.formsLimit || 5) - (dbUser.formsCreated || 0))
      },
      // Access list limits
      accessLists: {
        used: dbUser.isPaid ? (dbUser.monthlyAccessListsUsed || 0) : (dbUser.accessListsCreated || 0),
        limit: dbUser.isPaid ? (dbUser.maxMonthlyAccessLists || 10) : (dbUser.accessListsLimit || 1),
        remaining: dbUser.isPaid 
          ? Math.max(0, (dbUser.maxMonthlyAccessLists || 10) - (dbUser.monthlyAccessListsUsed || 0))
          : Math.max(0, (dbUser.accessListsLimit || 1) - (dbUser.accessListsCreated || 0))
      },
      // AI grading limits
      aiGrading: {
        used: dbUser.isPaid ? (dbUser.monthlyAiGradingUsed || 0) : (dbUser.aiGradingUsed || 0),
        limit: dbUser.isPaid ? (dbUser.maxMonthlyAiGrading || 20) : (dbUser.aiGradingLimit || 2),
        remaining: dbUser.isPaid 
          ? Math.max(0, (dbUser.maxMonthlyAiGrading || 20) - (dbUser.monthlyAiGradingUsed || 0))
          : Math.max(0, (dbUser.aiGradingLimit || 2) - (dbUser.aiGradingUsed || 0))
      },
      // MCQ generation limits
      mcqGeneration: {
        used: dbUser.isPaid ? (dbUser.monthlyMcqUsed || 0) : (dbUser.mcqAiUsed || 0),
        limit: dbUser.isPaid ? (dbUser.maxMonthlyMcq || 100) : (dbUser.mcqAiLimit || 10),
        remaining: dbUser.isPaid 
          ? Math.max(0, (dbUser.maxMonthlyMcq || 100) - (dbUser.monthlyMcqUsed || 0))
          : Math.max(0, (dbUser.mcqAiLimit || 10) - (dbUser.mcqAiUsed || 0))
      },
      // Q&A generation limits
      qaGeneration: {
        used: dbUser.isPaid ? (dbUser.monthlyQaUsed || 0) : (dbUser.questionAiUsed || 0),
        limit: dbUser.isPaid ? (dbUser.maxMonthlyQa || 100) : (dbUser.questionAiLimit || 10),
        remaining: dbUser.isPaid 
          ? Math.max(0, (dbUser.maxMonthlyQa || 100) - (dbUser.monthlyQaUsed || 0))
          : Math.max(0, (dbUser.questionAiLimit || 10) - (dbUser.questionAiUsed || 0))
      },
      isPaid: dbUser.isPaid,
      expiryDate: dbUser.expiryDate,
    });
  } catch (error) {
    console.error('Error fetching user limits:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch user limits' },
      { status: 500 }
    );
  }
}
