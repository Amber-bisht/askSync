'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import SiteHeader from '@/components/SiteHeader';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
    expiresAt?: string;
  };
  limits?: {
    tests: number;
    forms: number;
    accessLists: number;
  };
  usage?: {
    tests: number;
    forms: number;
    accessLists: number;
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: ''
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth');
      return;
    }

    fetchProfile();
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setEditForm({
          name: data.user.name || ''
        });
      } else {
        toast.error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
        setEditing(false);
        fetchProfile();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: profile?.name || ''
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }


  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-300 border border-green-800';
      case 'expired':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'cancelled':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-neutral-800 text-gray-300 border border-neutral-700';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <SiteHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">Personal Information</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center px-3 py-2 border border-neutral-700 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-neutral-800 hover:bg-neutral-700"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center px-3 py-2 border border-neutral-700 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-neutral-800 hover:bg-neutral-700"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-neutral-800 text-white"
                    />
                  ) : (
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                      <span className="text-white">{profile.name || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                    <span className="text-white">{profile.email}</span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Cannot be changed)</span>
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Member Since
                  </label>
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                    <span className="text-white">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          {profile.subscription && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-neutral-800">
                <h2 className="text-lg font-medium text-white">Subscription</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Plan
                    </label>
                    <span className="text-lg font-medium text-white capitalize">
                      {profile.subscription.plan}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionColor(profile.subscription.status)}`}>
                      {profile.subscription.status.charAt(0).toUpperCase() + profile.subscription.status.slice(1)}
                    </span>
                  </div>
                  {profile.subscription.expiresAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expires
                      </label>
                      <span className="text-white">
                        {new Date(profile.subscription.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
