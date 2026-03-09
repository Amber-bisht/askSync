'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { UserIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function SiteHeader() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="bg-black shadow-sm border-b border-neutral-800 transition-colors duration-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-5">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white hover:text-neutral-400 transition-colors tracking-tight">
              AskSync - Test and Forms
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="https://github.com/Amber-bisht/askSync" target="_blank" rel="noopener noreferrer" className="nav-link">
              GitHub
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
                <button onClick={() => signOut()} className="nav-link">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" className="nav-link">
                  Auth
                </Link>
              </>
            )}
          </nav>

          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-500 hover:text-black focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-neutral-800 space-y-4 bg-black">
            <Link
              href="https://github.com/Amber-bisht/askSync"
              target="_blank"
              rel="noopener noreferrer"
              className="block nav-link px-2"
              onClick={() => setIsMenuOpen(false)}
            >
              GitHub
            </Link>
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="block nav-link px-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block nav-link px-2 flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserIcon className="h-4 w-4 mr-1" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left nav-link px-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="block nav-link px-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Auth
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
