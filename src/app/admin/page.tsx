'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SyncButton from '@/features/sheets-sync/SyncButton';

interface SyncStatus {
  configured: boolean;
  hasSheetId: boolean;
  hasCredentials: boolean;
  message?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [testCaseCount, setTestCaseCount] = useState<number | null>(null);

  useEffect(() => {
    // Check admin access
    const access = sessionStorage.getItem('beta_access');
    const isAdmin = sessionStorage.getItem('is_admin');

    if (access !== 'granted') {
      router.push('/');
      return;
    }

    // Optionally enforce admin-only access
    // if (isAdmin !== 'true') {
    //   router.push('/app');
    //   return;
    // }

    // Fetch sync status
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/sync');
        const data = await res.json();
        if (data.success) {
          setSyncStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch sync status:', error);
      }

      // Fetch test case count
      try {
        const res = await fetch('/api/test-cases');
        const data = await res.json();
        if (data.success) {
          setTestCaseCount(data.testCases?.length || 0);
        }
      } catch (error) {
        console.error('Failed to fetch test cases:', error);
      }

      setLoading(false);
    };

    fetchStatus();
  }, [router]);

  const handleSyncComplete = (count: number) => {
    setTestCaseCount(count);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--procore-gray-light)]">
        <div className="text-[var(--procore-gray)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--procore-gray-light)]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[var(--procore-orange)] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[var(--procore-black)]">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-[var(--procore-gray)]">
                  Manage test cases and sync settings
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/app')}
                className="text-sm text-[var(--procore-gray)] hover:text-[var(--procore-black)]"
              >
                Go to App
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem('beta_access');
                  sessionStorage.removeItem('is_admin');
                  router.push('/');
                }}
                className="text-sm text-[var(--procore-gray)] hover:text-[var(--procore-black)]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Sync Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[var(--procore-black)] mb-4">
            Google Sheets Sync
          </h2>

          {syncStatus && !syncStatus.configured && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {syncStatus.message || 'Google Sheets integration is not fully configured.'}
              </p>
              {!syncStatus.hasSheetId && (
                <p className="text-xs text-yellow-700 mt-1">
                  • Missing GOOGLE_SHEET_ID environment variable
                </p>
              )}
              {!syncStatus.hasCredentials && (
                <p className="text-xs text-yellow-700 mt-1">
                  • Missing Google service account credentials
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--procore-gray)]">
                Current test cases in database:
              </p>
              <p className="text-2xl font-bold text-[var(--procore-black)]">
                {testCaseCount !== null ? testCaseCount : '-'}
              </p>
            </div>
            <SyncButton onSyncComplete={handleSyncComplete} />
          </div>
        </div>

        {/* Configuration Help */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[var(--procore-black)] mb-4">
            Configuration
          </h2>
          <div className="text-sm text-[var(--procore-gray)] space-y-2">
            <p>To enable Google Sheets sync, add these environment variables:</p>
            <ul className="list-disc list-inside space-y-1 font-mono text-xs bg-gray-50 p-4 rounded">
              <li>GOOGLE_SHEET_ID - The ID from your Google Sheet URL</li>
              <li>GOOGLE_SERVICE_ACCOUNT_EMAIL - Your service account email</li>
              <li>GOOGLE_PRIVATE_KEY - Your service account private key</li>
              <li>DATABASE_URL - Your Neon Postgres connection string</li>
            </ul>
          </div>
        </div>

        {/* Sheet Structure Guide */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[var(--procore-black)] mb-4">
            Sheet Structure
          </h2>
          <div className="text-sm text-[var(--procore-gray)] space-y-2">
            <p>Your Google Sheet should have 3 columns:</p>
            <table className="w-full text-xs border border-gray-200 mt-2">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border-b text-left">What</th>
                  <th className="p-2 border-b text-left">Test Step</th>
                  <th className="p-2 border-b text-left">System behaviour</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-100">
                  <td className="p-2 border-b font-medium">Feature Name</td>
                  <td className="p-2 border-b text-gray-400">(empty)</td>
                  <td className="p-2 border-b text-gray-400">(empty)</td>
                </tr>
                <tr className="bg-yellow-100">
                  <td className="p-2 border-b font-medium">Sub-feature</td>
                  <td className="p-2 border-b text-gray-400">(description)</td>
                  <td className="p-2 border-b text-gray-400">(empty)</td>
                </tr>
                <tr>
                  <td className="p-2 border-b"></td>
                  <td className="p-2 border-b">Click the button</td>
                  <td className="p-2 border-b">The modal opens</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2">
              <span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span>
              Green rows = Feature categories
            </p>
            <p>
              <span className="inline-block w-3 h-3 bg-yellow-400 rounded mr-1"></span>
              Yellow rows = Sub-features / Workflows
            </p>
            <p>
              <span className="inline-block w-3 h-3 bg-white border border-gray-300 rounded mr-1"></span>
              White rows = Test steps
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
