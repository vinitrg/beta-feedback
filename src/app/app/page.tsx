'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TabNavigation, { Tab } from '@/components/TabNavigation';
import TestCasesTab from '@/features/test-cases/TestCasesTab';

interface TesterInfo {
  company: string;
  name: string;
  projectUrl: string;
  testPlatform: string;
  languageTested: string;
  deviceBrowser: string;
}

export default function AppPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('test-cases');
  const [testerId, setTesterId] = useState<number | null>(null);
  const [testerInfo, setTesterInfo] = useState<TesterInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check access
    const access = sessionStorage.getItem('beta_access');
    if (access !== 'granted') {
      router.push('/');
      return;
    }

    // Get tester session
    const sessionId = localStorage.getItem('tester_session_id');
    const storedInfo = localStorage.getItem('tester_info');

    if (!sessionId) {
      router.push('/setup');
      return;
    }

    if (storedInfo) {
      setTesterInfo(JSON.parse(storedInfo));
    }

    // Fetch tester ID from backend
    const fetchTesterId = async () => {
      try {
        const res = await fetch(`/api/tester?sessionId=${sessionId}`);
        const data = await res.json();
        if (data.success && data.tester) {
          setTesterId(data.tester.id);
        } else {
          // Session not found, redirect to setup
          localStorage.removeItem('tester_session_id');
          localStorage.removeItem('tester_info');
          router.push('/setup');
        }
      } catch {
        console.error('Failed to fetch tester');
      } finally {
        setLoading(false);
      }
    };

    fetchTesterId();
  }, [router]);

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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[var(--procore-orange)] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[var(--procore-black)]">
                  Beta Feedback Portal
                </h1>
                {testerInfo && (
                  <p className="text-sm text-[var(--procore-gray)]">
                    {testerInfo.name} • {testerInfo.company}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('tester_session_id');
                localStorage.removeItem('tester_info');
                sessionStorage.removeItem('beta_access');
                router.push('/');
              }}
              className="text-sm text-[var(--procore-gray)] hover:text-[var(--procore-black)]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'test-cases' && <TestCasesTab testerId={testerId} />}
          {activeTab === 'general-feedback' && (
            <div className="text-center py-8 text-[var(--procore-gray)]">
              General Feedback feature coming soon...
            </div>
          )}
          {activeTab === 'feature-requests' && (
            <div className="text-center py-8 text-[var(--procore-gray)]">
              Feature Requests feature coming soon...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
