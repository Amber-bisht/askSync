'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import SiteHeader from '@/components/SiteHeader';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-black transition-colors duration-300">
      {/* Site Header */}
      <SiteHeader />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Enhanced Hero Title */}
          <div className="mb-8">
            <h1 className="text-5xl font-extrabold text-white sm:text-6xl md:text-7xl leading-tight">
              <span className="block">Create & Take</span>
              <span className="block text-gray-300">
                AI-Powered Tests & Forms
              </span>
            </h1>
          </div>

          {/* Enhanced Description */}
          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-xl text-gray-300 leading-relaxed mb-4">
              Transform your learning experience with intelligent test generation, seamless form creation, and comprehensive performance tracking.
            </p>
            <p className="text-lg text-gray-400">
              Powered by advanced AI to create engaging, personalized assessments and forms for students and educators.
            </p>
          </div>

          {/* Enhanced CTA Section */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {session ? (
              <>
                <Link href="/dashboard" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-black bg-white rounded-xl shadow-lg hover:bg-gray-200 transform hover:-translate-y-1 transition-all duration-300">
                  <span>Dashboard</span>
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-black bg-white rounded-xl shadow-lg hover:bg-gray-200 transform hover:-translate-y-1 transition-all duration-300">
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
