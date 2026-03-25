'use client';

import { useState } from 'react';

interface SyncButtonProps {
  onSyncComplete?: (count: number) => void;
}

export default function SyncButton({ onSyncComplete }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        onSyncComplete?.(data.count);
      } else {
        setMessage({ type: 'error', text: data.error || 'Sync failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {syncing ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Syncing...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Sync from Google Sheets
          </>
        )}
      </button>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
