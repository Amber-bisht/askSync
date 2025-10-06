import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TestAttempt from '@/models/TestAttempt';
import Test from '@/models/Test';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { 
      testId, 
      studentId, 
      studentName, 
      studentEmail, 
      answers, 
      timeTaken 
    } = await request.json();

    if (!testId || !studentId || !studentName || !studentEmail || !answers || timeTaken === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the test to calculate score
    const test = await Test.findById(testId);
    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Calculate score
    let score = 0;
    const totalQuestions = test.questions.length;
    
    answers.forEach((answer: { questionIndex: number; selectedAnswer: string }) => {
      const question = test.questions[answer.questionIndex];
      if (question && answer.selectedAnswer === question.correctAnswer) {
        score++;
      }
    });

    // Check if attempt already exists and is completed
    let testAttempt = await TestAttempt.findOne({ testId, studentId });
    
    if (testAttempt && testAttempt.isCompleted) {
      // User has already completed this test
      return NextResponse.json(
        { error: 'You have already submitted this test. Only one submission is allowed per user.' },
        { status: 403 }
      );
    }
    
    if (testAttempt) {
      // Update existing incomplete attempt
      testAttempt.answers = answers;
      testAttempt.score = score;
      testAttempt.timeTaken = timeTaken;
      testAttempt.submittedAt = new Date();
      testAttempt.isCompleted = true;
    } else {
      // Create new attempt
      testAttempt = new TestAttempt({
        testId,
        studentId,
        studentName,
        studentEmail,
        answers,
        score,
        totalQuestions,
        timeTaken,
        submittedAt: new Date(),
        isCompleted: true,
      });
    }

    await testAttempt.save();

    return NextResponse.json({ 
      success: true, 
      score,
      totalQuestions,
      timeTaken,
      answers: testAttempt.answers
    });
  } catch (error) {
    console.error('Error submitting test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to submit test attempt' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const studentId = searchParams.get('studentId');

    if (!testId || !studentId) {
      return NextResponse.json(
        { error: 'Missing query parameters' },
        { status: 400 }
      );
    }

    const testAttempt = await TestAttempt.findOne({ testId, studentId });
    
    if (!testAttempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ testAttempt });
  } catch (error) {
    console.error('Error fetching test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test attempt' },
      { status: 500 }
    );
  }
}
