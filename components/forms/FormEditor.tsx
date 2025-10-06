'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { IFormField, IForm } from '@/models/Form';
import { formTemplates } from './FormTemplates';
import FieldEditor from './FieldEditor';
import FormRenderer from './FormRenderer';
import AccessControlSettings from './AccessControlSettings';
import QuestionGenerator from './QuestionGenerator';
import { 
  EyeIcon
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
  { value: 'date', label: 'Date Picker', icon: '📅' },
  { value: 'question', label: 'MCQ Question', icon: '❓' }
];

interface FormEditorProps {
  initialForm?: IForm | null;
  onSaveSuccess?: () => void;
  isEditing?: boolean;
}

export default function FormEditor({ initialForm, onSaveSuccess, isEditing = false }: FormEditorProps) {
  const { data: session } = useSession();
  const [formTitle, setFormTitle] = useState(initialForm?.title || '');
  const [formDescription, setFormDescription] = useState(initialForm?.description || '');
  const [formType, setFormType] = useState<'feedback' | 'inquiry' | 'complaint' | 'custom' | 'survey'>(initialForm?.type || 'custom');
  const [fields, setFields] = useState<IFormField[]>(initialForm?.fields || []);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<number | null>(null);
  
  // Form settings
  const [settings, setSettings] = useState({
    showProgressBar: initialForm?.settings?.showProgressBar ?? true,
    closeAfterSubmission: initialForm?.settings?.closeAfterSubmission ?? true,
    limitResponses: initialForm?.settings?.limitResponses ?? 1,
    expiryDate: initialForm?.settings?.expiryDate ? new Date(initialForm.settings.expiryDate).toISOString().split('T')[0] : (() => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date.toISOString().split('T')[0];
    })()
  });


  // Access control
  const [accessControl, setAccessControl] = useState<{
    isPrivate: boolean;
    accessListId?: string;
    allowedEmails?: string[];
  }>({
    isPrivate: initialForm?.accessControl?.isPrivate ?? false,
    accessListId: initialForm?.accessControl?.accessListId,
    allowedEmails: initialForm?.accessControl?.allowedEmails || []
  });


  // Update form state when initialForm changes
  useEffect(() => {
    if (initialForm) {
      setFormTitle(initialForm.title || '');
      setFormDescription(initialForm.description || '');
      setFormType(initialForm.type || 'custom');
      setFields(initialForm.fields || []);
      setSettings({
        showProgressBar: initialForm.settings?.showProgressBar ?? true,
        closeAfterSubmission: initialForm.settings?.closeAfterSubmission ?? true,
        limitResponses: initialForm.settings?.limitResponses ?? 1,
        expiryDate: initialForm.settings?.expiryDate ? new Date(initialForm.settings.expiryDate).toISOString().split('T')[0] : (() => {
          const date = new Date();
          date.setMonth(date.getMonth() + 1);
          return date.toISOString().split('T')[0];
        })()
      });
      setAccessControl({
        isPrivate: initialForm.accessControl?.isPrivate ?? false,
        accessListId: initialForm.accessControl?.accessListId,
        allowedEmails: initialForm.accessControl?.allowedEmails || []
      });
    }
  }, [initialForm]);

  const addField = (type: IFormField['type']) => {
    if (type === 'question') {
      // For question type, we'll handle it differently with the QuestionGenerator
      return;
    }
    
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

  const addQuestionsAsFields = (questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    imageUrl?: string;
    hasImage: boolean;
  }>) => {
    const questionFields: IFormField[] = questions.map((question, index) => ({
      id: `question_${Date.now()}_${index}`,
      type: 'question' as const,
      label: `Question ${fields.filter(f => f.type === 'question').length + index + 1}`,
      required: true,
      questionData: {
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        imageUrl: question.imageUrl,
        hasImage: question.hasImage
      }
    }));
    
    setFields([...fields, ...questionFields]);
    toast.success(`Added ${questions.length} questions to your form!`);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < fields.length) {
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

  const loadTemplate = (templateKey: string) => {
    const template = formTemplates.find(t => t.id === templateKey);
    if (template) {
      setFormTitle(template.name);
      setFormDescription(template.description);
      setFormType(template.type);
      setFields(template.fields.map(field => ({ ...field, id: `field_${Date.now()}_${Math.random()}` })));
      setSelectedTemplate(templateKey);
      toast.success('Template loaded successfully');
    }
  };

  const generateLink = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Date.now().toString(36);
  };

  const saveForm = async () => {
    if (!session?.user?.email) {
      toast.error('Please sign in to save forms');
      return;
    }

    if (!formTitle.trim()) {
      toast.error('Form title is required');
      return;
    }

    if (fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    setIsSaving(true);

    try {
      const formData = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        type: formType,
        fields,
        formLink: isEditing ? initialForm?.formLink : generateLink(formTitle),
        createdBy: session.user.email,
        isActive: true,
        isPublic: !accessControl.isPrivate,
        allowAnonymous: false,
        accessControl: {
          ...accessControl,
          allowedEmails: accessControl.allowedEmails || []
        },
        settings: {
          ...settings,
          expiryDate: new Date(settings.expiryDate)
        },
        responseCount: initialForm?.responseCount || 0
      };

      const url = isEditing ? `/api/forms/${initialForm?._id}` : '/api/forms';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await response.json();
        toast.success(`Form ${isEditing ? 'updated' : 'created'} successfully`);
        
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${isEditing ? 'update' : 'create'} form`);
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} form`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
        <p className="text-gray-600 dark:text-gray-400">Please sign in to {isEditing ? 'edit' : 'create'} forms.</p>
      </div>
    );
  }

  if (isPreviewMode) {
    const previewForm = {
      _id: 'preview',
      title: formTitle,
      description: formDescription,
      type: formType,
      fields,
      formLink: 'preview',
      createdBy: session.user.email!,
      createdAt: new Date(),
      isActive: true,
      isPublic: !accessControl.isPrivate,
      allowAnonymous: false,
      accessControl,
      settings: {
        ...settings,
        expiryDate: new Date(settings.expiryDate)
      },
      responseCount: 0
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Form Preview</h2>
          <button
            onClick={() => setIsPreviewMode(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Editor
          </button>
        </div>
        <FormRenderer form={previewForm} isPreview={true} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Left Sidebar - Form Builder */}
      <div className="lg:col-span-3 space-y-6">
        {/* Form Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Information</h3>
          
          {!isEditing && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Template (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => loadTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Start from scratch</option>
                {formTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Title *
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter form title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as 'feedback' | 'inquiry' | 'complaint' | 'custom' | 'survey')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="custom">Custom</option>
                <option value="feedback">Feedback</option>
                <option value="inquiry">Inquiry</option>
                <option value="complaint">Complaint</option>
                <option value="survey">Survey</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Describe what this form is for"
              rows={3}
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Form Fields</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPreviewMode(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview
              </button>
            </div>
          </div>

          {/* Field List */}
          <div className="space-y-4 mb-6">
            {fields.map((field, index) => (
              <FieldEditor
                key={field.id}
                field={field}
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

            {fields.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No fields added yet. Choose a field type to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Form Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Settings</h3>
          
          <div className="space-y-4">
            {/* Behavior Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Behavior</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.showProgressBar}
                    onChange={(e) => setSettings(prev => ({ ...prev, showProgressBar: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show progress bar</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.closeAfterSubmission}
                    onChange={(e) => setSettings(prev => ({ ...prev, closeAfterSubmission: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Close form after submission</span>
                </label>
              </div>
            </div>

            {/* Limits */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Limits</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Response Limit
                  </label>
                  <input
                    type="number"
                    value={settings.limitResponses}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      limitResponses: parseInt(e.target.value) || 1
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={settings.expiryDate}
                    onChange={(e) => setSettings(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Access Control */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Access Control</h4>
              <AccessControlSettings
                isPrivate={accessControl.isPrivate}
                selectedListId={accessControl.accessListId}
                allowedEmails={accessControl.allowedEmails || []}
                onSettingsChange={(settings) => setAccessControl(settings)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Field Types */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Fields</h3>
          <div className="grid grid-cols-1 gap-2">
            {fieldTypes.map((fieldType) => (
              <button
                key={fieldType.value}
                onClick={() => addField(fieldType.value as IFormField['type'])}
                className="flex items-center space-x-3 w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
              >
                <span className="text-xl">{fieldType.icon}</span>
                <span className="text-sm font-medium text-gray-900">{fieldType.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question Generator */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <QuestionGenerator 
            onQuestionsGenerated={addQuestionsAsFields}
            initialQuestions={[]}
          />
        </div>

        {/* Save Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <button
            onClick={saveForm}
            disabled={isSaving || !formTitle.trim() || fields.length === 0}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                💾
                {isEditing ? 'Update Form' : 'Create Form'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
