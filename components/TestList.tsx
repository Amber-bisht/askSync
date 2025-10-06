'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ListBulletIcon, EyeIcon, ClipboardDocumentIcon, UsersIcon, ClockIcon, ChartBarIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Test {
  _id: string;
  title: string;
  topic: string;
  reference: string;
  timeLimit: number;
  testLink: string;
  createdAt: string;
  isPublished: boolean;
}

interface UnpublishedMcq {
  _id: string;
  topic: string;
  reference: string;
  questions: { question: string; options: string[]; correctAnswer: string; explanation?: string }[];
  createdAt: string;
  isPublished: boolean;
}

export default function TestList() {
  const { data: session } = useSession();
  const [tests, setTests] = useState<Test[]>([]);
  const [unpublishedMcqs, setUnpublishedMcqs] = useState<UnpublishedMcq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [publishData, setPublishData] = useState<{[key: string]: {title: string, timeLimit: number}}>({});
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [testAnalytics, setTestAnalytics] = useState<{[key: string]: {
    recentAttempts: Array<{
      studentName: string;
      studentEmail: string;
      score: number;
      totalQuestions: number;
      percentage: number;
      timeTaken: number;
      submittedAt: string;
    }>;
    questionAnalytics: Array<{
      question: string;
      accuracyRate: number;
      totalAttempts: number;
      correctAttempts: number;
    }>;
    summary: {
      totalAttempts: number;
      completedAttempts: number;
      averageScore: number;
      completionRate: number;
      averageTime: number;
    };
    scoreDistribution: {
      [key: string]: number;
    };
  }}>({});
  const [loadingAnalytics, setLoadingAnalytics] = useState<{[key: string]: boolean}>({});

  const fetchTests = useCallback(async () => {
    if (!session?.user?.email) {
      toast.error('Please sign in to view your tests');
      return;
    }

    try {
      const response = await fetch(`/api/tests?createdBy=${encodeURIComponent(session.user.email)}`);
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
        setUnpublishedMcqs(data.unpublishedMcqs || []);
      } else {
        toast.error('Failed to fetch tests');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to fetch tests');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchTests();
    } else {
      setIsLoading(false);
    }
  }, [session, fetchTests]);

  const copyTestLink = (testLink: string) => {
    const testUrl = `${window.location.origin}/test/${testLink}`;
    navigator.clipboard.writeText(testUrl);
    toast.success('Test link copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePublishDataChange = (mcqId: string, field: 'title' | 'timeLimit', value: string | number) => {
    setPublishData(prev => ({
      ...prev,
      [mcqId]: {
        ...prev[mcqId],
        [field]: value
      }
    }));
  };

  const publishMcq = async (mcqId: string) => {
    const data = publishData[mcqId];
    if (!data?.title || !data?.timeLimit) {
      toast.error('Please provide both title and time limit');
      return;
    }

    // Find the MCQ to get its questions
    const mcq = unpublishedMcqs.find(m => m._id === mcqId);
    if (!mcq) {
      toast.error('MCQ not found');
      return;
    }

    setIsPublishing(mcqId);
    try {
      const response = await fetch('/api/generate-unified-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: mcq.topic || 'MCQ Test',
          reference: mcq.reference || '',
          mcqCount: 0, // No new questions to generate
          qaCount: 0,
          useSameReference: true,
          testName: data.title,
          timeLimit: data.timeLimit,
          isPublic: true,
          showResults: true,
          allowAnonymous: true,
          createdBy: session?.user?.email,
          publishTest: true,
          questions: mcq.questions // Use existing MCQ questions
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('MCQ published as test successfully!');
        
        // Remove from unpublished and add to published tests
        setUnpublishedMcqs(prev => prev.filter(mcq => mcq._id !== mcqId));
        setTests(prev => [result.test, ...prev]);
        
        // Clear publish data for this MCQ
        setPublishData(prev => {
          const newData = { ...prev };
          delete newData[mcqId];
          return newData;
        });
      } else {
        const errorData = await response.json();
        if (errorData.error.includes('limit')) {
          toast.error(errorData.error);
        } else {
          throw new Error('Failed to publish MCQ');
        }
      }
    } catch (error) {
      console.error('Error publishing MCQ:', error);
      toast.error('Failed to publish MCQ as test');
    } finally {
      setIsPublishing(null);
    }
  };

  const fetchTestAnalytics = async (testId: string) => {
    if (testAnalytics[testId] || loadingAnalytics[testId]) {
      return; // Already loaded or loading
    }

    setLoadingAnalytics(prev => ({ ...prev, [testId]: true }));
    try {
      const response = await fetch(`/api/test-analytics?testId=${testId}`);
      if (response.ok) {
        const analytics = await response.json();
        setTestAnalytics(prev => ({ ...prev, [testId]: analytics }));
      } else {
        toast.error('Failed to fetch test analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch test analytics');
    } finally {
      setLoadingAnalytics(prev => ({ ...prev, [testId]: false }));
    }
  };

  const toggleTestExpanded = (testId: string) => {
    if (expandedTest === testId) {
      setExpandedTest(null);
    } else {
      setExpandedTest(testId);
      fetchTestAnalytics(testId);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading tests...</span>
        </div>
      </div>
    );
  }

  if (!session?.user?.email) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <ListBulletIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign in Required</h3>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to view your created tests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <ListBulletIcon className="h-6 w-6 text-primary-600 mr-2" />
          My Tests ({tests.length}) {unpublishedMcqs.length > 0 && `• Saved MCQs (${unpublishedMcqs.length})`}
        </h2>
        
        {/* Unpublished MCQs Section */}
        {unpublishedMcqs.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
              Saved MCQs - Ready to Publish ({unpublishedMcqs.length})
            </h3>
            <div className="space-y-4">
              {unpublishedMcqs.map((mcq) => (
                <div key={mcq._id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        📝 {mcq.topic}
                      </h4>
                      <p className="text-gray-600 text-sm mb-2">
                        <span className="font-medium">Reference:</span> {mcq.reference}
                      </p>
                      <p className="text-gray-500 text-sm">
                        <span className="font-medium">Questions:</span> {mcq.questions.length} MCQs
                      </p>
                      <p className="text-gray-500 text-sm">
                        <span className="font-medium">Generated:</span> {formatDate(mcq.createdAt)}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Unpublished
                    </span>
                  </div>
                  
                  {/* Publish Form */}
                  <div className="border-t border-yellow-200 pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Publish as Test:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Test Title *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter test title"
                          value={publishData[mcq._id]?.title || ''}
                          onChange={(e) => handlePublishDataChange(mcq._id, 'title', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time Limit (minutes) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="300"
                          placeholder="60"
                          value={publishData[mcq._id]?.timeLimit || ''}
                          onChange={(e) => handlePublishDataChange(mcq._id, 'timeLimit', parseInt(e.target.value))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => publishMcq(mcq._id)}
                          disabled={isPublishing === mcq._id || !publishData[mcq._id]?.title || !publishData[mcq._id]?.timeLimit}
                          className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {isPublishing === mcq._id ? 'Publishing...' : 'Publish Test'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Published Tests Section */}
        {tests.length === 0 && unpublishedMcqs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No tests created yet.</p>
            <p className="text-gray-400 text-sm mt-2">
              Generate MCQs using the HOST MCQ TEST tab to get started.
            </p>
          </div>
        ) : tests.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="inline-block w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              Published Tests ({tests.length})
            </h3>
            <div className="space-y-4">
            {tests.map((test) => (
              <div key={test._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {test.title}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-2" />
                        <span>Topic: {test.topic}</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>{test.timeLimit} min</span>
                      </div>
                      <div>
                        <span>Reference: {test.reference}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500">
                      Created: {formatDate(test.createdAt)}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => copyTestLink(test.testLink)}
                      className="text-primary-600 hover:text-primary-700 p-2 rounded-lg hover:bg-primary-50"
                      title="Copy test link"
                    >
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    </button>
                    <a
                      href={`/test/${test.testLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50"
                      title="View test"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </a>
                    <button
                      onClick={() => toggleTestExpanded(test._id)}
                      className="text-purple-600 hover:text-purple-700 p-2 rounded-lg hover:bg-purple-50"
                      title="View analytics"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
                      {test.testLink}
                    </code>
                    <span className="text-xs text-gray-500">
                      Share this link with students
                    </span>
                  </div>
                </div>

                {/* Analytics Panel */}
                {expandedTest === test._id && (
                  <div className="mt-4 border-t border-gray-200 pt-4 bg-gray-50 rounded-b-lg -mx-4 -mb-4 px-4 pb-4">
                    {loadingAnalytics[test._id] ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-3"></div>
                        <span className="text-gray-600 dark:text-gray-400">Loading analytics...</span>
                      </div>
                    ) : testAnalytics[test._id] ? (
                      <div className="space-y-6">
                        {/* Summary Stats */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <ChartBarIcon className="h-5 w-5 text-primary-600 mr-2" />
                            Test Performance Summary
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="text-2xl font-bold text-blue-600">{testAnalytics[test._id].summary.totalAttempts}</div>
                              <div className="text-sm text-gray-600">Total Attempts</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="text-2xl font-bold text-green-600">{testAnalytics[test._id].summary.completedAttempts}</div>
                              <div className="text-sm text-gray-600">Completed</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="text-2xl font-bold text-purple-600">{testAnalytics[test._id].summary.averageScore}%</div>
                              <div className="text-sm text-gray-600">Average Score</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="text-2xl font-bold text-orange-600">{formatDuration(testAnalytics[test._id].summary.averageTime)}</div>
                              <div className="text-sm text-gray-600">Avg Time</div>
                            </div>
                          </div>
                        </div>

                        {/* Score Distribution */}
                        <div>
                          <h5 className="text-md font-medium text-gray-800 mb-3">Score Distribution</h5>
                          <div className="grid grid-cols-5 gap-2">
                            {Object.entries(testAnalytics[test._id].scoreDistribution).map(([range, count]) => (
                              <div key={range} className="bg-white rounded-lg p-3 border text-center">
                                <div className="text-lg font-semibold text-gray-900">{count as number}</div>
                                <div className="text-xs text-gray-600">{range}%</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recent Attempts */}
                        {testAnalytics[test._id].recentAttempts.length > 0 && (
                          <div>
                            <h5 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                              <UsersIcon className="h-4 w-4 text-gray-600 mr-2" />
                              Recent Attempts ({testAnalytics[test._id].recentAttempts.length})
                            </h5>
                            <div className="bg-white rounded-lg border overflow-hidden">
                              <div className="max-h-64 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {testAnalytics[test._id].recentAttempts.map((attempt, idx: number) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">{attempt.studentName}</div>
                                            <div className="text-xs text-gray-500">{attempt.studentEmail}</div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-2">
                                          <div className="flex items-center">
                                            <span className={`text-sm font-medium ${
                                              attempt.percentage >= 90 ? 'text-green-600' :
                                              attempt.percentage >= 70 ? 'text-blue-600' :
                                              attempt.percentage >= 60 ? 'text-yellow-600' :
                                              'text-red-600'
                                            }`}>
                                              {attempt.score}/{attempt.totalQuestions}
                                            </span>
                                            <span className="ml-2 text-xs text-gray-500">({attempt.percentage}%)</span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                          {formatDuration(attempt.timeTaken)}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                          {new Date(attempt.submittedAt).toLocaleDateString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Question-wise Analytics */}
                        {testAnalytics[test._id].questionAnalytics.length > 0 && (
                          <div>
                            <h5 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                              <AcademicCapIcon className="h-4 w-4 text-gray-600 mr-2" />
                              Question Performance
                            </h5>
                            <div className="bg-white rounded-lg border overflow-hidden">
                              <div className="max-h-80 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {testAnalytics[test._id].questionAnalytics.map((qa, idx: number) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                          <div className="text-sm text-gray-900 max-w-xs truncate" title={qa.question}>
                                            Q{idx + 1}: {qa.question}
                                          </div>
                                        </td>
                                        <td className="px-4 py-2">
                                          <div className="flex items-center">
                                            <div className={`text-sm font-medium ${
                                              qa.accuracyRate >= 80 ? 'text-green-600' :
                                              qa.accuracyRate >= 60 ? 'text-yellow-600' :
                                              'text-red-600'
                                            }`}>
                                              {qa.accuracyRate}%
                                            </div>
                                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                              <div 
                                                className={`h-2 rounded-full ${
                                                  qa.accuracyRate >= 80 ? 'bg-green-600' :
                                                  qa.accuracyRate >= 60 ? 'bg-yellow-600' :
                                                  'bg-red-600'
                                                }`}
                                                style={{ width: `${qa.accuracyRate}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                          {qa.correctAttempts}/{qa.totalAttempts}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
