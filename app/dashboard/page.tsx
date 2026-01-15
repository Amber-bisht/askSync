'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TestBuilder from '@/components/tests/TestBuilder';
import AccessListManager from '@/components/access/AccessListManager';
import FormBuilder from '@/components/forms/FormBuilder';
import FormEditor from '@/components/forms/FormEditor';
import SubscriptionPlans from '@/components/SubscriptionPlans';
import { ListBulletIcon, ChartBarIcon, SparklesIcon, DocumentTextIcon, UsersIcon, PlusIcon, EyeIcon, TrashIcon, PencilIcon, ClipboardDocumentListIcon, CreditCardIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import SiteHeader from '@/components/SiteHeader';
import MySubmissions from '@/components/MySubmissions';

interface FormListItem {
  _id: string;
  title: string;
  description?: string;
  type: 'feedback' | 'inquiry' | 'complaint' | 'custom' | 'survey';
  fields?: Array<{
    id: string;
    type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'rating' | 'date' | 'question';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      minLength?: number;
      maxLength?: number;
    };
    questionData?: {
      question: string;
      options: string[];
      correctAnswer: string;
      explanation?: string;
      imageUrl?: string;
      hasImage: boolean;
      points?: number;
      allowPartialCredit?: boolean;
      multipleCorrectAnswers?: string[];
    };
  }>;
  formLink: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
  isPublic: boolean;
  allowAnonymous: boolean;
  accessControl?: {
    isPrivate: boolean;
    accessListId?: string;
    allowedEmails?: string[];
  };
  settings?: {
    showProgressBar: boolean;
    closeAfterSubmission: boolean;
    limitResponses: number;
    expiryDate: Date;
  };
  responseCount: number;
}

interface TestListItem {
  _id: string;
  testName: string;
  description?: string;
  testLink: string;
  createdAt: string;
  responseCount: number;
  isActive: boolean;
  isPublic: boolean;
  showResults: boolean;
  allowAnonymous: boolean;
  timeLimit?: number;
  questions: Array<{
    id: string;
    type: 'mcq' | 'qa';
    question: string;
    options?: string[];
    correctAnswer?: string;
    points: number;
    isRequired: boolean;
  }>;
}

const formTypeIcons: Record<string, { icon: string; color: string }> = {
  feedback: { icon: '⭐', color: 'bg-yellow-100 text-yellow-800' },
  inquiry: { icon: '❓', color: 'bg-blue-100 text-blue-800' },
  complaint: { icon: '⚠️', color: 'bg-red-100 text-red-800' },
  custom: { icon: '📝', color: 'bg-purple-100 text-purple-800' },
  survey: { icon: '📊', color: 'bg-green-100 text-green-800' }
};

const testTypeIcons: Record<string, { icon: string; color: string }> = {
  mcq: { icon: '📝', color: 'bg-blue-100 text-blue-800' },
  qa: { icon: '❓', color: 'bg-green-100 text-green-800' },
  mixed: { icon: '📊', color: 'bg-purple-100 text-purple-800' }
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'tests' | 'forms' | 'access' | 'subscription' | 'submissions'>('tests');
  const [activeSubTab, setActiveSubTab] = useState<'create-forms' | 'my-forms'>('create-forms');
  const [activeTestSubTab, setActiveTestSubTab] = useState<'create-tests' | 'my-tests'>('create-tests');
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [editingTest, setEditingTest] = useState<TestListItem | null>(null);
  const [testData, setTestData] = useState<TestListItem | null>(null);
  const [editingForm, setEditingForm] = useState<FormListItem | null>(null);
  const [formData, setFormData] = useState<FormListItem | null>(null);
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);

  const fetchForms = async () => {
    setFormsLoading(true);
    try {
      const response = await fetch('/api/forms?limit=6');
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms || []);
      } else {
        toast.error('Failed to fetch forms');
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to fetch forms');
    } finally {
      setFormsLoading(false);
    }
  };

  const fetchTests = async () => {
    setTestsLoading(true);
    try {
      const response = await fetch('/api/tests?limit=6');
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
      } else {
        toast.error('Failed to fetch tests');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to fetch tests');
    } finally {
      setTestsLoading(false);
    }
  };

  const deleteForm = async (formId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Form deleted successfully');
        fetchForms();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete form');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Failed to delete form');
    }
  };

  const deleteTest = async (testId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Test deleted successfully');
        fetchTests();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete test');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
    }
  };

  const copyTestLink = (testLink: string) => {
    const fullUrl = `${window.location.origin}/test/${testLink}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Test link copied to clipboard!');
  };

  const fetchTestForEdit = async (testId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched test data:', data.test); // Debug log
        setTestData(data.test);
        return data.test;
      } else {
        toast.error('Failed to fetch test data');
        return null;
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      toast.error('Failed to fetch test data');
      return null;
    }
  };

  const handleEditTest = async (test: TestListItem) => {
    setEditingTest(test);
    setActiveTestSubTab('create-tests'); // Switch to create tab to show editor
    const testData = await fetchTestForEdit(test._id);
    if (testData) {
      setTestData(testData);
    }
  };

  const handleCancelEdit = () => {
    setEditingTest(null);
    setTestData(null);
  };

  const handleTestSaved = () => {
    setEditingTest(null);
    setTestData(null);
    fetchTests(); // Refresh the tests list
  };

  const fetchFormForEdit = async (formId: string) => {
    try {
      const response = await fetch(`/api/forms/${formId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched form data:', data.form); // Debug log
        setFormData(data.form);
        return data.form;
      } else {
        toast.error('Failed to fetch form data');
        return null;
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Failed to fetch form data');
      return null;
    }
  };

  const handleEditForm = async (form: FormListItem) => {
    setEditingForm(form);
    setActiveSubTab('create-forms'); // Switch to create tab to show editor
    const formData = await fetchFormForEdit(form._id);
    if (formData) {
      setFormData(formData);
    }
  };

  const handleCancelFormEdit = () => {
    setEditingForm(null);
    setFormData(null);
  };

  const handleFormSaved = () => {
    setEditingForm(null);
    setFormData(null);
    fetchForms(); // Refresh the forms list
  };

  const refreshUserData = async () => {
    try {
      const response = await fetch('/api/user/refresh', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Helper function to get current user data (refreshed or session)
  const getCurrentUser = (): any => {
    if (userData) {
      return userData;
    }

    // Fallback to session data but map old field names to new ones
    if (session?.user) {
      return {
        ...session.user,
        // Map old field names to new ones for backward compatibility
        testsLimit: session.user.testsLimit || (session.user.isPaid ? 10 : 5),
        formsLimit: session.user.formsLimit || (session.user.isPaid ? 10 : 5),
        accessListsLimit: session.user.accessListsLimit || (session.user.isPaid ? 10 : 1),
        aiGradingLimit: session.user.aiGradingLimit || (session.user.isPaid ? 20 : 2),
        mcqAiLimit: session.user.mcqAiLimit || (session.user.isPaid ? 100 : 10),
        questionAiLimit: session.user.questionAiLimit || (session.user.isPaid ? 100 : 10),
        mcqAiUsed: session.user.mcqAiUsed || 0,
        questionAiUsed: session.user.questionAiUsed || 0,
      };
    }

    return null;
  };

  const getTestType = (questions: TestListItem['questions']) => {
    const hasMcq = questions.some(q => q.type === 'mcq');
    const hasQa = questions.some(q => q.type === 'qa');

    if (hasMcq && hasQa) return 'mixed';
    if (hasMcq) return 'mcq';
    if (hasQa) return 'qa';
    return 'mixed';
  };

  const getTotalPoints = (questions: TestListItem['questions']) => {
    return questions.reduce((sum, q) => sum + q.points, 0);
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth');
      return;
    }

    // User is authenticated and can access dashboard
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user && activeSubTab === 'my-forms') {
      fetchForms();
    }
  }, [session, activeSubTab]);

  useEffect(() => {
    if (session?.user && activeTestSubTab === 'my-tests') {
      fetchTests();
    }
  }, [session, activeTestSubTab]);

  useEffect(() => {
    if (session?.user && activeTab === 'subscription') {
      refreshUserData();
    }
  }, [session, activeTab]);

  const mainTabs = [
    { id: 'tests', name: 'Test Management', icon: SparklesIcon },
    { id: 'forms', name: 'Form Management', icon: DocumentTextIcon },
    { id: 'access', name: 'Access Lists', icon: UsersIcon },
    { id: 'submissions', name: 'My Submissions', icon: ClipboardDocumentCheckIcon },
    { id: 'subscription', name: 'Subscription & Limits', icon: CreditCardIcon },
  ];


  const formSubTabs = [
    { id: 'create-forms', name: 'Create Forms & Surveys', icon: DocumentTextIcon },
    { id: 'my-forms', name: 'My Forms & Surveys', icon: ListBulletIcon },
  ];

  const testSubTabs = [
    { id: 'create-tests', name: 'Create Tests', icon: SparklesIcon },
    { id: 'my-tests', name: 'My Tests', icon: ClipboardDocumentListIcon },
  ];

  return (
    <div className="min-h-screen bg-black transition-colors duration-300">
      {/* Site Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Welcome back, {session?.user.name}! Manage your tests, forms, and access lists.
          </p>
        </div>

        {/* Main Tab Navigation */}
        <div className="border-b border-neutral-800 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <nav className="-mb-px flex space-x-8 min-w-max">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as 'tests' | 'forms' | 'access' | 'subscription' | 'submissions');
                    // Set default sub-tab when switching main tabs
                    if (tab.id === 'forms') {
                      setActiveSubTab('create-forms');
                    } else if (tab.id === 'tests') {
                      setActiveTestSubTab('create-tests');
                    }
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sub Tab Navigation - For Forms and Tests */}
        {(activeTab === 'forms' || activeTab === 'tests') && (
          <div className="border-b border-neutral-800 mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <nav className="-mb-px flex space-x-6 min-w-max">
              {(activeTab === 'forms' ? formSubTabs : testSubTabs).map((subTab) => {
                const Icon = subTab.icon;
                const isActive = activeTab === 'forms'
                  ? activeSubTab === subTab.id
                  : activeTestSubTab === subTab.id;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => {
                      if (activeTab === 'forms') {
                        setActiveSubTab(subTab.id as 'create-forms' | 'my-forms');
                      } else {
                        setActiveTestSubTab(subTab.id as 'create-tests' | 'my-tests');
                      }
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${isActive
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{subTab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}


        {/* Tab Content */}
        <div className="space-y-4">
          {/* Test Management Content */}
          {activeTab === 'tests' && (
            <>
              {activeTestSubTab === 'create-tests' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Create Tests</h2>
                      <p className="text-gray-600 dark:text-gray-400">Create custom tests with MCQ and Q&A questions</p>
                    </div>
                  </div>

                  {/* Test Creation Content */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm">
                    {editingTest ? (
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              Editing: {editingTest.testName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Make changes to your test and save when done
                            </p>
                          </div>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            Cancel Edit
                          </button>
                        </div>
                        <TestBuilder
                          initialData={(() => {
                            console.log('Passing to TestBuilder:', testData);
                            return testData ? {
                              testName: testData.testName,
                              description: testData.description || '',
                              questions: testData.questions,
                              timeLimit: testData.timeLimit,
                              isPublic: testData.isPublic,
                              showResults: testData.showResults,
                              allowAnonymous: testData.allowAnonymous,
                              isEditing: true,
                              testId: testData._id
                            } : undefined;
                          })()}
                          onSave={handleTestSaved}
                        />
                      </div>
                    ) : (
                      <TestBuilder />
                    )}
                  </div>
                </div>
              )}
              {activeTestSubTab === 'my-tests' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">My Tests</h2>
                      <p className="text-gray-600 dark:text-gray-400">Manage your created tests</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setActiveTestSubTab('create-tests')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Test
                      </button>
                    </div>
                  </div>

                  {testsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm p-6 animate-pulse">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : tests.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No tests yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first test to get started</p>
                      <button
                        onClick={() => setActiveTestSubTab('create-tests')}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create Your First Test
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tests.map((test) => {
                        const testType = getTestType(test.questions);
                        const typeInfo = testTypeIcons[testType] || testTypeIcons.mixed;
                        const totalPoints = getTotalPoints(test.questions);

                        return (
                          <div
                            key={test._id}
                            className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm hover:border-neutral-700 transition-all p-6"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                                  <span className="text-lg">{typeInfo.icon}</span>
                                </div>
                                <div>
                                  <h3 className="font-medium text-white truncate">{test.testName}</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{testType}</p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => copyTestLink(test.testLink)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                  title="Copy test link"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEditTest(test)}
                                  className="p-1 text-gray-400 hover:text-green-600"
                                  title="Edit test"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteTest(test._id, test.testName)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                  title="Delete test"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Questions:</span>
                                <span className="font-medium text-white">{test.questions.length}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Total Points:</span>
                                <span className="font-medium text-white">{totalPoints}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Responses:</span>
                                <span className="font-medium text-white">{test.responseCount}</span>
                              </div>
                              {test.timeLimit && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Time Limit:</span>
                                  <span className="font-medium text-white">{test.timeLimit} min</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${test.isActive
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                  }`}>
                                  {test.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex items-center justify-between">
                                <a
                                  href={`/tests/responses/${test._id}`}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                >
                                  View Responses
                                </a>
                                <a
                                  href={`/test/${test.testLink}`}
                                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  Share Link
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Form Management Content */}
          {activeTab === 'forms' && (
            <>
              {activeSubTab === 'create-forms' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Create Forms & Surveys</h2>
                      <p className="text-gray-600 dark:text-gray-400">Create custom forms for feedback, inquiries, complaints, and surveys</p>
                    </div>
                  </div>

                  {/* Form Creation Content */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm">
                    {editingForm ? (
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              Editing: {editingForm.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Make changes to your form and save when done
                            </p>
                          </div>
                          <button
                            onClick={handleCancelFormEdit}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            Cancel Edit
                          </button>
                        </div>
                        <FormEditor
                          initialForm={(() => {
                            console.log('Passing to FormEditor:', formData);
                            return formData ? {
                              _id: formData._id,
                              title: formData.title,
                              description: formData.description,
                              type: formData.type,
                              fields: formData.fields || [],
                              formLink: formData.formLink,
                              createdBy: formData.createdBy,
                              createdAt: formData.createdAt,
                              isActive: formData.isActive,
                              isPublic: formData.isPublic,
                              allowAnonymous: formData.allowAnonymous,
                              accessControl: formData.accessControl || { isPrivate: false, allowedEmails: [] },
                              settings: formData.settings || {
                                showProgressBar: true,
                                closeAfterSubmission: true,
                                limitResponses: 1,
                                expiryDate: new Date()
                              },
                              responseCount: formData.responseCount
                            } : undefined;
                          })()}
                          onSaveSuccess={handleFormSaved}
                          isEditing={true}
                        />
                      </div>
                    ) : (
                      <FormBuilder />
                    )}
                  </div>
                </div>
              )}
              {activeSubTab === 'my-forms' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">My Forms & Surveys</h2>
                      <p className="text-gray-600 dark:text-gray-400">Manage your created forms and surveys</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <a
                        href="#"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        View All
                      </a>
                      <a
                        href="#"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Form
                      </a>
                    </div>
                  </div>

                  {formsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm p-6 animate-pulse">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : forms.length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No forms yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first form to get started</p>
                      <a
                        href="#"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create Your First Form
                      </a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {forms.map((form) => {
                        const typeInfo = formTypeIcons[form.type] || formTypeIcons.custom;
                        return (
                          <div
                            key={form._id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                                  <span className="text-lg">{typeInfo.icon}</span>
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{form.title}</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{form.type}</p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => window.open(`/form/${form.formLink}`, '_blank')}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="View form"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEditForm(form)}
                                  className="p-1 text-gray-400 hover:text-green-600"
                                  title="Edit form"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteForm(form._id, form.title)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                  title="Delete form"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Responses:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{form.responseCount}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${form.isActive
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                  }`}>
                                  {form.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex items-center justify-between">
                                <a
                                  href={`/forms/responses/${form._id}`}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                >
                                  View Responses
                                </a>
                                <a
                                  href={`/form/${form.formLink}`}
                                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  Share Link
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Access Lists Content */}
          {activeTab === 'access' && <AccessListManager />}

          {/* My Submissions Content */}
          {activeTab === 'submissions' && <MySubmissions />}

          {/* Subscription & Limits Content */}
          {activeTab === 'subscription' && session && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Subscription & Limits</h2>
                  <p className="text-gray-600 dark:text-gray-400">Manage your subscription and view usage limits</p>
                </div>
                <button
                  onClick={refreshUserData}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Refresh Data
                </button>
              </div>

              {/* Current Plan Status */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Current Plan</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCurrentUser()?.isPaid
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                    : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                    }`}>
                    {getCurrentUser()?.isPaid ? 'Paid Plan' : 'Free Plan'}
                  </span>
                </div>

                {getCurrentUser()?.isPaid && getCurrentUser()?.subscriptionEndDate && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Subscription valid until: {new Date(getCurrentUser()!.subscriptionEndDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Usage Limits Display */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Usage Limits</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Tests */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Tests</h4>
                      <SparklesIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Number(getCurrentUser()?.testsCreated || 0)}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        /{Number(getCurrentUser()?.testsLimit || 5)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (Number(getCurrentUser()?.testsCreated || 0) / Number(getCurrentUser()?.testsLimit || 5)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Forms */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Forms</h4>
                      <DocumentTextIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Number(getCurrentUser()?.formsCreated || 0)}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        /{Number(getCurrentUser()?.formsLimit || 5)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (Number(getCurrentUser()?.formsCreated || 0) / Number(getCurrentUser()?.formsLimit || 5)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* AI Grading */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">AI Grading</h4>
                      <ChartBarIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Number(getCurrentUser()?.aiGradingUsed || 0)}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        /{Number(getCurrentUser()?.aiGradingLimit || 2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (Number(getCurrentUser()?.aiGradingUsed || 0) / Number(getCurrentUser()?.aiGradingLimit || 2)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* MCQ Generation */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">MCQ Generation</h4>
                      <SparklesIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Number(getCurrentUser()?.mcqAiUsed || 0)}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        /{Number(getCurrentUser()?.mcqAiLimit || 10)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (Number(getCurrentUser()?.mcqAiUsed || 0) / Number(getCurrentUser()?.mcqAiLimit || 10)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Q&A Generation */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Q&A Generation</h4>
                      <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Number(getCurrentUser()?.questionAiUsed || 0)}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        /{Number(getCurrentUser()?.questionAiLimit || 10)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (Number(getCurrentUser()?.questionAiUsed || 0) / Number(getCurrentUser()?.questionAiLimit || 10)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Access Lists */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Access Lists</h4>
                      <UsersIcon className="h-5 w-5 text-teal-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Number(getCurrentUser()?.accessListsCreated || 0)}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        /{Number(getCurrentUser()?.accessListsLimit || 1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (Number(getCurrentUser()?.accessListsCreated || 0) / Number(getCurrentUser()?.accessListsLimit || 1)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Subscription Plans */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {session?.user.isPaid ? 'Subscription Management' : 'Upgrade Your Plan'}
                </h3>
                <SubscriptionPlans />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
