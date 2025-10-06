'use client';

import React from 'react';
import { IFormField } from '@/models/Form';
import { 
  TrashIcon, 
  DocumentDuplicateIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface FieldEditorProps {
  field: IFormField;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<IFormField>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const fieldTypeIcons: Record<string, string> = {
  text: '📝',
  email: '📧',
  number: '🔢',
  textarea: '📄',
  select: '📋',
  radio: '⚪',
  checkbox: '☑️',
  rating: '⭐',
  date: '📅'
};

export default function FieldEditor({
  field,
  isEditing,
  onEdit,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  canMoveUp,
  canMoveDown
}: FieldEditorProps) {
  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...(field.options || [])];
    newOptions[optionIndex] = value;
    onUpdate({ options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(field.options || []), 'New Option'];
    onUpdate({ options: newOptions });
  };

  const removeOption = (optionIndex: number) => {
    const newOptions = field.options?.filter((_, i) => i !== optionIndex) || [];
    onUpdate({ options: newOptions });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{fieldTypeIcons[field.type] || '📝'}</span>
          <span className="font-medium text-gray-900">{field.label}</span>
          {field.required && <span className="text-red-500">*</span>}
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Move up"
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Move down"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1 text-gray-400 hover:text-blue-600"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-600"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Remove"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4 bg-gray-50 p-4 rounded">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Required field
            </label>
          </div>

          {/* Options for select, radio, checkbox */}
          {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-2">
                {field.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(optionIndex, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeOption(optionIndex)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Remove option"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}

          {/* Validation settings for rating */}
          {field.type === 'rating' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
                <input
                  type="number"
                  value={field.validation?.min || 1}
                  onChange={(e) => onUpdate({ 
                    validation: { 
                      ...field.validation, 
                      min: parseInt(e.target.value) || 1 
                    } 
                  })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Rating</label>
                <input
                  type="number"
                  value={field.validation?.max || 5}
                  onChange={(e) => onUpdate({ 
                    validation: { 
                      ...field.validation, 
                      max: parseInt(e.target.value) || 5 
                    } 
                  })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
          )}

          {/* Validation settings for text/textarea */}
          {(field.type === 'text' || field.type === 'textarea' || field.type === 'email') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Length</label>
                <input
                  type="number"
                  value={field.validation?.minLength || ''}
                  onChange={(e) => onUpdate({ 
                    validation: { 
                      ...field.validation, 
                      minLength: e.target.value ? parseInt(e.target.value) : undefined 
                    } 
                  })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Length</label>
                <input
                  type="number"
                  value={field.validation?.maxLength || ''}
                  onChange={(e) => onUpdate({ 
                    validation: { 
                      ...field.validation, 
                      maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                    } 
                  })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
          )}

          {/* Pattern validation for text/email */}
          {(field.type === 'text' || field.type === 'email') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pattern (Regex)</label>
              <input
                type="text"
                value={field.validation?.pattern || ''}
                onChange={(e) => onUpdate({ 
                  validation: { 
                    ...field.validation, 
                    pattern: e.target.value || undefined 
                  } 
                })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., ^[0-9]+$ for numbers only"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          <p>Type: {field.type}</p>
          {field.placeholder && <p>Placeholder: {field.placeholder}</p>}
          {field.options && field.options.length > 0 && (
            <p>Options: {field.options.join(', ')}</p>
          )}
          {field.validation && (
            <p>Validation: {JSON.stringify(field.validation)}</p>
          )}
        </div>
      )}
    </div>
  );
}
