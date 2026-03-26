import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { syncAllSheets } from '@/features/sheets-sync/GoogleSheetsService';

// Check if we're in demo mode
const isDemoMode = !process.env.DATABASE_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetName = searchParams.get('sheet');

    if (isDemoMode) {
      // In demo mode, fetch directly from Google Sheets
      const sheetId = process.env.GOOGLE_SHEET_ID;
      if (sheetId) {
        try {
          const testCases = await syncAllSheets(sheetId);

          // Filter by sheet if specified
          const filtered = sheetName
            ? testCases.filter(tc => tc.sheetName === sheetName)
            : testCases;

          // Transform to match DB format
          const formatted = filtered.map((tc, index) => ({
            id: index + 1,
            sheet_name: tc.sheetName,
            category: tc.category,
            subcategory: tc.subcategory,
            test_step: tc.testStep,
            system_behaviour: tc.systemBehaviour,
            sheet_row_index: tc.sheetRowIndex,
          }));

          // Get unique sheet names
          const sheets = [...new Set(testCases.map(tc => tc.sheetName))];

          return NextResponse.json({
            success: true,
            testCases: formatted,
            sheets,
            isDemo: true,
          });
        } catch (error) {
          console.error('Error fetching from Google Sheets:', error);
        }
      }

      // Fallback demo data
      return NextResponse.json({
        success: true,
        testCases: [],
        sheets: [],
        isDemo: true,
        message: 'Configure GOOGLE_SHEET_ID to see test cases',
      });
    }

    // Database mode
    let result;
    if (sheetName) {
      result = await sql`
        SELECT id, sheet_name, category, subcategory, test_step, system_behaviour, sheet_row_index
        FROM test_cases
        WHERE sheet_name = ${sheetName}
        ORDER BY sheet_row_index ASC
      `;
    } else {
      result = await sql`
        SELECT id, sheet_name, category, subcategory, test_step, system_behaviour, sheet_row_index
        FROM test_cases
        ORDER BY sheet_name, sheet_row_index ASC
      `;
    }

    // Get unique sheet names
    const sheetsResult = await sql`
      SELECT DISTINCT sheet_name FROM test_cases ORDER BY sheet_name
    `;
    const sheets = sheetsResult.map((r: { sheet_name: string }) => r.sheet_name);

    return NextResponse.json({
      success: true,
      testCases: result,
      sheets,
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
