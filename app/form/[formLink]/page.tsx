'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import FormRenderer from '@/components/forms/FormRenderer';
import SiteHeader from '@/components/SiteHeader';
import { IForm } from '@/models/Form';
import { ExclamationTriangleIcon, ClockIcon, UsersIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

export default function FormPage() {
  const params = useParams();
  const [form, setForm] = useState<IForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/link/${params.formLink}`);
        const data = await response.json();

        if (response.ok) {
          setForm(data.form);
        } else {
          setError(data.error || 'Form not found');
        }
      } catch (err) {
        setError('Failed to load form');
        console.error('Error fetching form:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.formLink) {
      fetchForm();
    }
  }, [params.formLink]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black transition-colors duration-200">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-black transition-colors duration-200">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-md mx-auto p-6">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Form Not Found</h1>
            <p className="text-gray-400 mb-4">
              {error || 'The form you\'re looking for doesn\'t exist or has been removed.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black transition-colors duration-200">
      <SiteHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Form Header Info */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-300 bg-neutral-900 px-4 py-2 rounded-full shadow-lg border border-neutral-800">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Active Form</span>
            </div>

            {form.settings.limitResponses && (
              <div className="flex items-center space-x-1">
                <UsersIcon className="h-4 w-4" />
                <span>{form.responseCount} / {form.settings.limitResponses} responses</span>
              </div>
            )}

            {form.settings.expiryDate && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>
                  Expires: {new Date(form.settings.expiryDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Form Component */}
        <FormRenderer
          form={form}
          onSubmitSuccess={(responseId) => {
            // You could redirect or show success message
            console.log('Form submitted successfully:', responseId);
          }}
        />

        {/* Enhanced Footer */}
        <footer className="mt-16 border-t border-neutral-800 pt-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-semibold text-white">Test Unlocked</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Create and manage intelligent tests and forms with AI-generated questions
            </p>
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <Link href="/" className="hover:text-blue-400 transition-colors">Home</Link>
              <Link href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link>
              <Link href="/tests" className="hover:text-blue-400 transition-colors">Tests</Link>
              <Link href="/about-project" className="hover:text-blue-400 transition-colors">About</Link>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              © 2024 Test Unlocked. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
