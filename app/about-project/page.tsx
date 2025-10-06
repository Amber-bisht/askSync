'use client';

import { useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { 
  AcademicCapIcon, 
  DocumentTextIcon,
  BeakerIcon,
  CircleStackIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  ChartBarIcon,
  CreditCardIcon,
  LockClosedIcon,
  EyeIcon,
  SparklesIcon,
  ShieldCheckIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function AboutProjectPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const techStack = [
    {
      category: 'Frontend',
      technologies: [
        { name: 'Next.js 15.5.3', description: 'React framework with App Router', icon: '⚛️' },
        { name: 'React 18', description: 'UI library with hooks and modern features', icon: '🔧' },
        { name: 'TypeScript', description: 'Type-safe JavaScript development', icon: '📘' },
        { name: 'Tailwind CSS', description: 'Utility-first CSS framework', icon: '🎨' },
        { name: 'Heroicons', description: 'Beautiful SVG icons', icon: '🎯' }
      ]
    },
    {
      category: 'Backend & Database',
      technologies: [
        { name: 'Next.js API Routes', description: 'Serverless API endpoints', icon: '🚀' },
        { name: 'MongoDB', description: 'NoSQL database for scalability', icon: '🍃' },
        { name: 'Mongoose', description: 'MongoDB object modeling', icon: '📊' },
        { name: 'NextAuth.js', description: 'Authentication solution', icon: '🔐' }
      ]
    },
    {
      category: 'AI & External Services',
      technologies: [
        { name: 'Google Gemini 1.5 Flash', description: 'Advanced AI for question generation', icon: '🤖' },
        { name: 'Google OAuth', description: 'Secure authentication provider', icon: '🔑' },
        { name: 'Razorpay', description: 'Payment gateway integration', icon: '💳' }
      ]
    },
    {
      category: 'Development Tools',
      technologies: [
        { name: 'ESLint', description: 'Code quality and consistency', icon: '✅' },
        { name: 'PostCSS', description: 'CSS processing and optimization', icon: '🎨' },
        { name: 'Git', description: 'Version control system', icon: '📝' }
      ]
    }
  ];

  const features = [
    {
      category: 'AI-Powered Question Generation',
      icon: SparklesIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      items: [
        'Generate high-quality MCQs using Google Gemini 1.5 Flash',
        'Customizable question difficulty and topics',
        'Automatic answer validation and explanations',
        'Bulk question generation for comprehensive tests',
        'Context-aware question creation from reference materials'
      ]
    },
    {
      category: 'Form Builder & Management',
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      items: [
        'Intuitive drag-and-drop form builder',
        'Multiple field types (text, multiple choice, rating, etc.)',
        'Pre-built form templates for quick setup',
        'Real-time form preview and validation',
        'Conditional logic and dynamic fields'
      ]
    },
    {
      category: 'Test Creation & Management',
      icon: AcademicCapIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      items: [
        'Create comprehensive MCQ tests',
        'Unified test creation interface',
        'Test sharing via unique links',
        'Time-limited and unlimited test options',
        'Test attempt tracking and analytics'
      ]
    },
    {
      category: 'AI Grading & Analytics',
      icon: ChartBarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      items: [
        'Automatic AI-powered answer grading',
        'Detailed performance analytics',
        'Individual student progress tracking',
        'Time-spent analysis per question',
        'CSV export for teachers and administrators'
      ]
    },
    {
      category: 'Access Control & Privacy',
      icon: LockClosedIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      items: [
        'Private and public test options',
        'Access list management for controlled sharing',
        'Role-based permissions (Teacher/Student)',
        'Secure test link generation',
        'Privacy controls for sensitive content'
      ]
    },
    {
      category: 'Payment & Subscriptions',
      icon: CreditCardIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      items: [
        'Razorpay integration for secure payments',
        'Free tier with limited features',
        'Paid subscription plans with enhanced limits',
        'Pay-per-test creation model',
        'Usage tracking and limit management'
      ]
    },
    {
      category: 'User Experience',
      icon: UsersIcon,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      items: [
        'Friendly and intuitive user interface',
        'Dark/light theme support',
        'Responsive design for all devices',
        'View all submissions and results',
        'Real-time notifications and updates'
      ]
    }
  ];

  const userLimits = [
    {
      plan: 'Free Tier',
      icon: '🆓',
      features: [
        '5 AI-generated questions per month',
        '3 custom forms',
        'Basic analytics',
        'Public tests only',
        'Standard support'
      ],
      limits: [
        'Limited question generation',
        'Basic form features',
        'No CSV export'
      ]
    },
    {
      plan: 'Premium Plan',
      icon: '⭐',
      features: [
        'Unlimited AI-generated questions',
        'Unlimited custom forms',
        'Advanced analytics with CSV export',
        'Private and public tests',
        'Priority support',
        'Custom branding options'
      ],
      limits: [
        'No usage restrictions',
        'Full feature access',
        'Advanced reporting'
      ]
    }
  ];

  const preBuiltForms = [
    { name: 'Student Feedback Form', description: 'Collect course feedback and suggestions', icon: '📝' },
    { name: 'Course Evaluation', description: 'Comprehensive course assessment form', icon: '📊' },
    { name: 'Assignment Submission', description: 'Submit and track assignments', icon: '📤' },
    { name: 'Event Registration', description: 'Register for workshops and events', icon: '🎟️' },
    { name: 'Survey & Polls', description: 'Create quick surveys and polls', icon: '📋' },
    { name: 'Complaint Form', description: 'Submit complaints and issues', icon: '⚠️' }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: GlobeAltIcon },
    { id: 'features', name: 'Features', icon: BeakerIcon },
    { id: 'tech-stack', name: 'Tech Stack', icon: CodeBracketIcon },
    { id: 'pricing', name: 'Pricing', icon: CreditCardIcon },
    { id: 'ui-preview', name: 'UI Preview', icon: EyeIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <AcademicCapIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            AskSync Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            A comprehensive AI-powered test and forms management platform featuring Google Gemini 1.5 Flash integration, 
            advanced analytics, secure payments, and intuitive user experience for educators and students.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-8 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-md'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Content Sections */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
                Platform Overview
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="space-y-6">
                  <div className="bg-white dark:bg-black rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
                      AI-Powered Intelligence
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Leverage Google Gemini 1.5 Flash for intelligent question generation, 
                      automatic grading, and contextual understanding.
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-black rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-2" />
                      Secure & Scalable
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Built with enterprise-grade security, role-based access control, 
                      and scalable architecture for growing institutions.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white dark:bg-black rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <CreditCardIcon className="h-6 w-6 text-orange-600 mr-2" />
                      Flexible Pricing
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Free tier available with premium features for advanced users. 
                      Razorpay integration for seamless payments.
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-black rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <UsersIcon className="h-6 w-6 text-teal-600 mr-2" />
                      User-Friendly
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Intuitive interface with pre-built templates, real-time previews, 
                      and comprehensive analytics dashboard.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
                Platform Features
              </h2>
              
              <div className="grid gap-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className={`${feature.bgColor} dark:bg-gray-700 rounded-xl p-6 border-l-4 ${feature.color.replace('text-', 'border-')}`}>
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${feature.bgColor} dark:bg-gray-600`}>
                          <Icon className={`h-8 w-8 ${feature.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            {feature.category}
                          </h3>
                          <ul className="space-y-2">
                            {feature.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start">
                                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pre-built Forms Section */}
              <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                  Pre-built Form Templates
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {preBuiltForms.map((form, index) => (
                    <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{form.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{form.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{form.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tech Stack Tab */}
          {activeTab === 'tech-stack' && (
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
                Technology Stack
              </h2>
              
              {techStack.map((category, index) => (
                <div key={index} className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                    <CircleStackIcon className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-2" />
                    {category.category}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {category.technologies.map((tech, techIndex) => (
                      <div key={techIndex} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{tech.icon}</span>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{tech.name}</h4>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{tech.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
                Pricing Plans
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {userLimits.map((plan, index) => (
                  <div key={index} className={`rounded-2xl p-8 ${
                    plan.plan === 'Premium Plan' 
                      ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700' 
                      : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                  }`}>
                    <div className="text-center mb-6">
                      <span className="text-4xl mb-4 block">{plan.icon}</span>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{plan.plan}</h3>
                      {plan.plan === 'Premium Plan' && (
                        <div className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          Features Included
                        </h4>
                        <ul className="space-y-2">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="text-gray-600 dark:text-gray-300 text-sm">
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                          <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                          Limitations
                        </h4>
                        <ul className="space-y-2">
                          {plan.limits.map((limit, limitIndex) => (
                            <li key={limitIndex} className="text-gray-600 dark:text-gray-300 text-sm">
                              {limit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UI Preview Tab */}
          {activeTab === 'ui-preview' && (
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
                User Interface Preview
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      🎨 Modern & Intuitive Design
                    </h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li>• Clean, professional interface</li>
                      <li>• Dark/Light theme support</li>
                      <li>• Responsive design for all devices</li>
                      <li>• Smooth animations and transitions</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      📊 Analytics Dashboard
                    </h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li>• Real-time performance metrics</li>
                      <li>• Visual charts and graphs</li>
                      <li>• Export data to CSV format</li>
                      <li>• Detailed student progress tracking</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      🔧 Easy Form Builder
                    </h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li>• Drag-and-drop interface</li>
                      <li>• Pre-built templates</li>
                      <li>• Real-time preview</li>
                      <li>• Conditional logic support</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-teal-900/20 dark:to-indigo-900/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      📱 Mobile-First Approach
                    </h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li>• Optimized for mobile devices</li>
                      <li>• Touch-friendly interactions</li>
                      <li>• Fast loading times</li>
                      <li>• Offline capability</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}