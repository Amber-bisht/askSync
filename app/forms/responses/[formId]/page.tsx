'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { 
  ChartBarIcon, 
  ArrowLeftIcon, 
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  EyeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface FormResponse {
  _id: string;
  responses: {
    fieldId: string;
    fieldLabel: string;
    value: string | string[] | number;
  }[];
  submittedBy?: {
    name?: string;
    email?: string;
  };
  submittedAt: string;
  isAnonymous: boolean;
}

interface Form {
  _id: string;
  title: string;
  type: string;
  responseCount: number;
  fields: {
    id: string;
    label: string;
    type: string;
    options?: string[];
  }[];
}

export default function FormResponsesPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${params.formId}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data.form);
      } else {
        toast.error('Form not found');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Failed to fetch form details');
    }
  };

  const fetchResponses = async () => {
    try {
      const response = await fetch(`/api/forms/responses?formId=${params.formId}&page=${currentPage}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setResponses(data.responses);
        setTotalPages(data.pagination.total);
      } else {
        toast.error('Failed to fetch responses');
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast.error('Failed to fetch responses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user && params.formId) {
      fetchForm();
      fetchResponses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, params.formId, currentPage]);

  const exportData = () => {
    if (!form || responses.length === 0) return;

    // Create CSV content
    const headers = ['Submission Date', 'Submitter Name', 'Submitter Email', ...form.fields.map(f => f.label)];
    const csvContent = [
      headers.join(','),
      ...responses.map(response => {
        const row = [
          new Date(response.submittedAt).toLocaleString(),
          response.submittedBy?.name || 'Anonymous',
          response.submittedBy?.email || 'N/A'
        ];
        
        // Add field values in the same order as headers
        form.fields.forEach(field => {
          const responseValue = response.responses.find(r => r.fieldId === field.id)?.value;
          if (Array.isArray(responseValue)) {
            row.push(`"${responseValue.join(', ')}"`);
          } else {
            row.push(`"${responseValue || ''}"`);
          }
        });
        
        return row.join(',');
      })
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title}_responses.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };

  const renderValue = (value: string | string[] | number, fieldType: string) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (fieldType === 'rating') {
      return `${value}/5 ⭐`;
    }
    
    if (fieldType === 'date') {
      return new Date(value as string).toLocaleDateString();
    }
    
    return String(value);
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300">Please sign in to view form responses.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading responses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Back to Forms
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {form?.title} - Responses
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {form?.responseCount} total responses
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href={`/form/${form?._id}`}
                target="_blank"
                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview Form
              </Link>
              
              {responses.length > 0 && (
                <button
                  onClick={exportData}
                  className="flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {form && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{form.responseCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Authenticated</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {responses.filter(r => !r.isAnonymous).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Fields</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{form.fields.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Latest Response</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {responses.length > 0 
                      ? new Date(responses[0].submittedAt).toLocaleDateString()
                      : 'No responses'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Responses List */}
        {responses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No responses yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Share your form to start collecting responses.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link
                href={`/form/${form?._id}`}
                target="_blank"
                className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                View Form
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Submitter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {responses.map((response) => (
                    <tr key={response._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {new Date(response.submittedAt).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(response.submittedAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {response.submittedBy?.name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {response.submittedBy?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {response.responses.slice(0, 2).map((r, idx) => (
                            <div key={idx} className="mb-1">
                              <span className="font-medium">{r.fieldLabel}:</span>{' '}
                              {renderValue(r.value, form?.fields.find(f => f.id === r.fieldId)?.type || 'text')}
                            </div>
                          ))}
                          {response.responses.length > 2 && (
                            <div className="text-gray-500 dark:text-gray-400">+{response.responses.length - 2} more...</div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedResponse(response)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between transition-colors">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Response Detail Modal */}
        {selectedResponse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Response Details</h3>
                  <button
                    onClick={() => setSelectedResponse(null)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Submission Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Submission Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Submitted:</span>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {new Date(selectedResponse.submittedAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Submitter:</span>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {selectedResponse.submittedBy?.name || 'Anonymous'}
                        </div>
                        {selectedResponse.submittedBy?.email && (
                          <div className="text-gray-600 dark:text-gray-400">{selectedResponse.submittedBy.email}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Responses */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Responses</h4>
                    <div className="space-y-4">
                      {selectedResponse.responses.map((response, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                          <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {response.fieldLabel}
                          </div>
                          <div className="text-gray-700 dark:text-gray-300">
                            {renderValue(response.value, form?.fields.find(f => f.id === response.fieldId)?.type || 'text')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedResponse(null)}
                    className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
