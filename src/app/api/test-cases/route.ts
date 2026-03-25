import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Check if we're in demo mode
const isDemoMode = !process.env.DATABASE_URL;

// Demo data for testing without database
const demoTestCases = [
  { id: 1, category: 'Settings', subcategory: 'Measurement system', test_step: 'Click Settings', system_behaviour: 'The settings panel opens' },
  { id: 2, category: 'Settings', subcategory: 'Measurement system', test_step: 'Click the "Measurement system" dropdown', system_behaviour: 'The options of Imperial, Metric (meters) and Metric (millimeters) shown' },
  { id: 3, category: 'Settings', subcategory: 'Measurement system', test_step: 'Select your preferred measurement system', system_behaviour: 'Your preferred measurement system is selected' },
  { id: 4, category: 'Settings', subcategory: 'Performance', test_step: 'Click Settings', system_behaviour: 'The settings panel opens' },
  { id: 5, category: 'Settings', subcategory: 'Performance', test_step: 'Click the "Performance" dropdown', system_behaviour: 'The options of Low, Medium, High and Ultra shown' },
  { id: 6, category: 'Settings', subcategory: 'Performance', test_step: 'Select your preferred performance tier', system_behaviour: 'Your preferred performance tier is selected' },
  { id: 7, category: 'Settings', subcategory: 'Show in viewer', test_step: 'Click Settings', system_behaviour: 'The settings panel opens' },
  { id: 8, category: 'Settings', subcategory: 'Show in viewer', test_step: 'Toggle on/off Navigation Sphere', system_behaviour: 'The Navigation sphere should be toggled on/off' },
  { id: 9, category: 'Settings', subcategory: 'Show in viewer', test_step: 'Toggle on/off 2D mini map', system_behaviour: 'The 2D mini map should be toggled on/off' },
];

export async function GET() {
  try {
    if (isDemoMode) {
      return NextResponse.json({
        success: true,
        testCases: demoTestCases,
        isDemo: true,
      });
    }

    const result = await sql`
      SELECT id, category, subcategory, test_step, system_behaviour, sheet_row_index
      FROM test_cases
      ORDER BY sheet_row_index ASC
    `;

    return NextResponse.json({
      success: true,
      testCases: result,
      isDemo: false,
    });
  } catch (error) {
    console.error('Error fetching test cases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch test cases' },
      { status: 500 }
    );
  }
}
