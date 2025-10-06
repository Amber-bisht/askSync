'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import DynamicFormField from './DynamicFormField';
import { IForm } from '@/models/Form';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface FormRendererProps {
  form: IForm;
  onSubmitSuccess?: (responseId: string) => void;
  isPreview?: boolean;
}

export default function FormRenderer({ form, onSubmitSuccess, isPreview = false }: FormRendererProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<Record<string, string | string[] | number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Calculate progress
  const totalFields = form.fields.length;
  const filledFields = Object.keys(formData).filter(key => {
    const value = formData[key];
    return value !== undefined && value !== '' && value !== null;
  }).length;
  const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;

  useEffect(() => {
    // Check if user is authenticated (always required now)
    if (!session?.user && !isPreview) {
      toast.error('Please sign in to submit this form');
    }
  }, [session, isPreview]);

  const handleFieldChange = (fieldId: string, value: string | string[] | number) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    form.fields.forEach(field => {
      const value = formData[field.id];

      // Check required fields
      if (field.required && (!value || value === '' || (Array.isArray(value) && value.length === 0))) {
        newErrors[field.id] = `${field.label} is required`;
        return;
      }

      // Skip validation for empty optional fields
      if (!value || value === '') return;

      // Type-specific validation
      switch (field.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            newErrors[field.id] = 'Please enter a valid email address';
          }
          break;

        case 'number':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            newErrors[field.id] = 'Please enter a valid number';
          } else {
            if (field.validation?.min !== undefined && numValue < field.validation.min) {
              newErrors[field.id] = `Value must be at least ${field.validation.min}`;
            }
            if (field.validation?.max !== undefined && numValue > field.validation.max) {
              newErrors[field.id] = `Value must be at most ${field.validation.max}`;
            }
          }
          break;

        case 'text':
        case 'textarea':
          const strValue = String(value);
          if (field.validation?.minLength && strValue.length < field.validation.minLength) {
            newErrors[field.id] = `Must be at least ${field.validation.minLength} characters`;
          }
          if (field.validation?.maxLength && strValue.length > field.validation.maxLength) {
            newErrors[field.id] = `Must be at most ${field.validation.maxLength} characters`;
          }
          if (field.validation?.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(strValue)) {
              newErrors[field.id] = 'Please enter a valid format';
            }
          }
          break;

        case 'rating':
          const ratingValue = Number(value);
          const maxRating = field.validation?.max || 5;
          if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > maxRating) {
            newErrors[field.id] = `Rating must be between 1 and ${maxRating}`;
          }
          break;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isPreview) {
      toast.success('Form validation passed! (Preview mode)');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Check authentication requirement
    if (!session?.user) {
      toast.error('Please sign in to submit this form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert form data to responses format
      const responses = form.fields.map(field => ({
        fieldId: field.id,
        value: formData[field.id] || ''
      }));

      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: form._id,
          responses
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('Form submitted successfully!');
        if (onSubmitSuccess) {
          onSubmitSuccess(data.responseId);
        }
      } else {
        throw new Error(data.error || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && form.settings.closeAfterSubmission) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
        <p className="text-gray-600">Your response has been submitted successfully.</p>
      </div>
    );
  }

  return (
    <div 
      className="max-w-2xl mx-auto p-8 rounded-xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-200"
    >
      {/* Form Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">{form.title}</h1>
        {form.description && (
          <p className="text-opacity-80 text-gray-600 dark:text-gray-300">
            {form.description}
          </p>
        )}
        
        {/* Progress Bar */}
        {form.settings.showProgressBar && !isSubmitted && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 shadow-inner">
              <div 
                className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"
                style={{ 
                  width: `${progress}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Authentication Warning */}
      {!session?.user && !isPreview && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-sm">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0" />
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">
              You need to sign in to submit this form.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {form.fields.map((field) => (
          <DynamicFormField
            key={field.id}
            field={field}
            value={formData[field.id]}
            onChange={(value) => handleFieldChange(field.id, value)}
            error={errors[field.id]}
            disabled={isSubmitting || (!session?.user && !isPreview)}
          />
        ))}

        {/* Submit Button */}
        <div className="pt-8">
          <button
            type="submit"
            disabled={
              isSubmitting || 
              (!session?.user && !isPreview) ||
              isSubmitted
            }
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg ${
              isSubmitting || isSubmitted
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl active:scale-95 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : isSubmitted ? (
              'Submitted ✓'
            ) : (
              'Submit Form'
            )}
          </button>
        </div>

        {/* Preview Mode Notice */}
        {isPreview && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
            <p className="text-blue-800 dark:text-blue-200 text-sm text-center font-medium">
              🔍 Preview Mode - Form submission is disabled
            </p>
          </div>
        )}
      </form>

      {/* Success Message */}
      {isSubmitted && !form.settings.closeAfterSubmission && (
        <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl shadow-sm">
          <div className="flex items-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
            <p className="text-green-800 dark:text-green-200 font-medium">
              Thank you! Your response has been submitted successfully.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
