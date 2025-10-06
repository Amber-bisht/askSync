'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { 
  EyeIcon, 
  TrashIcon, 
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

interface Test {
  _id: string;
  testName: string;
  description?: string;
  testLink: string;
  createdAt: string;
  responseCount: number;
  isActive: boolean;
  isPublic: boolean;
  questions: Array<{
    type: 'mcq' | 'qa';
    points: number;
  }>;
}

export default function UnifiedTestManager() {
  const { data: session } = useSession();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [responses, setResponses] = useState<Array<{
    _id: string;
    isAnonymous: boolean;
    submittedBy?: { email?: string };
    submittedAt: string;
    percentage?: number;
    responses: Array<{
      questionId: string;
      answer: string;
      isCorrect: boolean;
      pointsEarned: number;
      maxPoints: number;
      question: string;
    }>;
  }>>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/tests');
      const data = await response.json();

      if (response.ok) {
        setTests(data.tests);
      } else {
        toast.error(data.error || 'Failed to fetch tests');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to fetch tests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResponses = async (testId: string) => {
    setIsLoadingResponses(true);
    try {
      const response = await fetch(`/api/tests/${testId}/responses`);
      const data = await response.json();

      if (response.ok) {
        setResponses(data.responses);
      } else {
        toast.error(data.error || 'Failed to fetch responses');
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast.error('Failed to fetch responses');
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const deleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Test deleted successfully');
        fetchTests();
        if (selectedTest?._id === testId) {
          setSelectedTest(null);
          setResponses([]);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete test');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
    }
  };

  const copyTestLink = (testLink: string) => {
    const url = `${window.location.origin}/test/${testLink}`;
    navigator.clipboard.writeText(url);
    toast.success('Test link copied to clipboard!');
  };

  const exportToCSV = async (testId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-responses-${testId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
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

  const calculateStats = () => {
    if (!responses.length) return null;

    const totalResponses = responses.length;
    const averageScore = responses.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalResponses;
    const perfectScores = responses.filter(r => r.percentage === 100).length;
    const passingScores = responses.filter(r => (r.percentage || 0) >= 70).length;

    return {
      totalResponses,
      averageScore: Math.round(averageScore),
      perfectScores,
      passingScores,
      passingRate: Math.round((passingScores / totalResponses) * 100)
    };
  };

  const stats = calculateStats();

  useEffect(() => {
    if (session?.user) {
      fetchTests();
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Management</h1>
        <p className="text-gray-600">Manage your tests, view responses, and export data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tests List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Tests</h3>
              <span className="text-sm text-gray-500">{tests.length} tests</span>
            </div>

            {tests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p>No tests created yet</p>
                <p className="text-sm">Go to Create Test tab to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tests.map((test) => (
                  <div
                    key={test._id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTest?._id === test._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTest(test)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{test.testName}</h4>
                        <p className="text-sm text-gray-500">{test.responseCount} responses</p>
                        <p className="text-xs text-gray-400">{formatDate(test.createdAt)}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            test.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {test.isPublic ? 'Public' : 'Private'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {test.questions.length} questions
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyTestLink(test.testLink);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copy test link"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTest(test._id);
                          }}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Delete test"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Test Details and Responses */}
        <div className="lg:col-span-2">
          {selectedTest ? (
            <div className="space-y-6">
              {/* Test Header */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTest.testName}</h2>
                    {selectedTest.description && (
                      <p className="text-gray-600 mt-1">{selectedTest.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyTestLink(selectedTest.testLink)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => fetchResponses(selectedTest._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View Responses
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{selectedTest.responseCount}</div>
                    <div className="text-sm text-gray-600">Total Responses</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedTest.isActive ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-sm text-gray-600">Status</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {formatDate(selectedTest.createdAt)}
                    </div>
                    <div className="text-sm text-gray-600">Created</div>
                  </div>
                </div>
              </div>

              {/* Responses Section */}
              {responses.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Responses</h3>
                      <button
                        onClick={() => exportToCSV(selectedTest._id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                    {stats && (
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-xl font-bold text-blue-600">{stats.totalResponses}</div>
                          <div className="text-sm text-gray-600">Total</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-green-600">{stats.averageScore}%</div>
                          <div className="text-sm text-gray-600">Avg Score</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-purple-600">{stats.perfectScores}</div>
                          <div className="text-sm text-gray-600">Perfect</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-orange-600">{stats.passingRate}%</div>
                          <div className="text-sm text-gray-600">Passing</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {isLoadingResponses ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading responses...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {responses.map((response, index) => (
                          <div key={response._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                                <span className="text-sm text-gray-600">
                                  {response.isAnonymous ? 'Anonymous' : response.submittedBy?.email || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{formatDate(response.submittedAt)}</span>
                                {response.percentage !== undefined && (
                                  <span className={`font-medium ${
                                    response.percentage >= 70 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {response.percentage}%
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3">
                              {response.responses.map((resp: any, respIndex: number) => (
                                <div key={respIndex} className="bg-gray-50 rounded-lg p-3">
                                  <div className="font-medium text-gray-900 mb-2">{resp.question}</div>
                                  <div className="text-sm text-gray-700 mb-1">
                                    Answer: <span className="font-medium">{resp.answer}</span>
                                  </div>
                                  {resp.isCorrect !== undefined && (
                                    <div className="flex items-center space-x-2 text-sm">
                                      <span className={resp.isCorrect ? 'text-green-600' : 'text-red-600'}>
                                        {resp.isCorrect ? 'Correct' : 'Incorrect'}
                                      </span>
                                      <span className="text-gray-500">
                                        ({resp.pointsEarned || 0}/{resp.maxPoints || 0} points)
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Test</h3>
              <p className="text-gray-600">Choose a test from the sidebar to view its details and responses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

