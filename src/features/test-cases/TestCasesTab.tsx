'use client';

import { useState, useEffect } from 'react';

interface TestCase {
  id: number;
  category: string;
  subcategory: string;
  test_step: string;
  system_behaviour: string;
}

interface FeedbackData {
  [testCaseId: number]: {
    experience: string;
    gaPriority: string;
    comments: string;
  };
}

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'Exceeded Expectation', label: 'Exceeded Expectation' },
  { value: 'Met Expectation', label: 'Met Expectation' },
  { value: 'Below Expectation', label: 'Below Expectation' },
  { value: 'Unusable', label: 'Unusable' },
  { value: 'n/a', label: 'n/a' },
];

const GA_PRIORITY_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'Must fix', label: 'Must fix' },
  { value: 'Should fix', label: 'Should fix' },
  { value: 'Nice to have', label: 'Nice to have' },
];

interface TestCasesTabProps {
  testerId: number | null;
}

// Build a flat list of rows for table display
interface TableRow {
  type: 'category' | 'subcategory' | 'testcase';
  category?: string;
  subcategory?: string;
  testCase?: TestCase;
}

export default function TestCasesTab({ testerId }: TestCasesTabProps) {
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackData>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch test cases
  useEffect(() => {
    const fetchTestCases = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/test-cases');
        const data = await res.json();
        if (data.success) {
          // Build flat table rows matching Google Sheet structure
          const rows: TableRow[] = [];
          let currentCategory = '';
          let currentSubcategory = '';

          data.testCases.forEach((tc: TestCase) => {
            // Add category header if changed
            if (tc.category && tc.category !== currentCategory) {
              currentCategory = tc.category;
              currentSubcategory = '';
              rows.push({ type: 'category', category: tc.category });
            }

            // Add subcategory header if changed
            if (tc.subcategory && tc.subcategory !== currentSubcategory) {
              currentSubcategory = tc.subcategory;
              rows.push({ type: 'subcategory', subcategory: tc.subcategory });
            }

            // Add test case row
            rows.push({ type: 'testcase', testCase: tc });
          });

          setTableRows(rows);
        }
      } catch (error) {
        console.error('Failed to fetch test cases:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTestCases();
  }, []);

  // Fetch existing feedback
  useEffect(() => {
    if (!testerId) return;

    const fetchFeedback = async () => {
      try {
        const res = await fetch(`/api/test-feedback?testerId=${testerId}`);
        const data = await res.json();
        if (data.success && data.feedback) {
          setFeedback(data.feedback);
        }
      } catch (error) {
        console.error('Failed to fetch feedback:', error);
      }
    };
    fetchFeedback();
  }, [testerId]);

  const updateFeedback = (testCaseId: number, field: string, value: string) => {
    setFeedback((prev) => ({
      ...prev,
      [testCaseId]: {
        ...prev[testCaseId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!testerId) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const feedbackArray = Object.entries(feedback).map(([testCaseId, data]) => ({
        testCaseId: parseInt(testCaseId),
        ...data,
      }));

      const res = await fetch('/api/test-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testerId,
          feedback: feedbackArray,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Feedback submitted successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit feedback' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-[var(--procore-gray)]">
        Loading test cases...
      </div>
    );
  }

  if (tableRows.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--procore-gray)]">
        No test cases available. Please contact an administrator to sync test cases from Google Sheets.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Spreadsheet-style table */}
      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="border-r border-gray-300 px-3 py-2 text-left font-semibold w-[180px]">What</th>
              <th className="border-r border-gray-300 px-3 py-2 text-left font-semibold">Test Step</th>
              <th className="border-r border-gray-300 px-3 py-2 text-left font-semibold">System behaviour</th>
              <th className="border-r border-gray-300 px-3 py-2 text-left font-semibold w-[160px]">Experience</th>
              <th className="border-r border-gray-300 px-3 py-2 text-left font-semibold w-[140px]">GA Priority</th>
              <th className="px-3 py-2 text-left font-semibold w-[200px]">Comments</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, index) => {
              // Category row (green)
              if (row.type === 'category') {
                return (
                  <tr key={`cat-${index}`} className="bg-green-200">
                    <td className="border-r border-b border-gray-300 px-3 py-2 font-bold text-gray-800">
                      {row.category}
                    </td>
                    <td className="border-r border-b border-gray-300 px-3 py-2"></td>
                    <td className="border-r border-b border-gray-300 px-3 py-2"></td>
                    <td className="border-r border-b border-gray-300 px-3 py-2"></td>
                    <td className="border-r border-b border-gray-300 px-3 py-2"></td>
                    <td className="border-b border-gray-300 px-3 py-2"></td>
                  </tr>
                );
              }

              // Subcategory row (yellow)
              if (row.type === 'subcategory') {
                return (
                  <tr key={`sub-${index}`} className="bg-yellow-100">
                    <td className="border-r border-b border-gray-300 px-3 py-2 font-semibold text-gray-700">
                      {row.subcategory}
                    </td>
                    <td className="border-r border-b border-gray-300 px-3 py-2 italic text-gray-600"></td>
                    <td className="border-r border-b border-gray-300 px-3 py-2"></td>
                    <td className="border-r border-b border-gray-300 px-3 py-2"></td>
                    <td className="border-r border-b border-gray-300 px-3 py-2"></td>
                    <td className="border-b border-gray-300 px-3 py-2"></td>
                  </tr>
                );
              }

              // Test case row (white)
              const tc = row.testCase!;
              return (
                <tr key={tc.id} className="hover:bg-gray-50">
                  <td className="border-r border-b border-gray-300 px-3 py-2"></td>
                  <td className="border-r border-b border-gray-300 px-3 py-2 text-gray-800">
                    {tc.test_step}
                  </td>
                  <td className="border-r border-b border-gray-300 px-3 py-2 text-gray-600 italic">
                    {tc.system_behaviour}
                  </td>
                  <td className="border-r border-b border-gray-300 px-1 py-1">
                    <select
                      value={feedback[tc.id]?.experience || ''}
                      onChange={(e) => updateFeedback(tc.id, 'experience', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--procore-orange)]"
                    >
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-r border-b border-gray-300 px-1 py-1">
                    <select
                      value={feedback[tc.id]?.gaPriority || ''}
                      onChange={(e) => updateFeedback(tc.id, 'gaPriority', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--procore-orange)]"
                    >
                      {GA_PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-b border-gray-300 px-1 py-1">
                    <input
                      type="text"
                      value={feedback[tc.id]?.comments || ''}
                      onChange={(e) => updateFeedback(tc.id, 'comments', e.target.value)}
                      placeholder="Comments..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--procore-orange)]"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-4">
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(feedback).length === 0}
          className="ml-auto btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
}
