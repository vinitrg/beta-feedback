import { google } from 'googleapis';

export interface SheetInfo {
  id: number;
  title: string;
}

export interface SheetRow {
  what: string;
  testStep: string;
  systemBehaviour: string;
  rowIndex: number;
  rowColor?: string;
}

export interface ParsedTestCase {
  category: string;
  subcategory: string;
  testStep: string;
  systemBehaviour: string;
  sheetRowIndex: number;
  sheetName: string;
}

// Color detection - more lenient for various shades
const isGreen = (r: number, g: number, b: number) => {
  return g > 0.5 && g > r && g > b;
};

const isYellow = (r: number, g: number, b: number) => {
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

// Get list of all sheets in the spreadsheet
export async function getSheetList(sheetId: string): Promise<SheetInfo[]> {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  });

  const sheetTabs = response.data.sheets || [];
  return sheetTabs.map((sheet) => ({
    id: sheet.properties?.sheetId || 0,
    title: sheet.properties?.title || 'Unknown',
  }));
}

// Fetch data from a specific sheet
export async function fetchSheetData(spreadsheetId: string, sheetName: string): Promise<SheetRow[]> {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: true,
    ranges: [`'${sheetName}'!A:C`],
  });

  const sheetData = response.data.sheets?.[0]?.data?.[0];
  if (!sheetData?.rowData) {
    return [];
  }

  const rows: SheetRow[] = [];

  // Skip header rows (1-5), start from row 6 (index 5)
  for (let i = 5; i < sheetData.rowData.length; i++) {
    const row = sheetData.rowData[i];
    const cells = row.values || [];

    const what = cells[0]?.formattedValue || '';
    const testStep = cells[1]?.formattedValue || '';
    const systemBehaviour = cells[2]?.formattedValue || '';

    // Skip completely empty rows
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
      rowIndex: i + 1,
      rowColor,
    });
  }

  return rows;
}

export function parseTestCases(rows: SheetRow[], sheetName: string): ParsedTestCase[] {
  const testCases: ParsedTestCase[] = [];
  let currentCategory = '';
  let currentSubcategory = '';

  for (const row of rows) {
    // Green row = new category (feature)
    // Could have content in "what" column or "testStep" column (as description)
    if (row.rowColor === 'green') {
      if (row.what) {
        currentCategory = row.what;
        currentSubcategory = '';
      }
      // If testStep has content on green row, it might be a subcategory description
      if (row.testStep && !row.systemBehaviour) {
        currentSubcategory = row.testStep;
      }
      continue;
    }

    // Yellow row = subcategory
    if (row.rowColor === 'yellow') {
      currentSubcategory = row.what || row.testStep;
      continue;
    }

    // Check if this is a header-like row (has "what" but no test step details)
    if (row.what && !row.testStep && !row.systemBehaviour) {
      // This might be a category or subcategory without color formatting
      if (!currentCategory) {
        currentCategory = row.what;
      } else {
        currentSubcategory = row.what;
      }
      continue;
    }

    // Regular test case row - must have testStep or systemBehaviour
    if (row.testStep || row.systemBehaviour) {
      testCases.push({
        category: currentCategory || sheetName,
        subcategory: currentSubcategory,
        testStep: row.testStep,
        systemBehaviour: row.systemBehaviour,
        sheetRowIndex: row.rowIndex,
        sheetName,
      });
    }
  }

  return testCases;
}

// Fetch and parse all test cases from a specific sheet
export async function syncSheet(spreadsheetId: string, sheetName: string): Promise<ParsedTestCase[]> {
  const rows = await fetchSheetData(spreadsheetId, sheetName);
  return parseTestCases(rows, sheetName);
}

// Fetch and parse all test cases from all sheets
export async function syncAllSheets(spreadsheetId: string): Promise<ParsedTestCase[]> {
  const sheetList = await getSheetList(spreadsheetId);
  const allTestCases: ParsedTestCase[] = [];

  for (const sheet of sheetList) {
    try {
      const testCases = await syncSheet(spreadsheetId, sheet.title);
      allTestCases.push(...testCases);
    } catch (error) {
      console.error(`Error syncing sheet ${sheet.title}:`, error);
    }
  }

  return allTestCases;
}
