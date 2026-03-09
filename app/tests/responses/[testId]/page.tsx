'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  SparklesIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface TestResponse {
  _id: string;
  testId: string;
  testName: string;
  responses: Array<{
    questionId: string;
    question: string;
    questionType: 'mcq' | 'qa';
    answer: string;
    isCorrect?: boolean;
    pointsEarned?: number;
    maxPoints?: number;
    correctAnswer?: string;
    explanation?: string;
    aiGraded?: boolean;
    aiScore?: number;
    aiPercentage?: number;
    aiFeedback?: string;
    aiStrengths?: string[];
    aiImprovements?: string[];
    aiReasoning?: string;
    manuallyGraded?: boolean;
    manualScore?: number;
    manualFeedback?: string;
  }>;
  submittedBy: {
    userId?: string;
    name?: string;
    email?: string;
  };
  submittedAt: string;
  ipAddress?: string;
  userAgent?: string;
  isAnonymous: boolean;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  isGraded: boolean;
  gradedAt?: string;
}

interface Test {
  _id: string;
  title: string;
  description?: string;
  questions: Array<{
    _id: string;
    question: string;
    type: 'mcq' | 'qa';
    options?: string[];
    points: number;
  }>;
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
  showResults: boolean;
}

export default function TestResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [responses, setResponses] = useState<TestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<TestResponse | null>(null);
  const [gradingQuestion, setGradingQuestion] = useState<string | null>(null);
  const [isBulkGrading, setIsBulkGrading] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const testId = params.testId as string;

  const fetchTestAndResponses = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      // Fetch test details
      const testResponse = await fetch(`/api/tests/${testId}`);
      if (!testResponse.ok) {
        throw new Error('Failed to fetch test');
      }
      const testData = await testResponse.json();
      setTest(testData.test);

      // Fetch responses
      const responsesResponse = await fetch(`/api/tests/${testId}/responses`);
      if (!responsesResponse.ok) {
        throw new Error('Failed to fetch responses');
      }
      const responsesData = await responsesResponse.json();
      setResponses(responsesData.responses);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load test responses');
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    if (testId) {
      fetchTestAndResponses();
    }
  }, [testId, fetchTestAndResponses]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getScoreColor = (percentage?: number) => {
    if (!percentage) return 'text-gray-600';
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAIGrading = async (responseId: string, questionId: string) => {
    if (!selectedResponse) return;

    setGradingQuestion(questionId);
    try {
      const response = await fetch(`/api/tests/responses/${responseId}/grade-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: questionId,
          maxPoints: 10
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Question graded successfully!');

        // Update local state instead of full refresh
        const updatedResponses = responses.map(res => {
          if (res._id === responseId) {
            const updatedQuestionResponses = res.responses.map(q => {
              if (q.questionId === questionId) {
                return {
                  ...q,
                  aiGraded: true,
                  aiScore: data.grading.score,
                  aiPercentage: data.grading.percentage,
                  aiFeedback: data.grading.feedback,
                  aiStrengths: data.grading.strengths || [],
                  aiImprovements: data.grading.improvements || [],
                  aiReasoning: data.grading.reasoning,
                  pointsEarned: Math.min(data.grading.score, q.maxPoints || 1),
                  isCorrect: data.grading.isCorrect
                };
              }
              return q;
            });

            const updatedRes = {
              ...res,
              responses: updatedQuestionResponses,
              totalScore: data.updatedResponse.totalScore,
              maxScore: data.updatedResponse.maxScore,
              percentage: data.updatedResponse.percentage,
              isGraded: true,
              gradedAt: new Date().toISOString()
            };

            if (selectedResponse?._id === responseId) {
              setSelectedResponse(updatedRes);
            }
            return updatedRes;
          }
          return res;
        });

        setResponses(updatedResponses);
      } else {
        toast.error(data.error || 'Failed to grade question');
        if (data.limitReached) {
          toast.error(data.upgradeRequired ? 'Please upgrade to grade more responses' : 'AI grading limit reached');
        }
      }
    } catch (error) {
      console.error('Error grading question:', error);
      toast.error('Failed to grade question');
    } finally {
      setGradingQuestion(null);
    }
  };

  const handleGradeAll = async () => {
    if (!testId) return;

    if (!confirm('Are you sure you want to grade all ungraded answers using AI? This will use your AI grading quota.')) {
      return;
    }

    setIsBulkGrading(true);
    try {
      const response = await fetch(`/api/tests/${testId}/responses/grade-all`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully graded ${data.gradedCount} answers!`);
        if (data.limitReached) {
          toast.error('Process stopped because AI grading limit was reached.');
        }
        // Silent refresh to avoid loading flash
        fetchTestAndResponses(true);
      } else {
        toast.error(data.error || 'Failed to grade all responses');
      }
    } catch (error) {
      console.error('Error bulk grading:', error);
      toast.error('Failed to grade responses');
    } finally {
      setIsBulkGrading(false);
    }
  };

  const handleManualGrading = async (responseId: string, questionId: string, isCorrect: boolean) => {
    if (!selectedResponse) return;

    try {
      const response = await fetch(`/api/tests/responses/${responseId}/manual-grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: questionId,
          isCorrect: isCorrect
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Marked as ${isCorrect ? 'correct' : 'incorrect'}`);

        // Update local state instead of full refresh
        const updatedResponses = responses.map(res => {
          if (res._id === responseId) {
            const updatedQuestionResponses = res.responses.map(q => {
              if (q.questionId === questionId) {
                const pointsEarned = isCorrect ? (q.maxPoints || 1) : 0;
                return {
                  ...q,
                  isCorrect: isCorrect,
                  pointsEarned: pointsEarned,
                  manuallyGraded: true
                };
              }
              return q;
            });

            const updatedRes = {
              ...res,
              responses: updatedQuestionResponses,
              totalScore: data.updatedResponse.totalScore,
              maxScore: data.updatedResponse.maxScore,
              percentage: data.updatedResponse.percentage,
              isGraded: true,
              gradedAt: new Date().toISOString()
            };

            if (selectedResponse?._id === responseId) {
              setSelectedResponse(updatedRes);
            }
            return updatedRes;
          }
          return res;
        });

        setResponses(updatedResponses);
      } else {
        toast.error(data.error || 'Failed to grade question');
      }
    } catch (error) {
      console.error('Error updating manual grade:', error);
      toast.error('Failed to update grade');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/tests/${testId}/export`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${test?.title || 'test'}_results.csv`;
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

  const handleToggleResults = async () => {
    if (!test) return;

    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showResults: !test.showResults
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Results ${!test.showResults ? 'published' : 'hidden'} successfully!`);
        // Update local test state
        setTest(prev => prev ? { ...prev, showResults: !prev.showResults } : null);
      } else {
        toast.error(data.error || 'Failed to update results visibility');
      }
    } catch (error) {
      console.error('Error toggling results:', error);
      toast.error('Failed to update results visibility');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Test Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The test you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 break-words">
                  {test.title}
                </h1>
                {test.description && (
                  <p className="text-gray-400 text-sm sm:text-base mb-4">{test.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-x-6 text-xs sm:text-sm text-gray-400">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    {test.questions.length} questions
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    {responses.length} responses
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    {formatDate(test.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Grade All with AI Button */}
                <button
                  onClick={handleGradeAll}
                  disabled={isBulkGrading || responses.length === 0}
                  className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <SparklesIcon className={`h-4 w-4 mr-2 flex-shrink-0 ${isBulkGrading ? 'animate-spin' : ''}`} />
                  {isBulkGrading ? 'Grading...' : 'Grade AI'}
                </button>

                {/* Export CSV Button */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  Export
                </button>

                {/* Publish/Hide Results Button */}
                <button
                  onClick={handleToggleResults}
                  className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors text-sm ${test.showResults
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  {test.showResults ? (
                    <>
                      <EyeSlashIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      Hide
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      Publish
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Status */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${test.showResults
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-neutral-800 text-gray-300'
              }`}>
              {test.showResults ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                  Results Published
                </>
              ) : (
                <>
                  <EyeSlashIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                  Results Hidden
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Responses List */}
          <div className={`${showMobileDetail ? 'hidden lg:block' : 'block'} lg:col-span-1`}>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm">
              <div className="p-4 sm:p-6 border-b border-neutral-800">
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  Responses ({responses.length})
                </h2>
              </div>

              <div className="max-h-[60vh] lg:max-h-screen overflow-y-auto">
                {responses.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    No responses yet
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800">
                    {responses.map((response) => (
                      <button
                        key={response._id}
                        onClick={() => {
                          setSelectedResponse(response);
                          setShowMobileDetail(true);
                        }}
                        className={`w-full p-4 text-left hover:bg-neutral-800 transition-colors ${selectedResponse?._id === response._id ? 'bg-blue-900/20' : ''
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-white truncate">
                              {response.isAnonymous ? 'Anonymous' : response.submittedBy.name || response.submittedBy.email || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(response.submittedAt)}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {response.percentage !== undefined && (
                              <div className={`text-sm font-bold ${getScoreColor(response.percentage)}`}>
                                {response.percentage}%
                              </div>
                            )}
                            {response.responses.some(r => r.questionType === 'qa' && r.isCorrect === undefined) && (
                              <div className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider">
                                Pending
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Response Details */}
          <div className={`${showMobileDetail ? 'block' : 'hidden lg:block'} lg:col-span-2`}>
            {selectedResponse ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm">
                <div className="p-4 sm:p-6 border-b border-neutral-800">
                  <div className="flex items-center justify-between mb-2 lg:mb-0">
                    <button
                      onClick={() => setShowMobileDetail(false)}
                      className="lg:hidden flex items-center text-blue-500 hover:text-blue-400 mb-2"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-1" />
                      Back to list
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white break-words">
                        {selectedResponse.isAnonymous ? 'Anonymous Response' : selectedResponse.submittedBy.name || selectedResponse.submittedBy.email || 'Unknown User'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm mt-1">
                        <div className="flex items-center text-gray-400">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {formatDate(selectedResponse.submittedAt)}
                        </div>
                        {selectedResponse.percentage !== undefined && (
                          <div className={`font-bold ${getScoreColor(selectedResponse.percentage)}`}>
                            Score: {selectedResponse.percentage}%
                            {selectedResponse.responses.some(r => r.questionType === 'qa' && r.isCorrect === undefined) && (
                              <span className="ml-2 text-yellow-500 text-[10px] uppercase tracking-wider">(Pending)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="space-y-6">
                    {selectedResponse.responses.map((response, index) => {
                      return (
                        <div key={index} className="border border-neutral-800 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-white">
                              Question {index + 1}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {response.isCorrect !== undefined && (
                                <>
                                  {response.isCorrect ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                                  )}
                                  <span className={`text-sm font-medium ${response.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {response.pointsEarned || 0}/{response.maxPoints || 0} pts
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-gray-300 mb-2">
                              {response.question}
                            </p>
                            <div className="bg-neutral-800 rounded-lg p-3">
                              <div className="text-sm text-gray-400 mb-1">Answer:</div>
                              <div className="font-medium text-white">
                                {response.answer}
                              </div>
                            </div>
                          </div>

                          {/* Grading Controls - Only show if not graded */}
                          {response.questionType === 'qa' && (
                            <div className="mt-4 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="text-sm text-gray-400 font-medium">
                                  {response.isCorrect !== undefined ? (
                                    <div className="flex items-center space-x-2">
                                      <span className={response.isCorrect ? 'text-green-500' : 'text-red-500'}>
                                        {response.isCorrect ? '✓ Marked as Correct' : '✗ Marked as Incorrect'}
                                      </span>
                                      {response.manuallyGraded && <span className="text-xs text-neutral-500">(Manual)</span>}
                                    </div>
                                  ) : (
                                    "Grade this answer:"
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {/* Manual Grading Buttons (Toggle) */}
                                  <button
                                    onClick={() => handleManualGrading(selectedResponse._id, response.questionId, true)}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${response.isCorrect === true
                                      ? 'bg-green-600 text-white'
                                      : 'bg-green-900/20 text-green-400 hover:bg-green-900/40 border border-green-800/30'
                                      }`}
                                  >
                                    <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                                    Correct
                                  </button>
                                  <button
                                    onClick={() => handleManualGrading(selectedResponse._id, response.questionId, false)}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${response.isCorrect === false
                                      ? 'bg-red-600 text-white'
                                      : 'bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-800/30'
                                      }`}
                                  >
                                    <XCircleIcon className="h-4 w-4 mr-1.5" />
                                    Wrong
                                  </button>

                                  {/* AI Grading Button - Only if not checked */}
                                  {response.isCorrect === undefined && (
                                    <button
                                      onClick={() => handleAIGrading(selectedResponse._id, response.questionId)}
                                      disabled={gradingQuestion === response.questionId}
                                      className="flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <SparklesIcon className={`h-4 w-4 mr-1.5 ${gradingQuestion === response.questionId ? 'animate-spin' : ''}`} />
                                      {gradingQuestion === response.questionId ? 'Grading...' : 'AI Grade'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}


                          {/* Note for MCQ questions */}
                          {response.questionType === 'mcq' && (
                            <div className="mt-4 p-3 bg-neutral-800 rounded-lg">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <PencilIcon className="h-4 w-4 inline mr-1" />
                                MCQ questions are automatically graded based on the selected option.
                              </div>
                            </div>
                          )}

                          {response.aiFeedback && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mt-3">
                              <div className="text-sm text-gray-400 mb-1">AI Feedback:</div>
                              <div className="text-purple-800 dark:text-purple-200">
                                {response.aiFeedback}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm p-12 text-center">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Select a Response
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a response from the list to view detailed answers.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
