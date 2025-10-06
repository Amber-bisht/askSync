'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { 
  SparklesIcon, 
  ArrowPathIcon, 
  PlusIcon,
  PhotoIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string;
  hasImage: boolean;
}

interface QuestionGeneratorProps {
  onQuestionsGenerated: (questions: Question[]) => void;
  initialQuestions?: Question[];
}

export default function QuestionGenerator({ 
  onQuestionsGenerated, 
  initialQuestions = [] 
}: QuestionGeneratorProps) {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generationMode, setGenerationMode] = useState<'ai' | 'manual'>('ai');
  
  // AI Generation form
  const [aiFormData, setAiFormData] = useState({
    topic: '',
    numQuestions: 5,
    reference: '',
    includeImages: false
  });

  // Manual question form
  const [manualFormData, setManualFormData] = useState<Question>({
    id: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    imageUrl: '',
    hasImage: false
  });

  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleAiFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setAiFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'numQuestions' ? parseInt(value) : value
    }));
  };

  const handleManualFormChange = (field: keyof Question, value: string | boolean, optionIndex?: number) => {
    if (field === 'options' && optionIndex !== undefined) {
      const newOptions = [...manualFormData.options];
      newOptions[optionIndex] = value as string;
      setManualFormData(prev => ({ ...prev, options: newOptions }));
    } else {
      setManualFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const generateQuestionsWithAI = async () => {
    if (!aiFormData.topic || !aiFormData.reference) {
      toast.error('Please fill in topic and reference fields');
      return;
    }

    if (!session?.user?.email) {
      toast.error('Please sign in to generate questions');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: aiFormData.topic,
          numQuestions: aiFormData.numQuestions,
          reference: aiFormData.reference,
          includeImages: aiFormData.includeImages
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Usage limit exceeded') {
          toast.error('You have reached your usage limit. Please subscribe to continue.');
          return;
        }
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      const generatedQuestions = data.questions.map((q: { question: string; options: string[]; correctAnswer: string; explanation: string; imageUrl?: string }) => ({
        ...q,
        id: generateId(),
        hasImage: !!q.imageUrl
      }));
      
      setQuestions(prev => {
        const newQuestions = [...prev, ...generatedQuestions];
        onQuestionsGenerated(newQuestions);
        return newQuestions;
      });
      toast.success(`Generated ${generatedQuestions.length} questions successfully!`);
      
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const addManualQuestion = () => {
    if (!manualFormData.question.trim() || !manualFormData.correctAnswer.trim()) {
      toast.error('Please fill in question and correct answer');
      return;
    }

    const newQuestion: Question = {
      ...manualFormData,
      id: generateId(),
      hasImage: !!manualFormData.imageUrl?.trim()
    };

    if (editingQuestion !== null) {
      // Update existing question
      const updatedQuestions = questions.map((q, i) => 
        i === editingQuestion ? newQuestion : q
      );
      setQuestions(updatedQuestions);
      onQuestionsGenerated(updatedQuestions);
      setEditingQuestion(null);
      toast.success('Question updated successfully!');
    } else {
      // Add new question
      const updatedQuestions = [...questions, newQuestion];
      setQuestions(updatedQuestions);
      onQuestionsGenerated(updatedQuestions);
      toast.success('Question added successfully!');
    }

    // Reset form
    setManualFormData({
      id: '',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      imageUrl: '',
      hasImage: false
    });
  };

  const startEditingQuestion = (index: number) => {
    const question = questions[index];
    setManualFormData(question);
    setEditingQuestion(index);
    setGenerationMode('manual');
    setShowGenerator(true);
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
    onQuestionsGenerated(updatedQuestions);
    toast.success('Question deleted successfully!');
  };

  const cancelEditing = () => {
    setEditingQuestion(null);
    setManualFormData({
      id: '',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      imageUrl: '',
      hasImage: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Question Generator Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Questions ({questions.length})
        </h3>
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Questions</span>
        </button>
      </div>

      {/* Question Generator Panel */}
      {showGenerator && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">Question Generator</h4>
            <button
              onClick={() => {
                setShowGenerator(false);
                cancelEditing();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Mode Selection */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setGenerationMode('ai')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                generationMode === 'ai'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <SparklesIcon className="h-5 w-5 inline mr-2" />
              AI Generation
            </button>
            <button
              onClick={() => setGenerationMode('manual')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                generationMode === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <PencilIcon className="h-5 w-5 inline mr-2" />
              Manual Entry
            </button>
          </div>

          {/* AI Generation Form */}
          {generationMode === 'ai' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic *
                  </label>
                  <input
                    type="text"
                    name="topic"
                    value={aiFormData.topic}
                    onChange={handleAiFormChange}
                    placeholder="e.g., JavaScript Fundamentals"
                    className="input-field"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <select
                    name="numQuestions"
                    value={aiFormData.numQuestions}
                    onChange={handleAiFormChange}
                    className="input-field"
                  >
                    {[3, 5, 10, 15, 20].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference *
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={aiFormData.reference}
                    onChange={handleAiFormChange}
                    placeholder="e.g., Beginner Level"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="includeImages"
                  checked={aiFormData.includeImages}
                  onChange={handleAiFormChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Include image suggestions (experimental)
                </label>
              </div>

              <button
                onClick={generateQuestionsWithAI}
                disabled={isGenerating}
                className="btn-primary flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    <span>Generate Questions</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Manual Entry Form */}
          {generationMode === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question *
                </label>
                <textarea
                  value={manualFormData.question}
                  onChange={(e) => handleManualFormChange('question', e.target.value)}
                  placeholder="Enter your question here..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PhotoIcon className="h-5 w-5 inline mr-2" />
                  Image URL (optional)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={manualFormData.imageUrl || ''}
                    onChange={(e) => handleManualFormChange('imageUrl', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleManualFormChange('imageUrl', '')}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                {manualFormData.imageUrl && (
                  <div className="mt-2">
                    <div className="relative max-w-xs max-h-32">
                      <Image
                        src={manualFormData.imageUrl}
                        alt="Question preview"
                        width={300}
                        height={128}
                        className="object-contain border border-gray-200 rounded"
                        onError={() => {
                          // Handle error by hiding the image
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Options *
                </label>
                <div className="space-y-2">
                  {manualFormData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600 w-6">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleManualFormChange('options', e.target.value, index)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={option === manualFormData.correctAnswer}
                        onChange={() => handleManualFormChange('correctAnswer', option)}
                        className="text-green-600"
                        title="Mark as correct answer"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select the radio button to mark the correct answer
                </p>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Explanation (optional)
                </label>
                <textarea
                  value={manualFormData.explanation || ''}
                  onChange={(e) => handleManualFormChange('explanation', e.target.value)}
                  placeholder="Explain why this is the correct answer..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={addManualQuestion}
                  className="btn-primary flex items-center space-x-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>{editingQuestion !== null ? 'Update Question' : 'Add Question'}</span>
                </button>
                {editingQuestion !== null && (
                  <button
                    onClick={cancelEditing}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Generated Questions</h4>
          {questions.map((question, index) => (
            <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-3">
                <h5 className="text-md font-medium text-gray-900">
                  Question {index + 1}
                </h5>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditingQuestion(index)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">{question.question}</p>
              
              {question.hasImage && question.imageUrl && (
                <div className="mb-3">
                  <div className="relative max-w-sm max-h-48">
                    <Image
                      src={question.imageUrl}
                      alt="Question image"
                      width={400}
                      height={192}
                      className="object-contain border border-gray-200 rounded"
                      onError={() => {
                        // Handle error by hiding the image
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`p-2 rounded border ${
                      option === question.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <span className="font-medium text-gray-600 mr-2">
                      {String.fromCharCode(65 + optionIndex)}.
                    </span>
                    {option}
                    {option === question.correctAnswer && (
                      <span className="ml-2 text-green-600 font-medium text-sm">✓ Correct</span>
                    )}
                  </div>
                ))}
              </div>
              
              {question.explanation && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Explanation:</span> {question.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
