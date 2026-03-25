import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { fetchSheetData, parseTestCases } from '@/features/sheets-sync/GoogleSheetsService';

// Check if we're in demo mode
const isDemoMode = !process.env.DATABASE_URL;

export async function POST(request: NextRequest) {
  try {
    // Verify admin access (optional - can be enforced via session)
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      return NextResponse.json(
        { success: false, error: 'Google Sheet ID not configured' },
        { status: 500 }
      );
    }

    if (isDemoMode) {
      return NextResponse.json(
        { success: false, error: 'Sync not available in demo mode. Please configure DATABASE_URL.' },
        { status: 400 }
      );
    }

    // Fetch data from Google Sheets
    const rows = await fetchSheetData(sheetId);
    const testCases = parseTestCases(rows);

    if (testCases.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No test cases found in the sheet' },
        { status: 400 }
      );
    }

    // Clear existing test cases and insert new ones
    // Using a transaction-like approach
    await sql`DELETE FROM test_feedback`; // Clear feedback first due to FK
    await sql`DELETE FROM test_cases`;

    // Insert new test cases
    for (const tc of testCases) {
      await sql`
        INSERT INTO test_cases (category, subcategory, test_step, system_behaviour, sheet_row_index, updated_at)
        VALUES (${tc.category}, ${tc.subcategory}, ${tc.testStep}, ${tc.systemBehaviour}, ${tc.sheetRowIndex}, NOW())
      `;
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${testCases.length} test cases from Google Sheets`,
      count: testCases.length,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to sync' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return sync status
  try {
    if (isDemoMode) {
      return NextResponse.json({
        success: true,
        configured: false,
        message: 'Running in demo mode - Google Sheets sync not available',
      });
    }

    const hasSheetId = !!process.env.GOOGLE_SHEET_ID;
    const hasCredentials = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && !!process.env.GOOGLE_PRIVATE_KEY;

    return NextResponse.json({
      success: true,
      configured: hasSheetId && hasCredentials,
      hasSheetId,
      hasCredentials,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check sync status' },
      { status: 500 }
    );
  }
}
