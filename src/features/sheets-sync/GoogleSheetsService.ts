import { google } from 'googleapis';

export interface SheetRow {
  what: string;
  testStep: string;
  systemBehaviour: string;
  rowIndex: number;
  rowColor?: string; // 'green' for feature, 'yellow' for sub-feature, undefined for test step
}

export interface ParsedTestCase {
  category: string;
  subcategory: string;
  testStep: string;
  systemBehaviour: string;
  sheetRowIndex: number;
}

// Color detection thresholds (RGB values)
const isGreen = (r: number, g: number, b: number) => g > 0.7 && r < 0.5 && b < 0.5;
const isYellow = (r: number, g: number, b: number) => r > 0.8 && g > 0.8 && b < 0.5;

export async function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    throw new Error('Google service account credentials not configured');
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function fetchSheetData(sheetId: string): Promise<SheetRow[]> {
  const sheets = await getGoogleSheetsClient();

  // Get sheet data with formatting
  const response = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    includeGridData: true,
    ranges: ['A:C'], // What, Test Step, System behaviour columns
  });

  const sheetData = response.data.sheets?.[0]?.data?.[0];
  if (!sheetData?.rowData) {
    return [];
  }

  const rows: SheetRow[] = [];

  // Skip header row (index 0)
  for (let i = 1; i < sheetData.rowData.length; i++) {
    const row = sheetData.rowData[i];
    const cells = row.values || [];

    // Get cell values
    const what = cells[0]?.formattedValue || '';
    const testStep = cells[1]?.formattedValue || '';
    const systemBehaviour = cells[2]?.formattedValue || '';

    // Skip empty rows
    if (!what && !testStep && !systemBehaviour) {
      continue;
    }

    // Detect row color from first cell background
    let rowColor: string | undefined;
    const bgColor = cells[0]?.effectiveFormat?.backgroundColor;
    if (bgColor) {
      const r = bgColor.red || 0;
      const g = bgColor.green || 0;
      const b = bgColor.blue || 0;

      if (isGreen(r, g, b)) {
        rowColor = 'green';
      } else if (isYellow(r, g, b)) {
        rowColor = 'yellow';
      }
    }

    rows.push({
      what,
      testStep,
      systemBehaviour,
      rowIndex: i + 1, // 1-indexed for human readability
      rowColor,
    });
  }

  return rows;
}

export function parseTestCases(rows: SheetRow[]): ParsedTestCase[] {
  const testCases: ParsedTestCase[] = [];
  let currentCategory = '';
  let currentSubcategory = '';

  for (const row of rows) {
    // Green row = new category (feature)
    if (row.rowColor === 'green') {
      currentCategory = row.what;
      currentSubcategory = '';
      continue;
    }

    // Yellow row = new subcategory (workflow/sub-feature)
    if (row.rowColor === 'yellow') {
      currentSubcategory = row.what;
      continue;
    }

    // Regular row = test case
    if (row.testStep || row.systemBehaviour) {
      testCases.push({
        category: currentCategory,
        subcategory: currentSubcategory,
        testStep: row.testStep,
        systemBehaviour: row.systemBehaviour,
        sheetRowIndex: row.rowIndex,
      });
    }
  }

  return testCases;
}
