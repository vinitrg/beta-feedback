'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WelcomePage() {
  const router = useRouter();

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

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--procore-gray-light)]">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--procore-orange)] rounded-lg mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--procore-black)]">
            Beta Feedback Portal
          </h1>
          <p className="text-[var(--procore-gray)] mt-2">
            Welcome! How would you like to continue?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full p-6 border-2 border-[var(--procore-orange)] rounded-lg hover:bg-orange-50 transition-colors text-center"
          >
            <div className="text-lg font-semibold text-[var(--procore-black)] mb-1">
              I&apos;m an Existing BETA Participant
            </div>
            <div className="text-sm text-[var(--procore-gray)]">
              Log in with your email to continue
            </div>
          </Link>

          <Link
            href="/setup"
            className="block w-full p-6 border-2 border-gray-300 rounded-lg hover:border-[var(--procore-orange)] hover:bg-orange-50 transition-colors text-center"
          >
            <div className="text-lg font-semibold text-[var(--procore-black)] mb-1">
              I&apos;m a New Participant
            </div>
            <div className="text-sm text-[var(--procore-gray)]">
              Register to start providing feedback
            </div>
          </Link>
        </div>

        <p className="text-center text-sm text-[var(--procore-gray)] mt-6">
          Need help?{' '}
          <span className="text-[var(--procore-orange)]">
            Contact your Procore representative
          </span>
        </p>
      </div>
    </main>
  );
}
