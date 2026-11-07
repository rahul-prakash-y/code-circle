import ExcelJS from 'exceljs';

export const MAX_SPREADSHEET_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_SPREADSHEET_ROWS = 500;

export interface ParsedSpreadsheetRow {
  [key: string]: string;
}

/**
 * Robust RFC-compliant CSV line parser.
 * Handles quoted fields containing commas, spaces, and escaped quotes.
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
        i++; // skip escaped quote
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
 * Parses CSV buffer into array of clean dictionary objects.
 */
export function parseCsvBuffer(buffer: Buffer): ParsedSpreadsheetRow[] {
  const text = buffer.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine).map((h) => h.replace(/^["']|["']$/g, '').trim());

  if (lines.length - 1 > MAX_SPREADSHEET_ROWS) {
    throw new Error(`File exceeds the maximum limit of ${MAX_SPREADSHEET_ROWS} rows`);
  }

  const rows: ParsedSpreadsheetRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const rowObj: ParsedSpreadsheetRow = Object.create(null);

    headers.forEach((h, colIdx) => {
      if (h) {
        rowObj[h] = values[colIdx] ? values[colIdx].replace(/^["']|["']$/g, '').trim() : '';
      }
    });

    // Check that at least one column has a non-empty value
    if (Object.values(rowObj).some((val) => val.length > 0)) {
      rows.push(rowObj);
    }
  }

  return rows;
}

/**
 * Parses XLSX buffer using modern ExcelJS, enforcing size and row bounds.
 */
export async function parseXlsxBuffer(buffer: Buffer): Promise<ParsedSpreadsheetRow[]> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as any);
  } catch (err: any) {
    throw new Error('Malformed or unreadable Excel (.xlsx) file. Please upload a valid workbook.');
  }

  // Find the target sheet (prefer sheets matching mcq, question, assessment, or the first sheet)
  const worksheet =
    workbook.worksheets.find((ws) => {
      const name = ws.name.toLowerCase();
      return name.includes('mcq') || name.includes('question') || name.includes('assessment') || name.includes('student');
    }) ||
    workbook.worksheets.find((ws) => !ws.name.toLowerCase().includes('instruct')) ||
    workbook.worksheets[0];

  if (!worksheet) {
    throw new Error('The uploaded Excel workbook contains no valid sheets');
  }

  const rawRows: ParsedSpreadsheetRow[] = [];
  const headerMap: Map<number, string> = new Map();

  // Read header from row 1
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const val = cell.value ? String(cell.value).trim() : '';
    if (val) {
      headerMap.set(colNumber, val);
    }
  });

  if (headerMap.size === 0) {
    throw new Error('No column headers detected on the first row of the sheet');
  }

  let rowCount = 0;
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    rowCount++;
    if (rowCount > MAX_SPREADSHEET_ROWS) {
      throw new Error(`File exceeds the maximum limit of ${MAX_SPREADSHEET_ROWS} rows`);
    }

    const rowObj: ParsedSpreadsheetRow = Object.create(null);
    let hasAnyValue = false;

    headerMap.forEach((headerName, colNumber) => {
      const cell = row.getCell(colNumber);
      let cellText = '';
      if (cell.value !== null && cell.value !== undefined) {
        if (typeof cell.value === 'object' && 'text' in cell.value) {
          cellText = String((cell.value as any).text || '').trim();
        } else if (typeof cell.value === 'object' && 'result' in cell.value) {
          cellText = String((cell.value as any).result || '').trim();
        } else {
          cellText = String(cell.value).trim();
        }
      }
      if (cellText) hasAnyValue = true;
      rowObj[headerName] = cellText;
    });

    if (hasAnyValue) {
      rawRows.push(rowObj);
    }
  });

  return rawRows;
}

/**
 * Universal safe spreadsheet parser.
 * Supports .xlsx (via ExcelJS) and .csv with:
 * - 5MB max file size validation
 * - 500 row limit validation
 * - Prototype-pollution-free dictionary objects (Object.create(null))
 */
export async function parseSpreadsheetBuffer(
  buffer: Buffer,
  filename: string
): Promise<ParsedSpreadsheetRow[]> {
  if (!buffer || buffer.length === 0) {
    throw new Error('Uploaded file is empty');
  }

  if (buffer.length > MAX_SPREADSHEET_SIZE_BYTES) {
    throw new Error(
      `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds the allowed limit of ${
        MAX_SPREADSHEET_SIZE_BYTES / (1024 * 1024)
      } MB`
    );
  }

  const cleanFilename = (filename || '').toLowerCase().trim();

  if (cleanFilename.endsWith('.csv')) {
    return parseCsvBuffer(buffer);
  }

  if (cleanFilename.endsWith('.xlsx')) {
    return await parseXlsxBuffer(buffer);
  }

  throw new Error('Unsupported file format. Please upload a valid .xlsx or .csv spreadsheet.');
}

export default {
  MAX_SPREADSHEET_SIZE_BYTES,
  MAX_SPREADSHEET_ROWS,
  parseSpreadsheetBuffer,
  parseCsvBuffer,
  parseXlsxBuffer,
};
