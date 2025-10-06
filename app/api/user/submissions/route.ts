import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { UnifiedTest, UnifiedTestResponse } from '@/models/UnifiedTest';
import { Form, FormResponse } from '@/models/Form';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Fetch test submissions
    const testSubmissions = await UnifiedTestResponse.find({
      'submittedBy.email': session.user.email
    })
    .sort({ submittedAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

    // Fetch form submissions
    const formSubmissions = await FormResponse.find({
      'submittedBy.email': session.user.email
    })
    .sort({ submittedAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

    // Get test details for test submissions
    const testIds = Array.from(new Set(testSubmissions.map(s => s.testId)));
    const tests = await UnifiedTest.find({ _id: { $in: testIds } })
      .select('_id testName showResults testLink')
      .lean();
    const testMap = new Map(tests.map(t => [(t._id as any).toString(), t]));

    // Get form details for form submissions
    const formIds = Array.from(new Set(formSubmissions.map(s => s.formId)));
    const forms = await Form.find({ _id: { $in: formIds } })
      .select('_id title type formLink')
      .lean();
    const formMap = new Map(forms.map(f => [(f._id as any).toString(), f]));

    // Combine and sort all submissions by date
    const allSubmissions = [
      ...testSubmissions.map(submission => {
        const test = testMap.get(submission.testId);
        return {
          id: submission._id,
          type: 'test',
          title: submission.testName,
          submittedAt: submission.submittedAt,
          score: submission.totalScore,
          maxScore: submission.maxScore,
          percentage: submission.percentage,
          isGraded: submission.isGraded,
          showResults: test?.showResults || false,
          testId: test?._id,
          testLink: test?.testLink
        };
      }),
      ...formSubmissions.map(submission => {
        const form = formMap.get(submission.formId);
        return {
          id: submission._id,
          type: 'form',
          title: submission.formTitle,
          submittedAt: submission.submittedAt,
          score: submission.totalScore,
          maxScore: submission.maxScore,
          percentage: submission.percentage,
          isGraded: submission.isGraded,
          showResults: false, // Forms don't have scoring/results
          formId: form?._id,
          formLink: form?.formLink
        };
      })
    ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    // Get total counts for pagination
    const totalTestSubmissions = await UnifiedTestResponse.countDocuments({
      'submittedBy.email': session.user.email
    });

    const totalFormSubmissions = await FormResponse.countDocuments({
      'submittedBy.email': session.user.email
    });

    const totalSubmissions = totalTestSubmissions + totalFormSubmissions;

    return NextResponse.json({
      submissions: allSubmissions,
      pagination: {
        page,
        limit,
        total: totalSubmissions,
        totalPages: Math.ceil(totalSubmissions / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
