'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [testerName, setTesterName] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    company: '',
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
      router.push('/app');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        // Store session ID and tester info
        localStorage.setItem('tester_session_id', data.tester.session_id);
        localStorage.setItem('tester_info', JSON.stringify({
          company: data.tester.company,
          name: data.tester.name,
          email: data.tester.email,
        }));

        setTesterName(data.tester.name);
        setSuccess(true);

        // Redirect after showing success message
        setTimeout(() => {
          router.push('/app');
        }, 1500);
      } else {
        setError(data.error || 'Failed to log in');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.email && formData.company;

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--procore-gray-light)]">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--procore-black)] mb-2">
            Welcome back, {testerName}!
          </h2>
          <p className="text-[var(--procore-gray)]">
            Redirecting you to the feedback portal...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--procore-gray-light)] py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--procore-orange)] rounded-lg mb-4">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--procore-black)]">
              Welcome Back
            </h1>
            <p className="text-[var(--procore-gray)] mt-2">
              Enter your email and company to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--procore-gray)] mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] focus:border-transparent"
                required
              />
            </div>

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

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Continue'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--procore-gray)]">
              Not registered yet?{' '}
              <Link href="/setup" className="text-[var(--procore-orange)] hover:underline">
                Sign up as a new participant
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
