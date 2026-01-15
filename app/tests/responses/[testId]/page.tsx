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

  const testId = params.testId as string;

  const fetchTestAndResponses = useCallback(async () => {
    try {
      setIsLoading(true);

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
        // Refresh the responses to show updated data
        fetchTestAndResponses();
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
        // Refresh the responses to show updated data
        fetchTestAndResponses();
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
        // Refresh the test data
        fetchTestAndResponses();
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

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {test.title}
                </h1>
                {test.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{test.description}</p>
                )}

                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    {test.questions.length} questions
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {responses.length} responses
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Created {formatDate(test.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Export CSV Button */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export CSV
                </button>

                {/* Publish/Hide Results Button */}
                <button
                  onClick={handleToggleResults}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${test.showResults
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  {test.showResults ? (
                    <>
                      <EyeSlashIcon className="h-4 w-4 mr-2" />
                      Hide Results
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Publish Results
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Status */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${test.showResults
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-neutral-800 text-gray-300'
              }`}>
              {test.showResults ? (
                <>
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Results Published
                </>
              ) : (
                <>
                  <EyeSlashIcon className="h-4 w-4 mr-1" />
                  Results Hidden
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Responses List */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-neutral-800">
                <h2 className="text-xl font-semibold text-white">
                  Responses ({responses.length})
                </h2>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {responses.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    No responses yet
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800">
                    {responses.map((response) => (
                      <button
                        key={response._id}
                        onClick={() => setSelectedResponse(response)}
                        className={`w-full p-4 text-left hover:bg-neutral-800 transition-colors ${selectedResponse?._id === response._id ? 'bg-blue-900/20' : ''
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">
                              {response.isAnonymous ? 'Anonymous' : response.submittedBy.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(response.submittedAt)}
                            </div>
                          </div>
                          {response.percentage !== undefined && (
                            <div className={`text-sm font-medium ${getScoreColor(response.percentage)}`}>
                              {response.percentage}%
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Response Details */}
          <div className="lg:col-span-2">
            {selectedResponse ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm">
                <div className="p-6 border-b border-neutral-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {selectedResponse.isAnonymous ? 'Anonymous Response' : selectedResponse.submittedBy.name || 'Unknown User'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {formatDate(selectedResponse.submittedAt)}
                        </div>
                        {selectedResponse.percentage !== undefined && (
                          <div className={`font-medium ${getScoreColor(selectedResponse.percentage)}`}>
                            Score: {selectedResponse.percentage}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
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

                          {/* Grading Controls - Only show for question-answer type questions that are not graded */}
                          {response.questionType === 'qa' && response.isCorrect === undefined && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                  Grade this answer:
                                </div>
                                <div className="flex items-center space-x-2">
                                  {/* Manual Grading Buttons */}
                                  <button
                                    onClick={() => handleManualGrading(selectedResponse._id, response.questionId, true)}
                                    className="flex items-center px-3 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-md text-sm font-medium transition-colors"
                                  >
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Correct
                                  </button>
                                  <button
                                    onClick={() => handleManualGrading(selectedResponse._id, response.questionId, false)}
                                    className="flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md text-sm font-medium transition-colors"
                                  >
                                    <XCircleIcon className="h-4 w-4 mr-1" />
                                    Wrong
                                  </button>

                                  {/* AI Grading Button */}
                                  <button
                                    onClick={() => handleAIGrading(selectedResponse._id, response.questionId)}
                                    disabled={gradingQuestion === response.questionId}
                                    className="flex items-center px-3 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <SparklesIcon className="h-4 w-4 mr-1" />
                                    {gradingQuestion === response.questionId ? 'Grading...' : 'AI Grade'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Already Graded Message */}
                          {response.questionType === 'qa' && response.isCorrect !== undefined && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="text-sm text-green-700 dark:text-green-300 font-medium">
                                ✓ Answer has been graded
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
