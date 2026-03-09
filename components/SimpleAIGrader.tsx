'use client';

import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface SimpleAIGraderProps {
  question: string;
  userAnswer: string;
  correctAnswer?: string;
  maxPoints: number;
  onGrade: (score: number, feedback: string) => void;
  isLoading?: boolean;
}

export default function SimpleAIGrader({
  question,
  userAnswer,
  correctAnswer,
  maxPoints,
  onGrade,
  isLoading = false
}: SimpleAIGraderProps) {
  const [isGrading, setIsGrading] = useState(false);

  const handleAIGrade = async () => {
    if (!userAnswer.trim()) {
      toast.error('No answer provided to grade');
      return;
    }

    setIsGrading(true);
    try {
      const response = await fetch('/api/ai-grade-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userAnswer,
          correctAnswer,
          maxPoints
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onGrade(data.score, data.feedback);
        toast.success('Answer graded successfully!');
      } else {
        throw new Error(data.error || 'Failed to grade answer');
      }
    } catch (error) {
      console.error('Error grading answer:', error);
      toast.error('Failed to grade answer');
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-white">AI Grading</h4>
        <button
          onClick={handleAIGrade}
          disabled={isGrading || isLoading}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <SparklesIcon className="h-4 w-4" />
          <span>{isGrading ? 'Grading...' : 'Grade with AI'}</span>
        </button>
      </div>
      <p className="text-sm text-gray-400">
        Automatically grade this answer using AI to provide instant feedback and scores.
      </p>
    </div>
  );
}

