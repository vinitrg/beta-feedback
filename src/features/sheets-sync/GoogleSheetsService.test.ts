import { parseTestCases, SheetRow } from './GoogleSheetsService';

describe('GoogleSheetsService', () => {
  describe('parseTestCases', () => {
    it('correctly parses hierarchical sheet structure', () => {
      const rows: SheetRow[] = [
        { what: 'Settings', testStep: '', systemBehaviour: '', rowIndex: 2, rowColor: 'green' },
        { what: 'Measurement system', testStep: 'Change measurement system', systemBehaviour: '', rowIndex: 3, rowColor: 'yellow' },
        { what: '', testStep: 'Click Settings', systemBehaviour: 'The settings panel opens', rowIndex: 4 },
        { what: '', testStep: 'Select metric', systemBehaviour: 'Metric is selected', rowIndex: 5 },
        { what: 'Performance', testStep: 'Change rendering settings', systemBehaviour: '', rowIndex: 6, rowColor: 'yellow' },
        { what: '', testStep: 'Click Performance dropdown', systemBehaviour: 'Options shown', rowIndex: 7 },
      ];

      const result = parseTestCases(rows);

      expect(result).toHaveLength(3);

      // First test case
      expect(result[0].category).toBe('Settings');
      expect(result[0].subcategory).toBe('Measurement system');
      expect(result[0].testStep).toBe('Click Settings');
      expect(result[0].systemBehaviour).toBe('The settings panel opens');

      // Second test case
      expect(result[1].category).toBe('Settings');
      expect(result[1].subcategory).toBe('Measurement system');
      expect(result[1].testStep).toBe('Select metric');

      // Third test case (different subcategory)
      expect(result[2].category).toBe('Settings');
      expect(result[2].subcategory).toBe('Performance');
      expect(result[2].testStep).toBe('Click Performance dropdown');
    });

    it('handles rows without subcategory', () => {
      const rows: SheetRow[] = [
        { what: 'Navigation', testStep: '', systemBehaviour: '', rowIndex: 2, rowColor: 'green' },
        { what: '', testStep: 'Click home', systemBehaviour: 'Goes to home', rowIndex: 3 },
      ];

      const result = parseTestCases(rows);

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Navigation');
      expect(result[0].subcategory).toBe('');
    });

    it('returns empty array for empty input', () => {
      const result = parseTestCases([]);
      expect(result).toEqual([]);
    });
  });
});
