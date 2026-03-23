'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { UserIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function SiteHeader() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className={`${isLandingPage ? 'bg-white/40 border-neutral-200/30' : 'bg-black/40 border-neutral-800/30'} backdrop-blur-xl sticky top-0 z-50 transition-all duration-300 border-b`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className={`text-lg font-medium ${isLandingPage ? 'text-black' : 'text-white'} hover:opacity-70 transition-opacity tracking-tight font-sans`}>
              asksync.amberbisht.me
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="https://github.com/Amber-bisht/askSync" target="_blank" rel="noopener noreferrer" className={`text-sm ${isLandingPage ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white'} font-medium transition-colors`}>
              GitHub
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className={`text-sm ${isLandingPage ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white'} font-medium transition-colors`}>
                  Dashboard
                </Link>
                <Link href="/profile" className={`text-sm ${isLandingPage ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white'} font-medium transition-colors flex items-center`}>
                  <UserIcon className={`h-4 w-4 mr-1.5 ${isLandingPage ? 'opacity-70' : 'opacity-50'}`} />
                  Profile
                </Link>
                <button onClick={() => signOut()} className={`text-sm ${isLandingPage ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white'} font-medium transition-colors`}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" className={`text-sm ${isLandingPage ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white'} font-medium transition-colors`}>
                  Sign In
                </Link>
              </>
            )}
          </nav>

          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className={`${isLandingPage ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white'} focus:outline-none`}
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
          <nav className={`md:hidden py-6 border-t ${isLandingPage ? 'border-neutral-100/50 bg-white/80' : 'border-neutral-800/50 bg-black/80'} backdrop-blur-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300`}>
            <Link
              href="https://github.com/Amber-bisht/askSync"
              target="_blank"
              rel="noopener noreferrer"
              className={`block px-6 text-base ${isLandingPage ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white'} font-medium transition-colors`}
              onClick={() => setIsMenuOpen(false)}
            >
              GitHub
            </Link>
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className={`block px-6 text-base ${isLandingPage ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white'} font-medium transition-colors`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className={`block px-6 text-base ${isLandingPage ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white'} font-medium transition-colors flex items-center`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserIcon className={`h-5 w-5 mr-2 ${isLandingPage ? 'opacity-70' : 'opacity-50'}`} />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className={`block w-full text-left px-6 text-base ${isLandingPage ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white'} font-medium transition-colors`}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className={`block px-6 text-base ${isLandingPage ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white'} font-medium transition-colors`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
