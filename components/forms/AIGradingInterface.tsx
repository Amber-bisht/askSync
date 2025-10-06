'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  SparklesIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  PencilIcon,
  LightBulbIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AIGradingInterfaceProps {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer?: string;
  explanation?: string;
  maxPoints: number;
  currentScore?: number;
  aiGraded?: boolean;
  aiPercentage?: number;
  aiFeedback?: string;
  aiStrengths?: string[];
  aiImprovements?: string[];
  aiReasoning?: string;
  manuallyGraded?: boolean;
  manualScore?: number;
  manualFeedback?: string;
  onGrade: (questionId: string, useAI: boolean, manualScore?: number, manualFeedback?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function AIGradingInterface({
  questionId,
  question,
  userAnswer,
  correctAnswer,
  explanation,
  maxPoints,
  currentScore,
  aiGraded,
  aiPercentage,
  aiFeedback,
  aiStrengths,
  aiImprovements,
  aiReasoning,
  manuallyGraded,
  manualScore,
  manualFeedback,
  onGrade,
  isLoading = false
}: AIGradingInterfaceProps) {
  const [showManualGrading, setShowManualGrading] = useState(false);
  const [manualScoreInput, setManualScoreInput] = useState(manualScore || 0);
  const [manualFeedbackInput, setManualFeedbackInput] = useState(manualFeedback || '');

  const handleAIGrade = async () => {
    try {
      await onGrade(questionId, true);
      toast.success('Answer graded with AI successfully!');
    } catch (error) {
      console.error('Error grading with AI:', error);
      toast.error('Failed to grade with AI');
    }
  };

  const handleManualGrade = async () => {
    if (manualScoreInput < 0 || manualScoreInput > maxPoints) {
      toast.error(`Score must be between 0 and ${maxPoints}`);
      return;
    }

    try {
      await onGrade(questionId, false, manualScoreInput, manualFeedbackInput);
      toast.success('Answer graded manually successfully!');
      setShowManualGrading(false);
    } catch (error) {
      console.error('Error grading manually:', error);
      toast.error('Failed to grade manually');
    }
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    if (percentage >= 60) return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
    return <XCircleIcon className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Question Header */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{question}</h4>
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Max Points:</span> {maxPoints}
        </div>
        {correctAnswer && (
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Correct Answer:</span> {correctAnswer}
          </div>
        )}
        {explanation && (
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Explanation:</span> {explanation}
          </div>
        )}
      </div>

      {/* User Answer */}
      <div className="mb-6">
        <h5 className="font-medium text-gray-900 mb-2">Student Answer:</h5>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-gray-800 whitespace-pre-wrap">{userAnswer}</p>
        </div>
      </div>

      {/* Current Score Display */}
      {(aiGraded || manuallyGraded) && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-gray-900">
              {manuallyGraded ? 'Manual Grade' : 'AI Grade'}
            </h5>
            <div className="flex items-center space-x-2">
              {getScoreIcon(currentScore || 0, maxPoints)}
              <span className={`text-2xl font-bold ${getScoreColor(currentScore || 0, maxPoints)}`}>
                {currentScore || 0}/{maxPoints}
              </span>
            </div>
          </div>
          {aiGraded && aiPercentage && (
            <div className="text-sm text-gray-600">
              Percentage: {aiPercentage}%
            </div>
          )}
        </div>
      )}

      {/* AI Grading Results */}
      {aiGraded && (
        <div className="mb-6 space-y-4">
          {aiFeedback && (
            <div>
              <h6 className="font-medium text-gray-900 mb-2">AI Feedback:</h6>
              <p className="text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                {aiFeedback}
              </p>
            </div>
          )}

          {aiStrengths && aiStrengths.length > 0 && (
            <div>
              <h6 className="font-medium text-green-700 mb-2 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Strengths:
              </h6>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {aiStrengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {aiImprovements && aiImprovements.length > 0 && (
            <div>
              <h6 className="font-medium text-orange-700 mb-2 flex items-center">
                <LightBulbIcon className="h-4 w-4 mr-1" />
                Areas for Improvement:
              </h6>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {aiImprovements.map((improvement, index) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </div>
          )}

          {aiReasoning && (
            <div>
              <h6 className="font-medium text-gray-900 mb-2">AI Reasoning:</h6>
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                {aiReasoning}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Grading Results */}
      {manuallyGraded && manualFeedback && (
        <div className="mb-6">
          <h6 className="font-medium text-gray-900 mb-2">Manual Feedback:</h6>
          <p className="text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
            {manualFeedback}
          </p>
        </div>
      )}

      {/* Grading Actions */}
      <div className="flex items-center space-x-3">
        {!aiGraded && (
          <button
            onClick={handleAIGrade}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>Grade with AI</span>
          </button>
        )}

        <button
          onClick={() => setShowManualGrading(!showManualGrading)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <PencilIcon className="h-4 w-4" />
          <span>{manuallyGraded ? 'Edit Manual Grade' : 'Manual Grade'}</span>
        </button>
      </div>

      {/* Manual Grading Form */}
      {showManualGrading && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h6 className="font-medium text-gray-900 mb-3">Manual Grading</h6>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score (0 - {maxPoints})
              </label>
              <input
                type="number"
                min="0"
                max={maxPoints}
                value={manualScoreInput}
                onChange={(e) => setManualScoreInput(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback (Optional)
              </label>
              <textarea
                value={manualFeedbackInput}
                onChange={(e) => setManualFeedbackInput(e.target.value)}
                placeholder="Provide feedback to the student..."
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleManualGrade}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {manuallyGraded ? 'Update Grade' : 'Submit Grade'}
              </button>
              <button
                onClick={() => setShowManualGrading(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
