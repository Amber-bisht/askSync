'use client';

import { signIn, signOut, getSession, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AcademicCapIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc';

export default function AuthPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      console.log('Checking session...');
      const session = await getSession();
      console.log('Session result:', session);

      if (session) {
        console.log('User is signed in');
        // Redirect to dashboard
        console.log('Redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('No session found. If you just logged in, check NEXTAUTH_URL and NEXTAUTH_SECRET environment variables.');
      }
    };
    checkSession();
  }, [router]);

  const handleGoogleSignIn = async () => {
    console.log('Starting Google sign in...');
    setIsLoading(true);
    try {
      await signIn('google', {
        callbackUrl: '/dashboard'
      });
    } catch (error) {
      console.error('Google sign in error:', error);
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('Starting sign out...');
    setIsSigningOut(true);
    try {
      await signOut({
        callbackUrl: '/',
        redirect: false
      });
      console.log('Sign out successful');
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // If user is already signed in, show sign out interface
  if (session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <UserCircleIcon className="mx-auto h-12 w-12 text-blue-500" />
            <h2 className="mt-6 text-3xl font-bold text-white">
              Welcome back, {session.user?.name}!
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              You are signed in
            </p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border border-neutral-700"
                />
              ) : (
                <UserCircleIcon className="h-10 w-10 text-gray-500" />
              )}
              <div>
                <p className="text-sm font-medium text-white">{session.user?.name}</p>
                <p className="text-sm text-gray-400">{session.user?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  router.push('/dashboard');
                }}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-colors duration-200"
              >
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Go to Dashboard
              </button>

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex justify-center items-center py-3 px-4 border border-neutral-700 rounded-lg shadow-sm bg-neutral-800 text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningOut ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Sign Out
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user is not signed in, show sign in interface
  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-white" />
          <h2 className="mt-6 text-3xl font-bold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Access your dashboard to create and manage tests and forms
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-neutral-700 rounded-lg shadow-sm bg-white text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
              ) : (
                <>
                  <FcGoogle className="h-5 w-5 mr-3" />
                  Sign in with Google
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Privacy Policy
              </a>
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
