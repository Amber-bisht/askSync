'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import SiteHeader from '@/components/SiteHeader';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark transition-colors duration-300">
      {/* Site Header */}
      <SiteHeader />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Enhanced Hero Title */}
          <div className="mb-8">
            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-6xl md:text-7xl leading-tight">
              <span className="block">Create & Take</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                AI-Powered Tests & Forms
              </span>
            </h1>
          </div>
          
          {/* Enhanced Description */}
          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Transform your learning experience with intelligent test generation, seamless form creation, and comprehensive performance tracking.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Powered by advanced AI to create engaging, personalized assessments and forms for students and educators.
            </p>
          </div>
          
          {/* Enhanced CTA Section */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {session ? (
              <>
                <Link href="/dashboard" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <span>Dashboard</span>
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <span>Get Started</span>
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </>
            )}
            
          </div>
        </div>


      </main>
    </div>
  );
}
