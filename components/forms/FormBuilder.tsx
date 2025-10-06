'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { IFormField } from '@/models/Form';
import { formTemplates } from './FormTemplates';
import DynamicFormField from './DynamicFormField';
import FormRenderer from './FormRenderer';
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  DocumentDuplicateIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const fieldTypes = [
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'textarea', label: 'Text Area', icon: '📄' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'radio', label: 'Radio Buttons', icon: '⚪' },
  { value: 'checkbox', label: 'Checkboxes', icon: '☑️' },
  { value: 'rating', label: 'Rating', icon: '⭐' },
  { value: 'date', label: 'Date Picker', icon: '📅' }
];

export default function FormBuilder() {
  const { data: session } = useSession();
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'feedback' | 'inquiry' | 'complaint' | 'custom' | 'survey'>('custom');
  const [fields, setFields] = useState<IFormField[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<number | null>(null);
  
  // Form settings
  const [settings, setSettings] = useState({
    showProgressBar: true,
    closeAfterSubmission: true,
    limitResponses: 1,
    expiryDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date.toISOString().split('T')[0];
    })()
  });


  const [showSettings, setShowSettings] = useState(false);

  const addField = (type: IFormField['type']) => {
    const newField: IFormField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      placeholder: type === 'textarea' ? 'Enter your response...' : 'Enter value...',
      required: false,
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['Option 1', 'Option 2'] : undefined,
      validation: type === 'rating' ? { min: 1, max: 5 } : undefined
    };
    setFields([...fields, newField]);
    setEditingField(fields.length);
  };

  const updateField = (index: number, updates: Partial<IFormField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
    setEditingField(null);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      setFields(newFields);
    }
  };

  const duplicateField = (index: number) => {
    const fieldToDuplicate = { ...fields[index] };
    fieldToDuplicate.id = `field_${Date.now()}`;
    fieldToDuplicate.label = `${fieldToDuplicate.label} (Copy)`;
    const newFields = [...fields];
    newFields.splice(index + 1, 0, fieldToDuplicate);
    setFields(newFields);
  };

  const loadTemplate = (templateId: string) => {
    const template = formTemplates.find(t => t.id === templateId);
    if (template) {
      setFormTitle(template.name);
      setFormDescription(template.description);
      setFormType(template.type);
      setFields(template.fields.map((field, index) => ({
        ...field,
        id: `field_${Date.now()}_${index}`
      })));
      setSelectedTemplate(templateId);
      toast.success(`Template "${template.name}" loaded!`);
    }
  };

  const saveForm = async () => {
    if (!session?.user) {
      toast.error('Please sign in to save forms');
      return;
    }

    if (!formTitle.trim()) {
      toast.error('Please enter a form title');
      return;
    }

    if (fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          type: formType,
          fields,
          settings,
          isPublic: true,
          allowAnonymous: false
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Form saved successfully!');
        // Reset form or redirect
        // You might want to navigate to the form list or show the form link
      } else {
        throw new Error(data.error || 'Failed to save form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save form');
    } finally {
      setIsSaving(false);
    }
  };

  if (isPreviewMode) {
    const previewForm = {
      _id: 'preview',
      title: formTitle || 'Untitled Form',
      description: formDescription,
      type: formType,
      fields,
      formLink: 'preview',
      createdBy: session?.user?.email || '',
      createdAt: new Date(),
      isActive: true,
      isPublic: true,
      allowAnonymous: false,
      settings: {
        ...settings,
        expiryDate: new Date(settings.expiryDate)
      },
      responseCount: 0,
      accessControl: {
        isPrivate: false,
        allowAnonymous: false,
        accessListId: undefined
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Form Preview</h1>
            <button
              onClick={() => setIsPreviewMode(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Editor
            </button>
          </div>
          <FormRenderer form={previewForm} isPreview={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Form Builder</h1>
          <p className="text-gray-600 dark:text-gray-400">Create custom forms for feedback, inquiries, complaints, and surveys</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Form Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Template Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Start with a Template</h3>
              <select
                value={selectedTemplate}
                onChange={(e) => e.target.value && loadTemplate(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select a template...</option>
                {formTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.icon} {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Form Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Form Title *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Enter form title"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe your form (optional)"
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Form Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'feedback' | 'inquiry' | 'complaint' | 'custom' | 'survey')}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="custom">Custom Form</option>
                    <option value="feedback">Feedback</option>
                    <option value="inquiry">Inquiry</option>
                    <option value="complaint">Complaint</option>
                    <option value="survey">Survey</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Field Types */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Fields</h3>
              <div className="grid grid-cols-2 gap-2">
                {fieldTypes.map(fieldType => (
                  <button
                    key={fieldType.value}
                    onClick={() => addField(fieldType.value as IFormField['type'])}
                    className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <div className="text-lg mb-1">{fieldType.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{fieldType.label}</div>
                  </button>
                ))}
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
                  Preview Form
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  Form Settings
                </button>

                <button
                  onClick={saveForm}
                  disabled={isSaving || !formTitle.trim() || fields.length === 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Form'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Form Builder */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Form Fields ({fields.length})</h3>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-4">📝</div>
                  <p>No fields added yet. Choose a field type from the left panel to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      index={index}
                      isEditing={editingField === index}
                      onEdit={() => setEditingField(editingField === index ? null : index)}
                      onUpdate={(updates) => updateField(index, updates)}
                      onRemove={() => removeField(index)}
                      onMoveUp={() => moveField(index, 'up')}
                      onMoveDown={() => moveField(index, 'down')}
                      onDuplicate={() => duplicateField(index)}
                      canMoveUp={index > 0}
                      canMoveDown={index < fields.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <FormSettingsModal
            settings={settings}
            onSettingsChange={setSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  );
}

// Field Editor Component
interface FieldEditorProps {
  field: IFormField;
  index: number;
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

function FieldEditor({
  field,
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
}: FieldEditorProps) {
  const handleOptionChange = (optionIndex: number, value: string) => {
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
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{field.label}</span>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">{field.type}</span>
          {field.required && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">Required</span>}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label</label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Placeholder</label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="flex items-center text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="mr-2"
              />
              Required field
            </label>
          </div>

          {/* Options for select, radio, checkbox */}
          {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options</label>
              {field.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
            </div>
          )}

          {/* Validation settings */}
          {(field.type === 'text' || field.type === 'textarea') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Length</label>
                <input
                  type="number"
                  value={field.validation?.minLength || ''}
                  onChange={(e) => onUpdate({ 
                    validation: { 
                      ...field.validation, 
                      minLength: e.target.value ? parseInt(e.target.value) : undefined 
                    } 
                  })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Length</label>
                <input
                  type="number"
                  value={field.validation?.maxLength || ''}
                  onChange={(e) => onUpdate({ 
                    validation: { 
                      ...field.validation, 
                      maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                    } 
                  })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {field.type === 'rating' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Rating</label>
              <input
                type="number"
                min="3"
                max="10"
                value={field.validation?.max || 5}
                onChange={(e) => onUpdate({ 
                  validation: { 
                    ...field.validation, 
                    max: parseInt(e.target.value) 
                  } 
                })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <DynamicFormField
            field={field}
            value=""
            onChange={() => {}}
            disabled={true}
          />
        </div>
      )}
    </div>
  );
}

// Settings Modal Component

function FormSettingsModal({ 
  settings, 
  onSettingsChange, 
  onClose 
}: {
  settings: { 
    showProgressBar: boolean; 
    closeAfterSubmission: boolean; 
    limitResponses: number; 
    expiryDate: string 
  };
  onSettingsChange: (settings: { 
    showProgressBar: boolean; 
    closeAfterSubmission: boolean; 
    limitResponses: number; 
    expiryDate: string 
  }) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Form Settings</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Behavior Settings */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Behavior</h4>
              <div className="space-y-3">
                <label className="flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.showProgressBar}
                    onChange={(e) => onSettingsChange({ ...settings, showProgressBar: e.target.checked })}
                    className="mr-2"
                  />
                  Show progress bar
                </label>
                <label className="flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.closeAfterSubmission}
                    onChange={(e) => onSettingsChange({ ...settings, closeAfterSubmission: e.target.checked })}
                    className="mr-2"
                  />
                  Close form after submission
                </label>
              </div>
            </div>


            {/* Limits */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Limits</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Response Limit</label>
                  <input
                    type="number"
                    value={settings.limitResponses}
                    onChange={(e) => onSettingsChange({ 
                      ...settings, 
                      limitResponses: parseInt(e.target.value) || 1
                    })}
                    min="1"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={settings.expiryDate}
                    onChange={(e) => onSettingsChange({ 
                      ...settings, 
                      expiryDate: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
