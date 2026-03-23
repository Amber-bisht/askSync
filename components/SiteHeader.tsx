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
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200 border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-5">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-black hover:text-neutral-600 transition-colors tracking-tight">
              asksync.amberbisht.me
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="https://github.com/Amber-bisht/askSync" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-black font-medium transition-colors">
              GitHub
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className="text-neutral-600 hover:text-black font-medium transition-colors">
                  Dashboard
                </Link>
                <Link href="/profile" className="text-neutral-600 hover:text-black font-medium transition-colors flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  Profile
                </Link>
                <button onClick={() => signOut()} className="text-neutral-600 hover:text-black font-medium transition-colors">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" className="text-neutral-600 hover:text-black font-medium transition-colors">
                  Auth
                </Link>
              </>
            )}
          </nav>

          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-neutral-500 hover:text-black focus:outline-none"
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
          <nav className="md:hidden py-4 border-t border-neutral-100 space-y-4 bg-white/95 backdrop-blur-lg">
            <Link
              href="https://github.com/Amber-bisht/askSync"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2 text-neutral-600 hover:text-black font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              GitHub
            </Link>
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-2 text-neutral-600 hover:text-black font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block px-2 text-neutral-600 hover:text-black font-medium flex items-center"
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
                  className="block w-full text-left px-2 text-neutral-600 hover:text-black font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="block px-2 text-neutral-600 hover:text-black font-medium"
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
