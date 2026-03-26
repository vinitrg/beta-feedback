import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSheetList, syncSheet, syncAllSheets } from '@/features/sheets-sync/GoogleSheetsService';

// Check if we're in demo mode
const isDemoMode = !process.env.DATABASE_URL;

export async function POST(request: NextRequest) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      return NextResponse.json(
        { success: false, error: 'Google Sheet ID not configured' },
        { status: 500 }
      );
    }

    // Get optional sheetName from request body
    let sheetName: string | undefined;
    try {
      const body = await request.json();
      sheetName = body.sheetName;
    } catch {
      // No body or invalid JSON - sync all sheets
    }

    if (isDemoMode) {
      // In demo mode, just fetch and return test cases without saving to DB
      const testCases = sheetName
        ? await syncSheet(sheetId, sheetName)
        : await syncAllSheets(sheetId);

      return NextResponse.json({
        success: true,
        message: `Fetched ${testCases.length} test cases from Google Sheets (demo mode - not saved to DB)`,
        count: testCases.length,
        testCases,
      });
    }

    // Fetch test cases
    const testCases = sheetName
      ? await syncSheet(sheetId, sheetName)
      : await syncAllSheets(sheetId);

    if (testCases.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No test cases found in the sheet(s)' },
        { status: 400 }
      );
    }

    // Clear existing test cases and insert new ones
    await sql`DELETE FROM test_feedback`;
    await sql`DELETE FROM test_cases`;

    // Insert new test cases
    for (const tc of testCases) {
      await sql`
        INSERT INTO test_cases (sheet_name, category, subcategory, test_step, system_behaviour, sheet_row_index, updated_at)
        VALUES (${tc.sheetName}, ${tc.category}, ${tc.subcategory}, ${tc.testStep}, ${tc.systemBehaviour}, ${tc.sheetRowIndex}, NOW())
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
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const hasSheetId = !!sheetId;
    const hasCredentials = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && !!process.env.GOOGLE_PRIVATE_KEY;

    if (!hasSheetId || !hasCredentials) {
      return NextResponse.json({
        success: true,
        configured: false,
        hasSheetId,
        hasCredentials,
        sheets: [],
      });
    }

    // Fetch list of sheets
    const sheets = await getSheetList(sheetId);

    return NextResponse.json({
      success: true,
      configured: true,
      hasSheetId,
      hasCredentials,
      sheets,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to check sync status' },
      { status: 500 }
    );
  }
}
