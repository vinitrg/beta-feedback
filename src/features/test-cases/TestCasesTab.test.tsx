import { render, screen } from '@testing-library/react';
import TestCasesTab from './TestCasesTab';

// Mock fetch
global.fetch = jest.fn();

describe('TestCasesTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<TestCasesTab testerId={1} />);
    expect(screen.getByText('Loading test cases...')).toBeInTheDocument();
  });

  it('shows message when no test cases available', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ success: true, testCases: [] }),
    });

    render(<TestCasesTab testerId={1} />);

    // Wait for loading to complete
    const message = await screen.findByText(/No test cases available/i);
    expect(message).toBeInTheDocument();
  });

  it('renders test cases grouped by category', async () => {
    const mockTestCases = [
      { id: 1, category: 'Settings', subcategory: 'Display', test_step: 'Click button', system_behaviour: 'Modal opens' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ success: true, testCases: mockTestCases }),
    });

    render(<TestCasesTab testerId={1} />);

    // Wait for category header to appear
    const categoryHeader = await screen.findByText('Settings');
    expect(categoryHeader).toBeInTheDocument();
  });
});
