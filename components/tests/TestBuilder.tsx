'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import AccessControlSettings from '../forms/AccessControlSettings';

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
  description: string;
  timeLimit?: number;
  isPublic: boolean;
  showResults: boolean;
  allowAnonymous: boolean;
  accessListId?: string;
  aiTopic: string;
  aiReference: string;
  mcqCount: number;
  qaCount: number;
  useSameReference: boolean;
}

interface TestBuilderProps {
  initialData?: {
    testName: string;
    description: string;
    questions: TestQuestion[];
    timeLimit?: number;
    isPublic: boolean;
    showResults: boolean;
    allowAnonymous: boolean;
    isEditing?: boolean;
    testId?: string;
  };
  onSave?: () => void;
}

export default function TestBuilder({ initialData, onSave }: TestBuilderProps) {
  const { data: session } = useSession();

  const [testName, setTestName] = useState(initialData?.testName || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [questions, setQuestions] = useState<TestQuestion[]>(initialData?.questions || []);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);

  // Access control state
  const [accessControl, setAccessControl] = useState({
    isPrivate: !(initialData?.isPublic ?? true),
    accessListId: (initialData as any)?.accessListId || (initialData as any)?.settings?.accessListId,
    allowedEmails: [] as string[]
  });

  // Test settings
  const [settings, setSettings] = useState<TestSettings>({
    testName: initialData?.testName || '',
    description: initialData?.description || '',
    timeLimit: initialData?.timeLimit || 30,
    isPublic: initialData?.isPublic ?? true,
    showResults: initialData?.showResults ?? true,
    allowAnonymous: initialData?.allowAnonymous ?? true,
    aiTopic: '',
    aiReference: '',
    mcqCount: 5,
    qaCount: 3,
    useSameReference: true
  });

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setTestName(initialData.testName || '');
      setDescription(initialData.description || '');
      setQuestions(initialData.questions || []);
      setSettings(prev => ({
        ...prev,
        testName: initialData.testName || '',
        description: initialData.description || '',
        timeLimit: initialData.timeLimit || 30,
        isPublic: initialData.isPublic ?? true,
        showResults: initialData.showResults ?? true,
        allowAnonymous: initialData.allowAnonymous ?? true,
      }));

      // Update access control state
      setAccessControl({
        isPrivate: !initialData.isPublic,
        accessListId: (initialData as any).accessListId || (initialData as any).settings?.accessListId,
        allowedEmails: []
      });
    }
  }, [initialData]);

  // Validation functions
  const hasMcqQuestions = () => {
    return questions.some(q => q.type === 'mcq');
  };

  const canShowResults = () => {
    return hasMcqQuestions();
  };

  const canAllowAnonymous = () => {
    return true; // Always allow anonymous for logged in users
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

  const handleAccessControlChange = (newAccessControl: {
    isPrivate: boolean;
    accessListId?: string;
  }) => {
    console.log('Access control changed:', newAccessControl);

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

  const addQuestion = (type: 'mcq' | 'qa') => {
    const newQuestion: TestQuestion = {
      id: `question_${Date.now()}`,
      type,
      question: '',
      options: type === 'mcq' ? ['', '', '', ''] : undefined,
      points: 1,
      isRequired: true
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestion(questions.length);
  };

  const updateQuestion = (index: number, updates: Partial<TestQuestion>) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    setEditingQuestion(null);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newQuestions.length) {
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
      setQuestions(newQuestions);
    }
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = { ...questions[index] };
    questionToDuplicate.id = `question_${Date.now()}`;
    questionToDuplicate.question = `${questionToDuplicate.question} (Copy)`;
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, questionToDuplicate);
    setQuestions(newQuestions);
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

  const saveTest = async () => {
    if (!session?.user) {
      toast.error('Please sign in to save tests');
      return;
    }

    if (!testName.trim()) {
      toast.error('Please enter a test name');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    setIsSaving(true);

    try {
      const isEditing = initialData?.isEditing && initialData?.testId;
      const url = isEditing ? `/api/tests/${initialData.testId}` : '/api/tests';
      const method = isEditing ? 'PUT' : 'POST';

      const requestData = {
        testName,
        description,
        questions,
        timeLimit: settings.timeLimit,
        isPublic: settings.isPublic,
        showResults: settings.showResults,
        allowAnonymous: settings.allowAnonymous,
        accessListId: accessControl.accessListId,
        createdBy: session?.user?.email
      };

      // Debug logging
      console.log('Sending test update request:', {
        url,
        method,
        isPublic: settings.isPublic,
        accessListId: accessControl.accessListId,
        accessControl,
        settings
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(isEditing ? 'Test updated successfully!' : 'Test saved successfully!');

        if (!isEditing) {
          // Reset form only for new tests
          setTestName('');
          setDescription('');
          setQuestions([]);
          setSettings({
            testName: '',
            description: '',
            timeLimit: 30,
            isPublic: true,
            showResults: true,
            allowAnonymous: true,
            aiTopic: '',
            aiReference: '',
            mcqCount: 5,
            qaCount: 3,
            useSameReference: true
          });
        }

        // Call onSave callback if provided (for edit mode)
        if (onSave) {
          onSave();
        }
      } else {
        throw new Error(data.error || 'Failed to save test');
      }
    } catch (error) {
      console.error('Error saving test:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save test');
    } finally {
      setIsSaving(false);
    }
  };

  if (isPreviewMode) {
    const previewTest = {
      _id: 'preview',
      testName: testName || 'Untitled Test',
      description: description,
      questions,
      testLink: 'preview',
      createdBy: session?.user?.email || '',
      createdAt: new Date(),
      isActive: true,
      isPublic: settings.isPublic,
      allowAnonymous: settings.allowAnonymous,
      timeLimit: settings.timeLimit,
      showResults: settings.showResults,
      responseCount: 0
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Preview</h1>
            <button
              onClick={() => setIsPreviewMode(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Editor
            </button>
          </div>
          <TestPreview test={previewTest} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {initialData?.isEditing ? 'Edit Test' : 'Test Builder'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {initialData?.isEditing ? 'Edit your test with MCQ and Q&A questions' : 'Create custom tests with MCQ and Q&A questions'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Test Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Test Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="Enter test name"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your test (optional)"
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.timeLimit || ''}
                    onChange={(e) => setSettings({ ...settings, timeLimit: parseInt(e.target.value) || undefined })}
                    placeholder="No time limit"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* AI Generation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">AI Generation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Topic *
                  </label>
                  <input
                    type="text"
                    value={settings.aiTopic}
                    onChange={(e) => setSettings({ ...settings, aiTopic: e.target.value })}
                    placeholder="e.g., JavaScript Fundamentals"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      MCQ Count
                    </label>
                    <input
                      type="number"
                      value={settings.mcqCount}
                      onChange={(e) => setSettings({ ...settings, mcqCount: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="20"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Q&A Count
                    </label>
                    <input
                      type="number"
                      value={settings.qaCount}
                      onChange={(e) => setSettings({ ...settings, qaCount: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="10"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reference Material (optional)
                  </label>
                  <textarea
                    value={settings.aiReference}
                    onChange={(e) => setSettings({ ...settings, aiReference: e.target.value })}
                    placeholder="Add reference material for more accurate questions..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <button
                  onClick={generateQuestions}
                  disabled={isGenerating || !settings.aiTopic.trim()}
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Questions with AI'}
                </button>
              </div>
            </div>

            {/* Question Types */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Questions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => addQuestion('mcq')}
                  className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="text-lg mb-1">📝</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Multiple Choice</div>
                </button>
                <button
                  onClick={() => addQuestion('qa')}
                  className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="text-lg mb-1">❓</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Q&A</div>
                </button>
              </div>
            </div>

            {/* Test Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Test Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={settings.isPublic}
                    onChange={(e) => {
                      const isPublic = e.target.checked;
                      setSettings({ ...settings, isPublic });
                      setAccessControl(prev => ({ ...prev, isPrivate: !isPublic }));
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
                    onChange={(e) => setSettings({ ...settings, showResults: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <label htmlFor="showResults" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Show results immediately
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
                    onChange={(e) => setSettings({ ...settings, allowAnonymous: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <label htmlFor="allowAnonymous" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Allow anonymous submissions
                    <span className="text-xs text-gray-500 block">(Only logged in users can submit)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="space-y-3">
                <button
                  onClick={() => setIsPreviewMode(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Preview Test
                </button>

                <button
                  onClick={saveTest}
                  disabled={isSaving || !testName.trim() || questions.length === 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving
                    ? (initialData?.isEditing ? 'Updating...' : 'Saving...')
                    : (initialData?.isEditing ? 'Update Test' : 'Save Test')
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Question Builder */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Test Questions ({questions.length})</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Points: {questions.reduce((sum, q) => sum + q.points, 0)}
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-4">📝</div>
                  <p>No questions added yet. Choose a question type from the left panel to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <QuestionEditor
                      key={question.id}
                      question={question}
                      index={index}
                      isEditing={editingQuestion === index}
                      onEdit={() => setEditingQuestion(editingQuestion === index ? null : index)}
                      onUpdate={(updates) => updateQuestion(index, updates)}
                      onRemove={() => removeQuestion(index)}
                      onMoveUp={() => moveQuestion(index, 'up')}
                      onMoveDown={() => moveQuestion(index, 'down')}
                      onDuplicate={() => duplicateQuestion(index)}
                      canMoveUp={index > 0}
                      canMoveDown={index < questions.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Question Editor Component
interface QuestionEditorProps {
  question: TestQuestion;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<TestQuestion>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function QuestionEditor({
  question,
  index,
  isEditing,
  onEdit,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  canMoveUp,
  canMoveDown
}: QuestionEditorProps) {
  const handleOptionChange = (optionIndex: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    onUpdate({ options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(question.options || []), ''];
    onUpdate({ options: newOptions });
  };

  const removeOption = (optionIndex: number) => {
    const newOptions = question.options?.filter((_, i) => i !== optionIndex) || [];
    onUpdate({ options: newOptions });
  };

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{question.question || 'Untitled Question'}</span>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">{question.type.toUpperCase()}</span>
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">{question.points} pts</span>
          {question.isRequired && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">Required</span>}
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Cog6ToothIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label>
            <textarea
              value={question.question}
              onChange={(e) => onUpdate({ question: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder="Enter your question..."
            />
          </div>

          {question.type === 'mcq' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options</label>
              {question.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2 mb-2">
                  <span className="w-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {String.fromCharCode(65 + optionIndex)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                  <button
                    onClick={() => removeOption(optionIndex)}
                    className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addOption}
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Option</span>
              </button>

              {/* Correct Answer Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correct Answer</label>
                <select
                  value={question.correctAnswer || ''}
                  onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select correct answer</option>
                  {question.options?.map((option, index) => (
                    <option key={index} value={option}>
                      {String.fromCharCode(65 + index)}. {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points</label>
            <input
              type="number"
              value={question.points}
              onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              min="1"
            />
          </div>


          <div>
            <label className="flex items-center text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={question.isRequired}
                onChange={(e) => onUpdate({ isRequired: e.target.checked })}
                className="mr-2"
              />
              Required question
            </label>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <div className="text-gray-900 dark:text-gray-100 mb-2">{question.question || 'Untitled Question'}</div>
          {question.type === 'mcq' && question.options && (
            <div className="space-y-1">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className={`text-sm ${option === question.correctAnswer ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                  {String.fromCharCode(65 + optionIndex)}. {option}
                  {option === question.correctAnswer && <span className="ml-2 text-xs">✓ Correct</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Test Preview Component
function TestPreview({ test }: {
  test: {
    testName: string;
    description: string;
    timeLimit?: number;
    questions: Array<{ question: string; type: string; options?: string[]; points: number; id?: string }>
  }
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{test.testName}</h2>
        {test.description && (
          <p className="text-gray-600 dark:text-gray-400">{test.description}</p>
        )}
        <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <DocumentTextIcon className="h-4 w-4 mr-1" />
            {test.questions.length} questions
          </span>
          <span className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            {test.timeLimit ? `${test.timeLimit} minutes` : 'No time limit'}
          </span>
          <span className="flex items-center">
            Total Points: {test.questions.reduce((sum: number, q: { points: number }) => sum + q.points, 0)}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {test.questions.map((question: { question: string; type: string; options?: string[]; points: number; id?: string }, index: number) => (
          <div key={question.id || index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Question {index + 1} ({question.type.toUpperCase()})
              </h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">{question.points} points</span>
            </div>

            <div className="text-gray-700 dark:text-gray-300 mb-3">{question.question}</div>

            {question.type === 'mcq' && question.options && (
              <div className="space-y-2 mb-3">
                {question.options.map((option: string, optionIndex: number) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <span className="w-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {String.fromCharCode(65 + optionIndex)}.
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{option}</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
