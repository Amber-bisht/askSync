import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Test from '@/models/Test';
import TestAttempt from '@/models/TestAttempt';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return NextResponse.json(
        { error: 'Missing testId parameter' },
        { status: 400 }
      );
    }

    // Verify the test belongs to the user
    const test = await Test.findOne({ 
      _id: testId, 
      createdBy: session.user.email,
      isPublished: true
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get all test attempts for this test
    const attempts = await TestAttempt.find({ testId }).sort({ submittedAt: -1 });

    // Calculate analytics
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(attempt => attempt.isCompleted);
    const completionRate = totalAttempts > 0 ? (completedAttempts.length / totalAttempts) * 100 : 0;

    // Score statistics
    const scores = completedAttempts.map(attempt => attempt.score);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Time statistics (in seconds)
    const timeTaken = completedAttempts.map(attempt => attempt.timeTaken);
    const averageTime = timeTaken.length > 0 ? timeTaken.reduce((a, b) => a + b, 0) / timeTaken.length : 0;

    // Score distribution
    const scoreRanges = {
      '90-100': scores.filter(s => s >= 90).length,
      '80-89': scores.filter(s => s >= 80 && s < 90).length,
      '70-79': scores.filter(s => s >= 70 && s < 80).length,
      '60-69': scores.filter(s => s >= 60 && s < 70).length,
      'Below 60': scores.filter(s => s < 60).length,
    };

    // Question-wise analytics
    const questionAnalytics = test.questions.map((question: { question: string; correctAnswer: string }, index: number) => {
      const questionAttempts = completedAttempts.map(attempt => 
        attempt.answers.find((answer: { questionIndex: number; isCorrect: boolean; selectedAnswer: string }) => answer.questionIndex === index)
      ).filter(Boolean);

      const correctAnswers = questionAttempts.filter(answer => answer?.isCorrect).length;
      const totalAnswers = questionAttempts.length;
      const accuracyRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

      // Get answer distribution
      const answerDistribution: {[key: string]: number} = {};
      questionAttempts.forEach(answer => {
        if (answer) {
          answerDistribution[answer.selectedAnswer] = (answerDistribution[answer.selectedAnswer] || 0) + 1;
        }
      });

      return {
        questionIndex: index,
        question: question.question,
        correctAnswer: question.correctAnswer,
        totalAttempts: totalAnswers,
        correctAttempts: correctAnswers,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
        answerDistribution
      };
    });

    // Recent attempts with user details
    const recentAttempts = completedAttempts.slice(0, 10).map(attempt => ({
      studentName: attempt.studentName,
      studentEmail: attempt.studentEmail,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      timeTaken: attempt.timeTaken,
      submittedAt: attempt.submittedAt,
      percentage: Math.round((attempt.score / attempt.totalQuestions) * 100)
    }));

    // Time-based analytics (attempts per day for last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAttempts30Days = completedAttempts.filter(attempt => 
      attempt.submittedAt && new Date(attempt.submittedAt) >= thirtyDaysAgo
    );

    const attemptsPerDay: {[key: string]: number} = {};
    recentAttempts30Days.forEach(attempt => {
      if (attempt.submittedAt) {
        const date = new Date(attempt.submittedAt).toDateString();
        attemptsPerDay[date] = (attemptsPerDay[date] || 0) + 1;
      }
    });

    return NextResponse.json({
      testInfo: {
        title: test.title,
        topic: test.topic,
        totalQuestions: test.questions.length,
        timeLimit: test.timeLimit,
        createdAt: test.createdAt
      },
      summary: {
        totalAttempts,
        completedAttempts: completedAttempts.length,
        completionRate: Math.round(completionRate * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore,
        lowestScore,
        averageTime: Math.round(averageTime)
      },
      scoreDistribution: scoreRanges,
      questionAnalytics,
      recentAttempts,
      attemptsPerDay
    });

  } catch (error) {
    console.error('Error fetching test analytics:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch test analytics' },
      { status: 500 }
    );
  }
}
