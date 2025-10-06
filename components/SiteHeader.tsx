'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AcademicCapIcon, UserIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';

export default function SiteHeader() {
  const { data: session } = useSession();

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <Link href="/" className="ml-3 text-2xl font-bold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              AskSync
            </Link>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/about-project" className="nav-link">
              About
            </Link>
            <ThemeToggle />
            {session ? (
              <>
                <Link href="/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <Link href="/profile" className="nav-link flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  Profile
                </Link>
                <Link href="/api/auth/signout" className="nav-link">
                  Sign Out
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth" className="nav-link">
                  Auth
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
