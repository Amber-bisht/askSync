'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import { ClockIcon, CheckCircleIcon, XCircleIcon, UserIcon, PlayIcon } from '@heroicons/react/24/outline';

interface TestQuestion {
  id: string;
  type: 'mcq' | 'qa';
  question: string;
  options?: string[];
  correctAnswer?: string; // For MCQ questions
  points: number;
  isRequired: boolean;
}

interface Test {
  _id: string;
  testName: string;
  description?: string;
  questions: TestQuestion[];
  settings: {
    allowAnonymous: boolean;
    showResults: boolean;
    timeLimit?: number;
    isPublic: boolean;
  };
  timeLimit?: number;
}


export default function UnifiedTestInterface() {
  const params = useParams();
  const { data: session, status } = useSession();
  const testLink = params.testLink as string;
  
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    totalScore?: number;
    percentage?: number;
    submittedAt?: string;
    responses?: Array<{
      questionId: string;
      answer: string;
      isCorrect: boolean;
      pointsEarned: number;
      maxPoints: number;
    }>;
  } | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    hasAttempted: boolean;
    hasSubmitted: boolean;
    submittedAt?: string;
    score?: number;
    message: string;
  } | null>(null);

  const fetchTest = useCallback(async () => {
    try {
      const response = await fetch(`/api/tests/public/${testLink}`);
      const data = await response.json();

      if (response.ok) {
        setTest(data.test);
        // Don't set time limit until test is started
      } else {
        toast.error(data.error || 'Failed to load test');
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      toast.error('Failed to load test');
    } finally {
      setIsLoading(false);
    }
  }, [testLink]);

  const fetchTestStatus = useCallback(async () => {
    if (!session?.user?.email) return;
    
    try {
      const response = await fetch(`/api/tests/public/${testLink}/status`);
      const data = await response.json();

      if (response.ok) {
        setTestStatus(data);
        if (data.hasSubmitted) {
          setIsSubmitted(true);
          setSubmissionResult({
            percentage: data.score,
            submittedAt: data.submittedAt
          });
        }
      }
    } catch (error) {
      console.error('Error fetching test status:', error);
    }
  }, [testLink, session?.user?.email]);

  const startTest = () => {
    if (!session) {
      // Redirect to login with callback URL
      signIn('google', { callbackUrl: window.location.href });
      return;
    }
    
    if (testStatus?.hasAttempted) {
      toast.error('You have already attempted this test');
      return;
    }
    
    setTestStarted(true);
    if (test?.timeLimit) {
      setTimeRemaining(test.timeLimit * 60); // Convert to seconds
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!test) return;

    // Check if all required questions are answered
    const requiredQuestions = test.questions.filter(q => q.isRequired);
    const unansweredRequired = requiredQuestions.filter(q => !answers[q.id]);

    if (unansweredRequired.length > 0) {
      toast.error(`Please answer all required questions (${unansweredRequired.length} remaining)`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tests/public/${testLink}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer
          }))
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setSubmissionResult(data.result);
        toast.success('Test submitted successfully!');
      } else {
        if (response.status === 401) {
          toast.error('Please log in to submit the test');
          // Redirect to login
          signIn('google', { callbackUrl: window.location.href });
        } else if (response.status === 403) {
          toast.error(data.error || 'You have already submitted this test');
          // Refresh test status
          fetchTestStatus();
        } else {
          throw new Error(data.error || 'Failed to submit test');
        }
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit test');
    } finally {
      setIsSubmitting(false);
    }
  }, [test, answers, testLink, fetchTestStatus]);

  useEffect(() => {
    fetchTest();
  }, [fetchTest]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchTestStatus();
    }
  }, [session?.user?.email, fetchTestStatus]);

  useEffect(() => {
    if (test?.timeLimit && timeRemaining !== null && testStarted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [test?.timeLimit, timeRemaining, testStarted, handleSubmit]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Test Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">The test you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Show start test screen if not started yet
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">📝</div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {test.testName}
            </h1>
            {test.description && (
              <p className="text-lg mb-6 text-gray-600 dark:text-gray-400">
                {test.description}
              </p>
            )}
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Test Information:</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Questions:</span>
                  <span className="font-medium">{test.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Points:</span>
                  <span className="font-medium">{test.questions.reduce((sum, q) => sum + q.points, 0)}</span>
                </div>
                {test.timeLimit && (
                  <div className="flex justify-between">
                    <span>Time Limit:</span>
                    <span className="font-medium">{test.timeLimit} minutes</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Results:</span>
                  <span className="font-medium">{test.settings.showResults ? 'Shown after submission' : 'Not shown'}</span>
                </div>
              </div>
            </div>

            {status === 'loading' ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
              </div>
            ) : session ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                  <UserIcon className="h-5 w-5" />
                  <span className="font-medium">Logged in as: {session.user?.name}</span>
                </div>
                
                {testStatus?.hasSubmitted ? (
                  <div className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="text-red-800 dark:text-red-200 font-medium mb-2">
                        Test Already Completed
                      </div>
                      <div className="text-red-600 dark:text-red-400 text-sm">
                        You have already submitted this test. Only one attempt is allowed.
                      </div>
                      {testStatus.score !== undefined && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Your Score: </span>
                          <span className="text-red-600 dark:text-red-400">{testStatus.score}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={startTest}
                    disabled={testStatus?.hasAttempted}
                    className="w-full px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <PlayIcon className="h-5 w-5" />
                    <span>{testStatus?.hasAttempted ? 'Test Already Attempted' : 'Start Test'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-gray-600 dark:text-gray-400">
                  You need to be logged in to take this test.
                </div>
                <button
                  onClick={startTest}
                  className="w-full px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg transition-colors hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <UserIcon className="h-5 w-5" />
                  <span>Login to Start Test</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Test Submitted Successfully!
            </h1>
            <p className="text-lg mb-6 text-gray-600 dark:text-gray-400">
              Thank you for completing the test.
            </p>
            
            {test.settings.showResults && submissionResult && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6 text-left">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Your Results</h3>
                <div className="grid grid-cols-2 gap-4 text-center mb-6">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{submissionResult.totalScore || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Points Earned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{submissionResult.percentage || 0}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Question Review:</h4>
                  {submissionResult.responses?.map((response: { questionId: string; answer: string; isCorrect: boolean; pointsEarned: number; maxPoints: number }, index: number) => {
                    const question = test.questions.find(q => q.id === response.questionId);
                    return (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="font-medium mb-2 text-gray-900 dark:text-gray-100">
                          {index + 1}. {question?.question}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Your answer: <span className="font-medium">{response.answer}</span>
                        </div>
                        {response.isCorrect !== undefined && (
                          <div className="flex items-center space-x-2 text-sm mb-1">
                            {response.isCorrect ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                            <span className={response.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {response.isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              ({response.pointsEarned || 0}/{response.maxPoints || 0} points)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {test.testName}
            </h1>
            {timeRemaining !== null && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <ClockIcon className="h-5 w-5" />
                <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
          {test.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {test.description}
            </p>
          )}
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {test.questions.length} questions • {test.questions.reduce((sum, q) => sum + q.points, 0)} total points
          </div>
        </div>

        {/* Test Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {test.questions.map((question, index) => (
            <div key={question.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {index + 1}. {question.question}
                  {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({question.points} point{question.points !== 1 ? 's' : ''})</span>
                </h3>
              </div>

              {question.type === 'mcq' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        answers[question.id] === option
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="mr-3 text-blue-600"
                      />
                      <span className="font-medium text-gray-600 dark:text-gray-400 mr-2">
                        {String.fromCharCode(65 + optionIndex)}.
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'qa' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={4}
                />
              )}
            </div>
          ))}

          {/* Submit Button */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

