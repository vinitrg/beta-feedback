'use client';

type Tab = 'test-cases' | 'general-feedback' | 'feature-requests';

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'test-cases', label: 'Test Cases' },
  { id: 'general-feedback', label: 'General Feedback' },
  { id: 'feature-requests', label: 'Feature Requests' },
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
              ${
                activeTab === tab.id
                  ? 'border-[var(--procore-orange)] text-[var(--procore-orange)]'
                  : 'border-transparent text-[var(--procore-gray)] hover:text-[var(--procore-black)] hover:border-gray-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export type { Tab };
