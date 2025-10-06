'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { 
  SparklesIcon, 
  PlusIcon, 
  TrashIcon
} from '@heroicons/react/24/outline';
import AccessControlSettings from './forms/AccessControlSettings';

interface TestQuestion {
  id: string;
  type: 'mcq' | 'qa';
  question: string;
  options?: string[];
  correctAnswer?: string; // For MCQ questions
  points: number;
  isRequired: boolean;
}

interface TestSettings {
  testName: string;
  mcqCount: number;
  qaCount: number;
  aiTopic: string;
  aiReference: string;
  useSameReference: boolean;
  isPublic: boolean;
  showResults: boolean;
  allowAnonymous: boolean;
  accessListId?: string;
  timeLimit?: number;
}

export default function UnifiedTestCreator() {
  const { data: session } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<TestSettings>({
    testName: '',
    mcqCount: 5,
    qaCount: 3,
    aiTopic: '',
    aiReference: '',
    useSameReference: true,
    isPublic: true,
    showResults: true,
    allowAnonymous: true,
    timeLimit: 30
  });
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'preview'>('create');
  
  // Access control state
  const [accessControl, setAccessControl] = useState({
    isPrivate: false,
    accessListId: undefined as string | undefined,
    allowedEmails: [] as string[]
  });

  // Validation functions
  const hasMcqQuestions = () => {
    return questions.some(q => q.type === 'mcq');
  };

  const canShowResults = () => {
    return hasMcqQuestions();
  };

  // Auto-adjust showResults based on question types
  useEffect(() => {
    const hasMcq = questions.some(q => q.type === 'mcq');
    if (!hasMcq) {
      setSettings(prev => {
        if (prev.showResults) {
          return { ...prev, showResults: false };
        }
        return prev;
      });
    }
  }, [questions]);

  const canAllowAnonymous = () => {
    return true; // Always allow anonymous for logged in users
  };

  const handleAccessControlChange = (newAccessControl: {
    isPrivate: boolean;
    accessListId?: string;
  }) => {
    setAccessControl({
      isPrivate: newAccessControl.isPrivate,
      accessListId: newAccessControl.accessListId,
      allowedEmails: []
    });
    setSettings(prev => ({
      ...prev,
      isPublic: !newAccessControl.isPrivate,
      accessListId: newAccessControl.accessListId
    }));
  };

  const generateQuestions = async () => {
    if (!settings.aiTopic.trim()) {
      toast.error('Please enter a topic for AI generation');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-unified-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: settings.aiTopic,
          reference: settings.aiReference,
          mcqCount: settings.mcqCount,
          qaCount: settings.qaCount,
          useSameReference: settings.useSameReference
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setQuestions(prev => [...prev, ...data.questions]);
        toast.success(`Generated ${data.questions.length} questions successfully!`);
        // Automatically switch to preview tab to show generated questions
        setActiveTab('preview');
      } else {
        throw new Error(data.error || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const addManualQuestion = (type: 'mcq' | 'qa') => {
    const newQuestion: TestQuestion = {
      id: Date.now().toString(),
      type,
      question: '',
      options: type === 'mcq' ? ['', '', '', ''] : undefined,
      points: 1,
      isRequired: true
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, field: keyof TestQuestion, value: string | number | string[]) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const createTest = async () => {
    if (!settings.testName.trim()) {
      toast.error('Please enter a test name');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    setIsCreating(true);
    try {
      const requestData = {
        topic: settings.aiTopic || 'Custom Test',
        reference: settings.aiReference,
        mcqCount: 0, // We already have questions, no need to generate more
        qaCount: 0,
        useSameReference: settings.useSameReference,
        testName: settings.testName,
        timeLimit: settings.timeLimit,
        isPublic: settings.isPublic,
        showResults: settings.showResults,
        allowAnonymous: settings.allowAnonymous,
        accessListId: accessControl.accessListId,
        createdBy: session?.user?.email,
        publishTest: true,
        questions: questions // Pass existing questions
      };
      
      console.log('Sending test creation request:', requestData);
      
      const response = await fetch('/api/generate-unified-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Test created successfully!');
        // Reset form
        setSettings({
          testName: '',
          mcqCount: 5,
          qaCount: 3,
          aiTopic: '',
          aiReference: '',
          useSameReference: true,
          isPublic: true,
          showResults: true,
          allowAnonymous: true,
          timeLimit: 30
        });
        setQuestions([]);
        setActiveTab('create');
      } else {
        throw new Error(data.error || 'Failed to create test');
      }
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create test');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Create Test
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Preview ({questions.length} questions)
          </button>
        </nav>
      </div>

      {/* Create Test Tab */}
      {activeTab === 'create' && (
        <div className="space-y-8">
          {/* Basic Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Test Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Name *
                </label>
                <input
                  type="text"
                  value={settings.testName}
                  onChange={(e) => setSettings({...settings, testName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter test name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={settings.timeLimit}
                  onChange={(e) => setSettings({...settings, timeLimit: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* AI Generation Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">AI Generation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic *
                </label>
                <input
                  type="text"
                  value={settings.aiTopic}
                  onChange={(e) => setSettings({...settings, aiTopic: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., JavaScript Fundamentals, World History"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MCQ Questions
                  </label>
                  <input
                    type="number"
                    value={settings.mcqCount}
                    onChange={(e) => setSettings({...settings, mcqCount: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="0"
                    max="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Q&A Questions
                  </label>
                  <input
                    type="number"
                    value={settings.qaCount}
                    onChange={(e) => setSettings({...settings, qaCount: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="0"
                    max="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Material (optional)
                </label>
                <textarea
                  value={settings.aiReference}
                  onChange={(e) => setSettings({...settings, aiReference: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Add reference material for more accurate questions..."
                />
              </div>

              <button
                onClick={generateQuestions}
                disabled={isGenerating || !settings.aiTopic.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="h-5 w-5" />
                <span>{isGenerating ? 'Generating...' : 'Generate Questions with AI'}</span>
              </button>
            </div>
          </div>

          {/* Manual Question Addition */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Add Questions Manually</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => addManualQuestion('mcq')}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add MCQ</span>
              </button>
              <button
                onClick={() => addManualQuestion('qa')}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Q&A</span>
              </button>
            </div>
          </div>

          {/* Test Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Test Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={settings.isPublic}
                  onChange={(e) => {
                    const isPublic = e.target.checked;
                    setSettings({...settings, isPublic});
                    setAccessControl(prev => ({...prev, isPrivate: !isPublic}));
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Public test (anyone with link can take)
                </label>
              </div>
              
              {!settings.isPublic && (
                <div className="ml-6 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                    <AccessControlSettings
                      isPrivate={accessControl.isPrivate}
                      selectedListId={accessControl.accessListId}
                      onSettingsChange={handleAccessControlChange}
                    />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showResults"
                  checked={settings.showResults}
                  disabled={!canShowResults()}
                  onChange={(e) => setSettings({...settings, showResults: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="showResults" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Show results immediately after submission
                  {!canShowResults() && (
                    <span className="text-xs text-gray-500 block">(Only available for MCQ tests)</span>
                  )}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowAnonymous"
                  checked={settings.allowAnonymous}
                  disabled={!canAllowAnonymous()}
                  onChange={(e) => setSettings({...settings, allowAnonymous: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="allowAnonymous" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Allow anonymous submissions
                  <span className="text-xs text-gray-500 block">(Only logged in users can submit)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end">
            <button
              onClick={createTest}
              disabled={isCreating || !settings.testName.trim() || questions.length === 0}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {questions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-500 dark:text-gray-400">No questions added yet. Go to Create Test tab to add questions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Question {index + 1} ({question.type.toUpperCase()})
                    </h4>
                    <button
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Question
                      </label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        rows={3}
                        placeholder="Enter your question..."
                      />
                    </div>

                    {question.type === 'mcq' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Options
                        </label>
                        <div className="space-y-2">
                          {question.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <span className="w-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...(question.options || [])];
                                  newOptions[optionIndex] = e.target.value;
                                  updateQuestion(question.id, 'options', newOptions);
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Points
                        </label>
                        <input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          min="1"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
