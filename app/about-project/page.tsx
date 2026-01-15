'use client';

import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import {
  AcademicCapIcon,
  CodeBracketIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

export default function AboutProjectPage() {
  const techStack = [
    { name: 'Next.js 16.1', description: 'Latest React framework', icon: <CubeIcon className="w-6 h-6" /> },
    { name: 'Google Gemini 1.5', description: 'Advanced AI integration', icon: <SparklesIcon className="w-6 h-6" /> },
    { name: 'MongoDB & Mongoose', description: 'Scalable database', icon: <CodeBracketIcon className="w-6 h-6" /> },
    { name: 'NextAuth.js', description: 'Secure authentication', icon: <ShieldCheckIcon className="w-6 h-6" /> },
    { name: 'Razorpay', description: 'Payment processing', icon: <CreditCardIcon className="w-6 h-6" /> },
  ];

  return (
    <div className="min-h-screen bg-black text-white transition-colors duration-300">
      <SiteHeader />

      <main className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-neutral-900 rounded-2xl mb-6 border border-neutral-800">
            <AcademicCapIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
            AskSync Platform
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            A modern, AI-powered platform for creating intelligent tests and forms.
            Built with the latest web technologies for speed and scalability.
          </p>
        </div>

        {/* Tech Stack Grid */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">Powered By</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {techStack.map((tech, index) => (
              <div
                key={index}
                className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-neutral-700 transition-colors"
              >
                <div className="mb-3 text-white">
                  {tech.icon}
                </div>
                <h3 className="font-semibold text-lg mb-1">{tech.name}</h3>
                <p className="text-gray-400 text-sm">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Core Philosophy (Simple Text) */}
        <div className="prose prose-invert max-w-none text-center">
          <h2 className="text-2xl font-bold mb-6">Built for simplicity and performance.</h2>
          <p className="text-gray-400 text-lg">
            AskSync leverages <strong>Next.js 16.1</strong> to deliver a lightning-fast experience.
            From generating questions with <strong>Google Gemini AI</strong> to managing secure access lists,
            every feature is designed to be intuitive and powerful.
          </p>
        </div>

        {/* Action */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}