'use client';

import React from 'react';
import Image from 'next/image';
import { IFormField } from '@/models/Form';

interface DynamicFormFieldProps {
  field: IFormField;
  value: string | string[] | number | undefined;
  onChange: (value: string | string[] | number) => void;
  error?: string;
  disabled?: boolean;
}

export default function DynamicFormField({ 
  field, 
  value, 
  onChange, 
  error, 
  disabled = false 
}: DynamicFormFieldProps) {
  const renderField = () => {
    const baseClasses = `w-full p-3 border rounded-lg transition-all duration-200 ${
      error 
        ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/20' 
        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-200 dark:focus:ring-blue-900/20'
    } ${disabled 
      ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400' 
      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
    } focus:outline-none focus:ring-2 shadow-sm hover:shadow-md focus:shadow-lg`;

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <input
            type={field.type}
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseClasses}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseClasses}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseClasses}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={`${baseClasses} resize-y min-h-[100px]`}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            rows={4}
          />
        );

      case 'select':
        return (
          <select
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseClasses}
          >
            <option value="">-- Select an option --</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      onChange([...currentValue, option]);
                    } else {
                      onChange(currentValue.filter((v: string) => v !== option));
                    }
                  }}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        const maxRating = field.validation?.max || 5;
        return (
          <div className="flex items-center space-x-1">
            {Array.from({ length: maxRating }, (_, index) => {
              const rating = index + 1;
              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() => !disabled && onChange(rating)}
                  disabled={disabled}
                  className={`w-8 h-8 text-2xl transition-colors ${
                    rating <= (typeof value === 'number' ? value : Number(value) || 0)
                      ? 'text-yellow-400 hover:text-yellow-500'
                      : 'text-gray-300 hover:text-gray-400'
                  } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  ⭐
                </button>
              );
            })}
            {value && (
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {Number(value)} out of {maxRating}
              </span>
            )}
          </div>
        );

      case 'question':
        if (!field.questionData) {
          return (
            <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
              <p className="text-gray-500 dark:text-gray-400">Question data not available</p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Question</h4>
              <p className="text-gray-700 dark:text-gray-300 mb-3">{field.questionData.question}</p>
              
              {field.questionData.hasImage && field.questionData.imageUrl && (
                <div className="mb-3">
                  <div className="relative max-w-full max-h-48">
                    <Image
                      src={field.questionData.imageUrl}
                      alt="Question image"
                      width={600}
                      height={192}
                      className="object-contain border border-gray-200 rounded"
                      onError={() => {
                        // Handle error by hiding the image
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {field.questionData.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      value === option
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={field.id}
                      value={option}
                      checked={value === option}
                      onChange={(e) => onChange(e.target.value)}
                      disabled={disabled}
                      className="mr-3 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
                    />
                    <span className="font-medium text-gray-600 dark:text-gray-400 mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <input
            type="text"
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseClasses}
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      <label htmlFor={field.id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
      </label>
      
      {renderField()}
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center bg-red-50 dark:bg-red-900/20 p-2 rounded-md border border-red-200 dark:border-red-800">
          <span className="mr-2">⚠️</span>
          {error}
        </p>
      )}
      
      {field.validation?.maxLength && (field.type === 'text' || field.type === 'textarea') && (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex justify-end">
          {value ? String(value).length : 0} / {field.validation.maxLength} characters
        </p>
      )}
    </div>
  );
}
