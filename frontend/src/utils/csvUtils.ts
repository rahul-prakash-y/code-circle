/**
 * Zero-dependency RFC-4180 compliant CSV Utility.
 * Replaces heavy client-side spreadsheet libraries (SheetJS / xlsx: 425 kB)
 * for templates, exports, and client-side tabular data processing.
 */

/**
 * Escapes a single CSV cell value according to RFC-4180.
 * Wraps values with commas, double quotes, or newlines in quotes, and escapes internal quotes.
 */
export function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports an array of objects to a downloadable CSV file.
 * Automatically adds UTF-8 Byte Order Mark (\uFEFF) so Microsoft Excel opens it with correct encoding.
 */
export function exportToCsv(data: Record<string, any>[], filename: string): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const headerLine = headers.map(escapeCsvField).join(',');

  const rows = data.map((row) =>
    headers.map((h) => escapeCsvField(row[h] !== undefined ? row[h] : '')).join(',')
  );

  const csvContent = '\uFEFF' + [headerLine, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses a single CSV line honoring double quotes and commas within quotes.
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses CSV file text into an array of objects keyed by header names.
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  const clean = csvText.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  const lines = clean.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] !== undefined ? values[j] : '';
    }
    records.push(obj);
  }

  return records;
}

export default {
  escapeCsvField,
  exportToCsv,
  parseCsvLine,
  parseCsv,
};
