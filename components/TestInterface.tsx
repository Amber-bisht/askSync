'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface Test {
  _id: string;
  title: string;
  topic: string;
  reference: string;
  questions: Question[];
  timeLimit: number;
  testLink: string;
}

interface TestInterfaceProps {
  test: Test;
  user: { id?: string; name: string; email: string };
}

export default function TestInterface({ test, user }: TestInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [timeLeft, setTimeLeft] = useState(test.timeLimit * 60); // Convert to seconds
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<{
    score: number;
    totalQuestions: number;
    timeTaken: number;
  } | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [existingAttempt, setExistingAttempt] = useState<{ score: number; submittedAt: string } | null>(null);
  const [isCheckingAttempt, setIsCheckingAttempt] = useState(true);

  const handleSubmitTest = useCallback(async () => {
    if (isSubmitting || !startTime) return;

    setIsSubmitting(true);
    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      
      const answerData = Object.entries(answers).map(([questionIndex, selectedAnswer]) => ({
        questionIndex: parseInt(questionIndex),
        selectedAnswer,
        isCorrect: false, // Will be calculated on backend
        timeSpent: 0, // Could track individual question time if needed
      }));

      const response = await fetch('/api/test-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: test._id,
          studentId: user.id || user.email,
          studentName: user.name,
          studentEmail: user.email,
          answers: answerData,
          timeTaken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults(data);
        setIsTestComplete(true);
        toast.success('Test submitted successfully!');
      } else {
        const errorData = await response.json();
        if (response.status === 403) {
          // User already submitted
          toast.error(errorData.error);
          setIsTestComplete(true);
          return;
        }
        throw new Error(errorData.error || 'Failed to submit test');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, test._id, user, startTime, isSubmitting]);

  // Check for existing attempt on load
  useEffect(() => {
    const checkExistingAttempt = async () => {
      try {
        const response = await fetch(`/api/test-attempts?testId=${test._id}&studentId=${encodeURIComponent(user.id || user.email)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.testAttempt && data.testAttempt.isCompleted) {
            setExistingAttempt(data.testAttempt);
            setTestResults({
              score: data.testAttempt.score,
              totalQuestions: data.testAttempt.totalQuestions,
              timeTaken: data.testAttempt.timeTaken
            });
            setIsTestComplete(true);
          }
        }
      } catch (error) {
        console.error('Error checking existing attempt:', error);
      } finally {
        setIsCheckingAttempt(false);
      }
    };

    checkExistingAttempt();
  }, [test._id, user]);

  // Timer countdown - only starts when test has started
  useEffect(() => {
    if (!hasStarted || timeLeft <= 0 || isTestComplete) {
      if (hasStarted && timeLeft <= 0 && !isTestComplete) {
        handleSubmitTest();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isTestComplete, hasStarted, handleSubmitTest]);

  const handleStartTest = () => {
    setHasStarted(true);
    setStartTime(Date.now());
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionIndex: number, selectedAnswer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedAnswer
    }));
  };

  const getProgressPercentage = () => {
    return (Object.keys(answers).length / test.questions.length) * 100;
  };

  if (isCheckingAttempt) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking your test status...</p>
        </div>
      </div>
    );
  }

  if (isTestComplete && testResults) {
    return (
      <div className="card">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {existingAttempt ? 'You have already submitted this test!' : 'Test Complete!'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {existingAttempt ? 'Here are your previous results' : 'Here are your results'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{testResults.score}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Score</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{testResults.totalQuestions}</div>
            <div className="text-sm text-green-600 dark:text-green-400">Total Questions</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatTime(testResults.timeTaken)}</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Time Taken</div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Show start screen if test hasn't started yet
  if (!hasStarted) {
    return (
      <div className="card text-center">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {test.title}
          </h2>
          <div className="text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>Topic:</strong> {test.topic}</p>
            <p><strong>Reference:</strong> {test.reference}</p>
            <p><strong>Questions:</strong> {test.questions.length}</p>
            <p><strong>Time Limit:</strong> {test.timeLimit} minutes</p>
          </div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Important:</strong> Once you start the test, the timer will begin and cannot be paused. 
            Make sure you have a stable internet connection and enough time to complete the test.
          </p>
        </div>
        
        <button
          onClick={handleStartTest}
          className="btn-primary text-lg px-8 py-3"
        >
          Start Test
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test Header */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Question {currentQuestion + 1} of {test.questions.length}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {test.topic} • {test.reference}
            </p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2 text-lg font-semibold">
              <ClockIcon className="h-5 w-5 text-red-500" />
              <span className={timeLeft <= 300 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Time Remaining
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Current Question */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
          {test.questions[currentQuestion].question}
        </h3>

        <div className="space-y-3">
          {test.questions[currentQuestion].options.map((option, optionIndex) => (
            <button
              key={optionIndex}
              onClick={() => handleAnswerSelect(currentQuestion, option)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                answers[currentQuestion] === option
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <span className="font-medium text-gray-600 dark:text-gray-400 mr-3">
                  {String.fromCharCode(65 + optionIndex)}.
                </span>
                <span className="text-gray-900 dark:text-gray-100">{option}</span>
                {answers[currentQuestion] === option && (
                  <CheckCircleIcon className="h-5 w-5 text-primary-600 ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex space-x-2">
          {currentQuestion < test.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmitTest}
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </button>
          )}
        </div>
      </div>

      {/* Question Navigation */}
      <div className="card">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Question Navigation</h4>
        <div className="grid grid-cols-5 gap-2">
          {test.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`p-2 text-sm rounded-lg border transition-colors ${
                currentQuestion === index
                  ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : answers[index]
                  ? 'border-green-500 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
