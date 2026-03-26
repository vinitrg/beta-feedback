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

// Color detection thresholds (RGB values 0-1)
// More lenient detection for various shades of green and yellow
const isGreen = (r: number, g: number, b: number) => {
  // Green: high green, lower red and blue
  return g > 0.5 && g > r && g > b;
};
const isYellow = (r: number, g: number, b: number) => {
  // Yellow: high red AND green, low blue
  return r > 0.7 && g > 0.7 && b < 0.7 && Math.abs(r - g) < 0.3;
};

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
      currentSubcategory = row.what || row.testStep;
      continue;
    }

    // Fallback: If "What" has content but Test Step is empty, it's likely a header
    // This handles cases where color detection fails
    if (row.what && !row.testStep && !row.systemBehaviour) {
      // If we don't have a category yet, this is a category
      if (!currentCategory) {
        currentCategory = row.what;
      } else {
        // Otherwise it's a subcategory
        currentSubcategory = row.what;
      }
      continue;
    }

    // Another fallback: "What" is empty but testStep has italic/description text (yellow row pattern)
    if (!row.what && row.testStep && !row.systemBehaviour && row.rowColor !== 'green') {
      // This might be a subcategory row where description is in testStep column
      currentSubcategory = row.testStep;
      continue;
    }

    // Regular row = test case (has test_step or system_behaviour)
    if (row.testStep || row.systemBehaviour) {
      testCases.push({
        category: currentCategory || 'General',
        subcategory: currentSubcategory,
        testStep: row.testStep,
        systemBehaviour: row.systemBehaviour,
        sheetRowIndex: row.rowIndex,
      });
    }
  }

  return testCases;
}
