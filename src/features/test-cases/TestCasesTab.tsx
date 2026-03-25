'use client';

import { useState, useEffect } from 'react';

interface TestCase {
  id: number;
  category: string;
  subcategory: string;
  test_step: string;
  system_behaviour: string;
}

interface TestCasesByCategory {
  [category: string]: {
    subcategories: {
      [subcategory: string]: TestCase[];
    };
  };
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
  { value: 'Exceeded Expectation', label: 'Exceeded Expectation', color: 'bg-green-500' },
  { value: 'Met Expectation', label: 'Met Expectation', color: 'bg-yellow-400' },
  { value: 'Below Expectation', label: 'Below Expectation', color: 'bg-orange-500' },
  { value: 'Unusable', label: 'Unusable', color: 'bg-red-500' },
  { value: 'n/a', label: 'n/a', color: 'bg-gray-400' },
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

export default function TestCasesTab({ testerId }: TestCasesTabProps) {
  const [testCases, setTestCases] = useState<TestCasesByCategory>({});
  const [feedback, setFeedback] = useState<FeedbackData>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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
          // Group test cases by category and subcategory
          const grouped: TestCasesByCategory = {};
          data.testCases.forEach((tc: TestCase) => {
            if (!grouped[tc.category]) {
              grouped[tc.category] = { subcategories: {} };
            }
            const subcat = tc.subcategory || 'General';
            if (!grouped[tc.category].subcategories[subcat]) {
              grouped[tc.category].subcategories[subcat] = [];
            }
            grouped[tc.category].subcategories[subcat].push(tc);
          });
          setTestCases(grouped);
          // Expand all categories by default
          setExpandedCategories(new Set(Object.keys(grouped)));
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

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

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

  const getExperienceColor = (value: string) => {
    const option = EXPERIENCE_OPTIONS.find((o) => o.value === value);
    return option?.color || '';
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-[var(--procore-gray)]">
        Loading test cases...
      </div>
    );
  }

  if (Object.keys(testCases).length === 0) {
    return (
      <div className="text-center py-8 text-[var(--procore-gray)]">
        No test cases available. Please contact an administrator to sync test cases from Google Sheets.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(testCases).map(([category, { subcategories }]) => (
        <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Category Header */}
          <button
            onClick={() => toggleCategory(category)}
            className="w-full px-4 py-3 bg-[var(--procore-gray-light)] flex items-center justify-between text-left font-semibold text-[var(--procore-black)]"
          >
            <span>{category}</span>
            <span className="text-[var(--procore-gray)]">
              {expandedCategories.has(category) ? '▼' : '▶'}
            </span>
          </button>

          {/* Test Cases */}
          {expandedCategories.has(category) && (
            <div className="divide-y divide-gray-100">
              {Object.entries(subcategories).map(([subcategory, cases]) => (
                <div key={subcategory}>
                  {subcategory !== 'General' && (
                    <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-[var(--procore-gray)] italic">
                      {subcategory}
                    </div>
                  )}
                  {cases.map((tc) => (
                    <div key={tc.id} className="p-4 hover:bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-xs font-medium text-[var(--procore-gray)] uppercase">
                            Test Step
                          </span>
                          <p className="text-sm text-[var(--procore-black)] mt-1">
                            {tc.test_step}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-[var(--procore-gray)] uppercase">
                            Expected Behaviour
                          </span>
                          <p className="text-sm text-[var(--procore-black)] mt-1">
                            {tc.system_behaviour}
                          </p>
                        </div>
                      </div>

                      {/* Feedback Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                        <div>
                          <label className="text-xs font-medium text-[var(--procore-gray)]">
                            Experience
                          </label>
                          <select
                            value={feedback[tc.id]?.experience || ''}
                            onChange={(e) => updateFeedback(tc.id, 'experience', e.target.value)}
                            className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)] ${
                              feedback[tc.id]?.experience ? getExperienceColor(feedback[tc.id].experience) + ' text-white' : 'bg-white'
                            }`}
                          >
                            {EXPERIENCE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--procore-gray)]">
                            GA Priority
                          </label>
                          <select
                            value={feedback[tc.id]?.gaPriority || ''}
                            onChange={(e) => updateFeedback(tc.id, 'gaPriority', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)]"
                          >
                            {GA_PRIORITY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--procore-gray)]">
                            Comments
                          </label>
                          <input
                            type="text"
                            value={feedback[tc.id]?.comments || ''}
                            onChange={(e) => updateFeedback(tc.id, 'comments', e.target.value)}
                            placeholder="Optional comments..."
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--procore-orange)]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

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
