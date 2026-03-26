'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TabNavigation, { Tab } from '@/components/TabNavigation';
import TestCasesTab from '@/features/test-cases/TestCasesTab';
import GeneralFeedbackTab from '@/features/general-feedback/GeneralFeedbackTab';
import FeatureRequestsTab from '@/features/feature-requests/FeatureRequestsTab';

interface TesterInfo {
  email?: string;
  company: string;
  name: string;
  projectUrl: string;
  testPlatform: string;
  languageTested: string;
  deviceBrowser: string;
}

const TEST_PLATFORMS = [
  'Android',
  'iOS',
  'Web',
  'Android+Web',
  'iOS+Web',
];

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
      const parsedInfo = JSON.parse(storedInfo);
      setTesterInfo(parsedInfo);
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

  const handlePlatformChange = (newPlatform: string) => {
    if (!testerInfo) return;

    const updatedInfo = { ...testerInfo, testPlatform: newPlatform };
    setTesterInfo(updatedInfo);
    localStorage.setItem('tester_info', JSON.stringify(updatedInfo));
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
            <div className="flex items-center space-x-4">
              {testerInfo && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="platform-select" className="text-sm text-[var(--procore-gray)]">
                    Platform:
                  </label>
                  <select
                    id="platform-select"
                    value={testerInfo.testPlatform}
                    onChange={(e) => handlePlatformChange(e.target.value)}
                    className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--procore-orange)] bg-white"
                  >
                    {TEST_PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
          {activeTab === 'general-feedback' && <GeneralFeedbackTab testerId={testerId} />}
          {activeTab === 'feature-requests' && <FeatureRequestsTab testerId={testerId} />}
        </div>
      </main>
    </div>
  );
}
