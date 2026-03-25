'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccessPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (data.success) {
        // Store access in session storage
        sessionStorage.setItem('beta_access', 'granted');
        if (data.role === 'admin') {
          sessionStorage.setItem('is_admin', 'true');
        }
        router.push('/setup');
      } else {
        setError('Invalid access code. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--procore-gray-light)]">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Procore Logo Placeholder */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--procore-orange)] rounded-lg mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--procore-black)]">
            Beta Feedback Portal
          </h1>
          <p className="text-[var(--procore-gray)] mt-2">
            Enter your access code to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="access-code"
              className="block text-sm font-medium text-[var(--procore-gray)] mb-2"
            >
              Access Code
            </label>
            <input
              type="text"
              id="access-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your access code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] focus:border-transparent"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--procore-gray)] mt-6">
          Don&apos;t have an access code?{' '}
          <span className="text-[var(--procore-orange)]">
            Contact your Procore representative
          </span>
        </p>
      </div>
    </main>
  );
}
