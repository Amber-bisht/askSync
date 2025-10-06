'use client';

import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';

interface GoogleLoginProps {
  onLoginSuccess: (user: { id?: string; name: string; email: string }) => void;
}

export default function GoogleLogin({ onLoginSuccess }: GoogleLoginProps) {
  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', { 
        callbackUrl: window.location.href,
        redirect: false 
      });
      
      if (result?.ok) {
        // Get user session
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        if (session.user) {
          onLoginSuccess(session.user);
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
      >
        <FcGoogle className="h-5 w-5 mr-3" />
        Sign in with Google
      </button>
      
      <p className="text-xs text-gray-500">
        By signing in, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}
