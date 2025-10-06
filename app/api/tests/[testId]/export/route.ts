import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UnifiedTest, UnifiedTestResponse, IUnifiedTestResponse } from '@/models/UnifiedTest';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { testId } = await params;
    
    // Get the test to check ownership
    const test = await UnifiedTest.findById(testId);
    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }
    
    // Check if user owns the test
    if (test.createdBy !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized to export responses' },
        { status: 403 }
      );
    }
    
    // Get responses
    const responses = await UnifiedTestResponse.find({ testId: testId })
      .sort({ submittedAt: -1 })
      .lean();
    
    // Create CSV content
    const csvHeaders = [
      'Response ID',
      'Submitted At',
      'Submitted By',
      'Is Anonymous',
      'Total Score',
      'Max Score',
      'Percentage',
      'Question ID',
      'Question Type',
      'Question',
      'Answer',
      'Is Correct',
      'Points Earned',
      'Max Points',
      'Correct Answer',
      'Explanation'
    ];
    
    const csvRows = responses.flatMap(response => 
      response.responses.map((resp: IUnifiedTestResponse['responses'][0]) => [
        response._id,
        response.submittedAt,
        response.isAnonymous ? 'Anonymous' : (response.submittedBy?.email || 'Unknown'),
        response.isAnonymous ? 'Yes' : 'No',
        response.totalScore || 0,
        response.maxScore || 0,
        response.percentage || 0,
        resp.questionId,
        resp.questionType,
        `"${resp.question.replace(/"/g, '""')}"`,
        `"${resp.answer.replace(/"/g, '""')}"`,
        resp.isCorrect ? 'Yes' : 'No',
        resp.pointsEarned || 0,
        resp.maxPoints || 0,
        resp.correctAnswer || '',
        `"${(resp.explanation || '').replace(/"/g, '""')}"`
      ])
    );
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="test-responses-${testId}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting test responses:', error);
    return NextResponse.json(
      { error: 'Failed to export responses' },
      { status: 500 }
    );
  }
}

