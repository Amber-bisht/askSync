'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardDocumentListIcon, 
  DocumentTextIcon, 
  EyeIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Submission {
  id: string;
  type: 'test' | 'form';
  title: string;
  submittedAt: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  isGraded?: boolean;
  showResults: boolean;
  testId?: string;
  testLink?: string;
  formId?: string;
  formLink?: string;
}

interface SubmissionsResponse {
  submissions: Submission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function MySubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchSubmissions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/submissions?page=${page}&limit=${pagination.limit}`);
      if (response.ok) {
        const data: SubmissionsResponse = await response.json();
        setSubmissions(data.submissions);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const getScoreColor = (percentage?: number) => {
    if (percentage === undefined) return 'text-gray-500';
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (percentage?: number) => {
    if (percentage === undefined) return <ClockIcon className="h-4 w-4 text-gray-400" />;
    if (percentage >= 80) return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
    if (percentage >= 60) return <ChartBarIcon className="h-4 w-4 text-yellow-600" />;
    return <ChartBarIcon className="h-4 w-4 text-red-600" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubmissionTypeIcon = (type: 'test' | 'form') => {
    if (type === 'test') {
      return <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />;
    }
    return <DocumentTextIcon className="h-5 w-5 text-green-600" />;
  };

  const getSubmissionTypeColor = (type: 'test' | 'form') => {
    if (type === 'test') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
  };

  const handleViewSubmission = (submission: Submission) => {
    if (submission.type === 'test' && submission.testLink) {
      window.open(`/test/${submission.testLink}`, '_blank');
    } else if (submission.type === 'form' && submission.formLink) {
      window.open(`/form/${submission.formLink}`, '_blank');
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchSubmissions(newPage);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Submissions</h2>
            <p className="text-gray-600 dark:text-gray-400">View all your test and form submissions</p>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Submissions</h2>
            <p className="text-gray-600 dark:text-gray-400">View all your test and form submissions</p>
          </div>
        </div>

        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No submissions yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven&apos;t submitted any tests or forms yet. Start by taking a test or filling out a form.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Submissions</h2>
          <p className="text-gray-600 dark:text-gray-400">
            View all your test and form submissions ({pagination.total} total)
          </p>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getSubmissionTypeIcon(submission.type)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {submission.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubmissionTypeColor(submission.type)}`}>
                      {submission.type === 'test' ? 'Test' : 'Form'}
                    </span>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(submission.submittedAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Score Display - Only for tests with results */}
                {submission.type === 'test' && submission.showResults && submission.isGraded && (
                  <div className="flex items-center space-x-2">
                    {getScoreIcon(submission.percentage)}
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(submission.percentage)}`}>
                        {submission.score !== undefined && submission.maxScore !== undefined
                          ? `${submission.score}/${submission.maxScore}`
                          : submission.percentage !== undefined
                          ? `${submission.percentage}%`
                          : 'N/A'
                        }
                      </div>
                      {submission.percentage !== undefined && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {submission.percentage}%
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="text-right">
                  {submission.type === 'test' ? (
                    submission.showResults ? (
                      submission.isGraded ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Graded
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                          Pending
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        Submitted
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                      Completed
                    </span>
                  )}
                </div>

                {/* View Button */}
                <button
                  onClick={() => handleViewSubmission(submission)}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="View submission"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {submission.type === 'test' ? (
                submission.showResults && !submission.isGraded ? (
                  <p className="text-yellow-600 dark:text-yellow-400">
                    Results will be available once grading is complete.
                  </p>
                ) : !submission.showResults ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    Results are not published for this test.
                  </p>
                ) : null
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Form submitted successfully. Thank you for your feedback!
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
