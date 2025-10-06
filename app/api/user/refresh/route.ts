import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

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

    // Return updated user data
    return NextResponse.json({
      user: {
        id: dbUser._id.toString(),
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image,
        isPaid: dbUser.isPaid,
        subscriptionEndDate: dbUser.subscriptionEndDate,
        expiryDate: dbUser.expiryDate,
        // Test limits
        testsCreated: dbUser.testsCreated,
        testsLimit: dbUser.testsLimit,
        // Form limits
        formsCreated: dbUser.formsCreated,
        formsLimit: dbUser.formsLimit,
        // Access list limits
        accessListsCreated: dbUser.accessListsCreated,
        accessListsLimit: dbUser.accessListsLimit,
        // AI grading limits
        aiGradingUsed: dbUser.aiGradingUsed,
        aiGradingLimit: dbUser.aiGradingLimit,
        // MCQ generation limits
        mcqAiUsed: dbUser.mcqAiUsed,
        mcqAiLimit: dbUser.mcqAiLimit,
        // Question/Answer generation limits
        questionAiUsed: dbUser.questionAiUsed,
        questionAiLimit: dbUser.questionAiLimit,
      }
    });
  } catch (error) {
    console.error('Error refreshing user data:', error);
    
    return NextResponse.json(
      { error: 'Failed to refresh user data' },
      { status: 500 }
    );
  }
}
