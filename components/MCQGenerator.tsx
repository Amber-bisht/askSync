'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SparklesIcon, ArrowPathIcon, AcademicCapIcon, LinkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import SubscriptionPlans from './SubscriptionPlans';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export default function HostTestMCQ() {
  const { data: session, update } = useSession();

  // Fetch user limits on component mount
  useEffect(() => {
    if (session) {
      fetchUserLimits();
    }
  }, [session]);

  const fetchUserLimits = async () => {
    try {
      const response = await fetch('/api/user/limits');
      if (response.ok) {
        const limits = await response.json();
        setUserLimits(limits);
      }
    } catch (error) {
      console.error('Error fetching user limits:', error);
    }
  };
  const [formData, setFormData] = useState({
    topic: '',
    numQuestions: 10,
    reference: '',
  });
  const [testData, setTestData] = useState({
    title: '',
    timeLimit: 10,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mcqId, setMcqId] = useState<string | null>(null); // Track the saved MCQ ID
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Question>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: ''
  });
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [createdTest, setCreatedTest] = useState<{
    _id: string;
    title: string;
    testLink: string;
  } | null>(null);
  const [userLimits, setUserLimits] = useState<{
    testsRemaining: number;
    testsUsed: number;
    limit: number;
    isPaid: boolean;
    type: string;
    nextResetDate?: string;
    mcqGeneration: {
      chatgpt: {
        used: number;
        limit: number;
        remaining: number;
      };
      api: {
        used: number;
        limit: number;
        remaining: number;
      };
    };
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numQuestions' ? parseInt(value) : value
    }));
  };

  const handleTestInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTestData(prev => ({
      ...prev,
      [name]: name === 'timeLimit' ? parseInt(value) : value
    }));
  };

  const generateQuestions = async () => {
    if (!formData.topic || !formData.reference) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check usage limits
    if (!session?.user.isPaid && (session?.user.freeMcqUsed || 0) >= (session?.user.maxFreeMcq || 5)) {
      setShowSubscription(true);
      toast.error('You have used all free MCQ generations. Please subscribe to continue.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-mcq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Usage limit exceeded') {
          setShowSubscription(true);
          toast.error('You have reached your usage limit. Please subscribe to continue.');
          return;
        }
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      setQuestions(prev => [...prev, ...data.questions]);
      setMcqId(data.mcqId); // Store the MCQ ID from the saved draft
      toast.success(`Generated ${data.questions.length} questions successfully! MCQ saved to "My Tests".`);
      
      // Update session to reflect new usage
      if (session) {
        await update({
          ...session,
          user: {
            ...session.user,
            freeMcqUsed: (session.user.freeMcqUsed || 0) + 1
          }
        });
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const shuffleOptions = (questionIndex: number) => {
    const question = questions[questionIndex];
    const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
    
    setQuestions(prev => prev.map((q, i) => 
      i === questionIndex 
        ? { ...q, options: shuffledOptions }
        : q
    ));
  };

  const startEditingQuestion = (questionIndex: number) => {
    const question = questions[questionIndex];
    setEditFormData({ ...question });
    setEditingQuestion(questionIndex);
  };

  const cancelEditingQuestion = () => {
    setEditingQuestion(null);
    setEditFormData({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: ''
    });
  };

  const saveEditedQuestion = () => {
    if (editingQuestion !== null) {
      setQuestions(prev => prev.map((q, i) => 
        i === editingQuestion ? { ...editFormData } : q
      ));
      cancelEditingQuestion();
      toast.success('Question updated successfully!');
    }
  };

  const deleteQuestion = (questionIndex: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== questionIndex));
    toast.success('Question deleted successfully!');
  };

  const addNewQuestion = () => {
    const newQuestion: Question = {
      question: 'New question text here?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: 'Explanation for the correct answer'
    };
    setQuestions(prev => [...prev, newQuestion]);
    setEditingQuestion(questions.length);
    setEditFormData({ ...newQuestion });
  };

  const handleEditInputChange = (field: keyof Question, value: string, optionIndex?: number) => {
    if (field === 'options' && optionIndex !== undefined) {
      const newOptions = [...editFormData.options];
      newOptions[optionIndex] = value;
      setEditFormData(prev => ({ ...prev, options: newOptions }));
    } else {
      setEditFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const createTest = async () => {
    if (!testData.title || questions.length === 0) {
      toast.error('Please provide a test title and generate questions first');
      return;
    }

    if (!mcqId) {
      toast.error('Please generate MCQ first before hosting test');
      return;
    }

    // Check test creation limits
    if (userLimits && userLimits.testsRemaining <= 0) {
      if (!userLimits.isPaid) {
        toast.error('You have reached your free test limit (5 tests). Upgrade to create more tests.');
      } else {
        toast.error('You have reached your monthly test limit (100 tests). Limit resets next month.');
      }
      return;
    }

    setIsCreatingTest(true);
    try {
      // Use the generate-unified-test API to create and publish the test
      const response = await fetch('/api/generate-unified-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: testData.title || 'MCQ Test',
          reference: '',
          mcqCount: 0, // No new questions to generate
          qaCount: 0,
          useSameReference: true,
          testName: testData.title,
          timeLimit: testData.timeLimit,
          isPublic: true,
          showResults: true,
          allowAnonymous: true,
          createdBy: session?.user?.email,
          publishTest: true,
          questions: questions // Use existing questions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.includes('limit')) {
          toast.error(errorData.error);
          return;
        }
        throw new Error('Failed to host test');
      }

      const data = await response.json();
      setCreatedTest(data.test);
      toast.success('Test hosted successfully!');
      
      // Update user limits
      if (userLimits) {
        setUserLimits({
          ...userLimits,
          testsRemaining: data.testsRemaining,
          testsUsed: userLimits.testsUsed + 1
        });
      }
      
      // Refresh user limits from server
      fetchUserLimits();
    } catch (error) {
      console.error('Error hosting test:', error);
      toast.error('Failed to host test. Please try again.');
    } finally {
      setIsCreatingTest(false);
    }
  };

  const copyTestLink = () => {
    if (createdTest) {
      const testUrl = `${window.location.origin}/test/${createdTest.testLink}`;
      navigator.clipboard.writeText(testUrl);
      toast.success('Test link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Compact User Limits Status */}
      {userLimits && (
        <div className={`border rounded-lg px-4 py-3 ${userLimits.isPaid ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <AcademicCapIcon className={`h-4 w-4 ${userLimits.isPaid ? 'text-green-600' : 'text-blue-600'}`} />
              <span className={`font-medium ${userLimits.isPaid ? 'text-green-800' : 'text-blue-800'}`}>
                {userLimits.isPaid ? 'Premium' : 'Free Plan'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-xs">
              {/* Tests Status */}
              <div className="flex items-center space-x-1">
                <span className="text-gray-600">Tests:</span>
                <span className={`font-medium ${userLimits.testsRemaining === 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {userLimits.testsUsed}/{userLimits.limit}
                </span>
                <span className={`text-xs ${userLimits.testsRemaining === 0 ? 'text-red-500' : 'text-green-600'}`}>
                  ({userLimits.testsRemaining} left)
                </span>
              </div>
              
              {/* MCQ Generation Status */}
              <div className="flex items-center space-x-1">
                <SparklesIcon className="h-3 w-3 text-purple-500" />
                <span className="text-gray-600">MCQ:</span>
                {userLimits.isPaid ? (
                  <div className="flex flex-col text-xs">
                    <span className={`font-medium ${userLimits.mcqGeneration.chatgpt.remaining === 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      ChatGPT: {userLimits.mcqGeneration.chatgpt.used}/{userLimits.mcqGeneration.chatgpt.limit}
                    </span>
                    <span className={`font-medium ${userLimits.mcqGeneration.api.remaining === 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      API: {userLimits.mcqGeneration.api.used}/{userLimits.mcqGeneration.api.limit}
                    </span>
                  </div>
                ) : (
                  <>
                    <span className={`font-medium ${userLimits.mcqGeneration.chatgpt.remaining === 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      {userLimits.mcqGeneration.chatgpt.used}/{userLimits.mcqGeneration.chatgpt.limit}
                    </span>
                    <span className={`text-xs ${userLimits.mcqGeneration.chatgpt.remaining === 0 ? 'text-red-500' : 'text-green-600'}`}>
                      ({userLimits.mcqGeneration.chatgpt.remaining} left)
                    </span>
                  </>
                )}
              </div>
              
              {/* Upgrade button for limits reached */}
              {(!userLimits.isPaid && (userLimits.testsRemaining === 0 || userLimits.mcqGeneration.chatgpt.remaining === 0)) && (
                <button
                  onClick={() => setShowSubscription(true)}
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Upgrade
                </button>
              )}
              
              {/* Next reset date for premium users */}
              {userLimits.isPaid && userLimits.nextResetDate && (
                <span className="text-gray-500 text-xs">
                  Resets: {new Date(userLimits.nextResetDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {showSubscription ? (
        <SubscriptionPlans />
      ) : (
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <SparklesIcon className="h-6 w-6 text-primary-600 mr-2" />
            Host Test MCQ - Generate & Create Tests
          </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic *
            </label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="e.g., Indian History"
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
              value={formData.numQuestions}
              onChange={handleInputChange}
              className="input-field"
            >
              {[5, 10, 15, 20, 25, 30].map(num => (
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
              value={formData.reference}
              onChange={handleInputChange}
              placeholder="e.g., CBSE Class 12"
              className="input-field"
              required
            />
          </div>
        </div>
        
        <button
          onClick={generateQuestions}
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

      {/* Generated Questions */}
      {questions.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Generated Questions ({questions.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="btn-secondary"
              >
                {showAnswers ? 'Hide' : 'Show'} Answers
              </button>
              <button
                onClick={addNewQuestion}
                className="btn-primary text-sm px-3 py-1"
              >
                + Add Question
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                {editingQuestion === index ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium text-gray-900">
                        Editing Question {index + 1}
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEditedQuestion}
                          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditingQuestion}
                          className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question:</label>
                      <textarea
                        value={editFormData.question}
                        onChange={(e) => handleEditInputChange('question', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Options:</label>
                      <div className="space-y-2">
                        {editFormData.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <span className="font-medium text-gray-600 w-6">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleEditInputChange('options', e.target.value, optionIndex)}
                              className="flex-1 p-2 border border-gray-300 rounded"
                            />
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              checked={option === editFormData.correctAnswer}
                              onChange={() => handleEditInputChange('correctAnswer', option)}
                              className="text-green-600"
                              title="Mark as correct answer"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Select the radio button to mark the correct answer</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (optional):</label>
                      <textarea
                        value={editFormData.explanation || ''}
                        onChange={(e) => handleEditInputChange('explanation', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                        rows={2}
                        placeholder="Explain why this is the correct answer..."
                      />
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-medium text-gray-900">
                        Question {index + 1}
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => shuffleOptions(index)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          🔀 Shuffle
                        </button>
                        <button
                          onClick={() => startEditingQuestion(index)}
                          className="text-sm text-green-600 hover:text-green-700"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteQuestion(index)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{question.question}</p>
                    
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded-lg border ${
                            showAnswers && option === question.correctAnswer
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <span className="font-medium text-gray-600 mr-2">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          {option}
                          {showAnswers && option === question.correctAnswer && (
                            <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {showAnswers && question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Explanation:</span> {question.explanation}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Test Hosting Section */}
          <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AcademicCapIcon className="h-5 w-5 text-green-600 mr-2" />
              Host Your Test
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={testData.title}
                  onChange={handleTestInputChange}
                  placeholder="e.g., Indian History Quiz"
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (minutes)
                </label>
                <select
                  name="timeLimit"
                  value={testData.timeLimit}
                  onChange={handleTestInputChange}
                  className="input-field"
                >
                  {[5, 10, 15, 20, 30, 45, 60].map(time => (
                    <option key={time} value={time}>{time} min</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={createTest}
              disabled={isCreatingTest || questions.length === 0 || !testData.title}
              className="btn-primary flex items-center space-x-2"
            >
              {isCreatingTest ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Hosting Test...</span>
                </>
              ) : (
                <>
                  <AcademicCapIcon className="h-5 w-5" />
                  <span>Host Test ({questions.length} questions)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Created Test Info */}
      {createdTest && (
        <div className="card bg-green-50 border-green-200">
          <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
            <LinkIcon className="h-6 w-6 text-green-600 mr-2" />
            Test Hosted Successfully!
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-green-700">Test Title:</p>
              <p className="text-green-900">{createdTest.title}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-green-700">Test Link:</p>
              <div className="flex items-center space-x-2">
                <code className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  {createdTest.testLink}
                </code>
                <button
                  onClick={copyTestLink}
                  className="text-green-600 hover:text-green-700"
                  title="Copy test link"
                >
                  <ClipboardDocumentIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-green-700">Full URL:</p>
              <p className="text-green-900 break-all">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/test/${createdTest.testLink}`}
              </p>
            </div>
            
            <div className="pt-4 border-t border-green-200">
              <p className="text-sm text-green-700">
                Share this link with your students to start the test!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
