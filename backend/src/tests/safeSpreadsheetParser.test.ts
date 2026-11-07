import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {
  parseSpreadsheetBuffer,
  parseCsvBuffer,
  MAX_SPREADSHEET_SIZE_BYTES,
  MAX_SPREADSHEET_ROWS,
} from '../utils/safeSpreadsheetParser';

describe('Safe Spreadsheet Parser & Bulk Upload Hardening', () => {
  test('Parses valid CSV buffer correctly with quoted fields', async () => {
    const csvContent = `QuestionText,OptionA,OptionB,CorrectOption\n"What is 2+2?","4","5","A"\n"Select ""code"" keyword","const","while","A"`;
    const buffer = Buffer.from(csvContent, 'utf8');

    const rows = await parseSpreadsheetBuffer(buffer, 'questions.csv');
    assert.equal(rows.length, 2);
    assert.equal(rows[0]['QuestionText'], 'What is 2+2?');
    assert.equal(rows[0]['OptionA'], '4');
    assert.equal(rows[0]['CorrectOption'], 'A');
    assert.equal(rows[1]['QuestionText'], 'Select "code" keyword');
  });

  test('Parses valid Excel (.xlsx) buffer via ExcelJS', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('MCQ Questions');

    worksheet.addRow(['QuestionText', 'OptionA', 'OptionB', 'CorrectOption']);
    worksheet.addRow(['Which protocol is secure?', 'HTTPS', 'HTTP', 'A']);
    worksheet.addRow(['What is the default HTTP port?', '80', '443', 'A']);

    const buffer = await workbook.xlsx.writeBuffer();
    const rows = await parseSpreadsheetBuffer(Buffer.from(buffer), 'questions.xlsx');

    assert.equal(rows.length, 2);
    assert.equal(rows[0]['QuestionText'], 'Which protocol is secure?');
    assert.equal(rows[0]['OptionA'], 'HTTPS');
    assert.equal(rows[1]['QuestionText'], 'What is the default HTTP port?');
    assert.equal(rows[1]['OptionA'], '80');
  });

  test('Rejects oversized spreadsheet files exceeding 5MB limit', async () => {
    // Construct fake oversized buffer
    const oversizedBuffer = Buffer.alloc(MAX_SPREADSHEET_SIZE_BYTES + 1024, 0x20);

    await assert.rejects(
      async () => {
        await parseSpreadsheetBuffer(oversizedBuffer, 'huge_file.xlsx');
      },
      /exceeds the allowed limit of 5 MB/i
    );
  });

  test('Rejects spreadsheets exceeding 500 row limit', async () => {
    const header = 'QuestionText,OptionA,OptionB,CorrectOption\n';
    let body = '';
    for (let i = 0; i < 505; i++) {
      body += `"Question ${i}","A","B","A"\n`;
    }
    const buffer = Buffer.from(header + body, 'utf8');

    await assert.rejects(
      async () => {
        await parseSpreadsheetBuffer(buffer, 'too_many_rows.csv');
      },
      /exceeds the maximum limit of 500 rows/i
    );
  });

  test('Handles malformed or corrupted Excel file safely without process crash', async () => {
    const corruptBuffer = Buffer.from('PK\x03\x04corrupted_binary_garbage_not_a_valid_zip_archive');

    await assert.rejects(
      async () => {
        await parseSpreadsheetBuffer(corruptBuffer, 'corrupted.xlsx');
      },
      /Malformed or unreadable Excel/i
    );
  });

  test('Guarantees prototype pollution resistance (Object.create(null))', async () => {
    const csvContent = `__proto__,constructor,prototype,QuestionText\n"polluted","polluted","polluted","Safe Question"`;
    const buffer = Buffer.from(csvContent, 'utf8');

    const rows = await parseSpreadsheetBuffer(buffer, 'exploit.csv');
    assert.equal(rows.length, 1);

    const row = rows[0];
    // Verify row prototype is null, preventing prototype pollution
    assert.equal(Object.getPrototypeOf(row), null);
    // Verify Object prototype was not contaminated
    assert.equal(({} as any).polluted, undefined);
  });
});
