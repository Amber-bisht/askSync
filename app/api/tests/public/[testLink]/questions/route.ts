import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UnifiedTest } from '@/models/UnifiedTest';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Fetch questions for a test (only after start)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ testLink: string }> }
) {
    try {
        await connectDB();
        const { testLink } = await params;
        const session = await getServerSession(authOptions);

        const test = await UnifiedTest.findOne({
            testLink: testLink,
            isActive: true
        }).lean() as any;

        if (!test) {
            return NextResponse.json(
                { error: 'Test not found or inactive' },
                { status: 404 }
            );
        }

        const isCreator = session?.user?.email === test.createdBy;

        // Check access control for private tests
        if (!test.isPublic && !isCreator) {
            if (!session?.user?.email) {
                return NextResponse.json(
                    { error: 'Authentication required' },
                    { status: 401 }
                );
            }

            if (test.accessListId) {
                const { validateUserAccess } = await import('@/lib/accessControl');
                const accessResult = await validateUserAccess(session.user.email, {
                    isPrivate: true,
                    accessListId: test.accessListId
                });

                if (!accessResult.hasAccess) {
                    return NextResponse.json(
                        { error: accessResult.reason || 'Access denied' },
                        { status: 403 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: 'Access denied' },
                    { status: 403 }
                );
            }
        }

        // Return questions
        // Security: Strip correct answers and explanations for non-creators
        const questions = test.questions.map((q: any) => {
            if (isCreator) return q;
            const { correctAnswer, explanation, ...publicQ } = q;
            return publicQ;
        });

        return NextResponse.json({ questions });

    } catch (error) {
        console.error('Error fetching test questions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch questions' },
            { status: 500 }
        );
    }
}
