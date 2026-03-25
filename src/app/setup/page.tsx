'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TEST_PLATFORMS = [
  'Android',
  'iOS',
  'Web',
  'Android+Web',
  'iOS+Web',
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
];

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    projectUrl: '',
    testPlatform: '',
    languageTested: '',
    deviceBrowser: '',
  });

  // Check if user has access
  useEffect(() => {
    const access = sessionStorage.getItem('beta_access');
    if (access !== 'granted') {
      router.push('/');
    }

    // Check if tester info already exists
    const existingSession = localStorage.getItem('tester_session_id');
    if (existingSession) {
      // Redirect to app if already set up
      router.push('/app');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        // Store session ID in localStorage for persistence
        localStorage.setItem('tester_session_id', data.sessionId);
        localStorage.setItem('tester_info', JSON.stringify(formData));
        router.push('/app');
      } else {
        setError(data.error || 'Failed to save your information');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.company &&
    formData.name &&
    formData.testPlatform &&
    formData.languageTested;

  return (
    <main className="min-h-screen bg-[var(--procore-gray-light)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--procore-orange)] rounded-lg mb-4">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--procore-black)]">
              Tester Information
            </h1>
            <p className="text-[var(--procore-gray)] mt-2">
              Please provide your details before starting the feedback session
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-[var(--procore-gray)] mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Enter your company name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] focus:border-transparent"
                required
              />
            </div>

            {/* Tester Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--procore-gray)] mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] focus:border-transparent"
                required
              />
            </div>

            {/* Project URL */}
            <div>
              <label htmlFor="projectUrl" className="block text-sm font-medium text-[var(--procore-gray)] mb-2">
                Project URL
              </label>
              <input
                type="url"
                id="projectUrl"
                name="projectUrl"
                value={formData.projectUrl}
                onChange={handleChange}
                placeholder="https://app.procore.com/project/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] focus:border-transparent"
              />
            </div>

            {/* Test Platform */}
            <div>
              <label htmlFor="testPlatform" className="block text-sm font-medium text-[var(--procore-gray)] mb-2">
                Test Platform <span className="text-red-500">*</span>
              </label>
              <select
                id="testPlatform"
                name="testPlatform"
                value={formData.testPlatform}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] focus:border-transparent bg-white"
                required
              >
                <option value="">Select platform...</option>
                {TEST_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Tested */}
            <div>
              <label htmlFor="languageTested" className="block text-sm font-medium text-[var(--procore-gray)] mb-2">
                Language Tested <span className="text-red-500">*</span>
              </label>
              <select
                id="languageTested"
                name="languageTested"
                value={formData.languageTested}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] focus:border-transparent bg-white"
                required
              >
                <option value="">Select language...</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Device/Browser */}
            <div>
              <label htmlFor="deviceBrowser" className="block text-sm font-medium text-[var(--procore-gray)] mb-2">
                Device / Browser
              </label>
              <input
                type="text"
                id="deviceBrowser"
                name="deviceBrowser"
                value={formData.deviceBrowser}
                onChange={handleChange}
                placeholder="e.g., iPhone 15 Pro, Chrome 120, Samsung Galaxy S24"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Continue to Feedback'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
