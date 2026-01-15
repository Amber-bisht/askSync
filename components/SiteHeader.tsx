'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AcademicCapIcon, UserIcon } from '@heroicons/react/24/outline';

export default function SiteHeader() {
  const { data: session } = useSession();

  return (
    <header className="bg-black shadow-sm border-b border-neutral-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-white" />
            <Link href="/" className="ml-3 text-2xl font-bold text-white hover:text-gray-300 transition-colors">
              AskSync
            </Link>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/about-project" className="nav-link">
              About
            </Link>
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
