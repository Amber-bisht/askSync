'use client';

import { useState, useEffect } from 'react';
import { 
  GlobeAltIcon, 
  LockClosedIcon
} from '@heroicons/react/24/outline';

interface AccessList {
  _id: string;
  name: string;
  description: string;
  userCount: number;
}

interface AccessControlSettingsProps {
  isPrivate: boolean;
  selectedListId?: string;
  allowedEmails?: string[];
  onSettingsChange: (settings: {
    isPrivate: boolean;
    accessListId?: string;
  }) => void;
}

export default function AccessControlSettings({
  isPrivate,
  selectedListId,
  allowedEmails, // eslint-disable-line @typescript-eslint/no-unused-vars
  onSettingsChange
}: AccessControlSettingsProps) {
  const [accessLists, setAccessLists] = useState<AccessList[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccessLists();
  }, []);

  const fetchAccessLists = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/access-lists');
      if (response.ok) {
        const data = await response.json();
        setAccessLists(data.accessLists);
      }
    } catch (error) {
      console.error('Error fetching access lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessModeChange = (isPrivateMode: boolean) => {
    console.log('Access mode changed:', { isPrivateMode, selectedListId });
    onSettingsChange({
      isPrivate: isPrivateMode,
      accessListId: isPrivateMode ? selectedListId : undefined
    });
  };

  const handleListSelection = (listId: string) => {
    console.log('Access list selected:', listId);
    onSettingsChange({
      isPrivate: true,
      accessListId: listId
    });
  };


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Access Control</h3>
        
        {/* Access Mode Selection */}
        <div className="space-y-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="accessMode"
              checked={!isPrivate}
              onChange={() => handleAccessModeChange(false)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="ml-3 flex items-center">
              <GlobeAltIcon className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Public Access</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Anyone with the link can access</div>
              </div>
            </div>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="accessMode"
              checked={isPrivate}
              onChange={() => handleAccessModeChange(true)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="ml-3 flex items-center">
              <LockClosedIcon className="h-5 w-5 text-orange-600 mr-2" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Private Access</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Only specific users can access</div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Private Access Options */}
      {isPrivate && (
        <div className="space-y-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Access List Selection</h4>
            
            <div className="mt-3">
              {loading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading access lists...</div>
              ) : accessLists.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No access lists found. Create one first.
                </div>
              ) : (
                <select
                  value={selectedListId || ''}
                  onChange={(e) => handleListSelection(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select an access list</option>
                  {accessLists.map((list) => (
                    <option key={list._id} value={list._id}>
                      {list.name} ({list.userCount} users)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
