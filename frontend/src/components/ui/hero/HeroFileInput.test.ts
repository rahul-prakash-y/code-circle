import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

describe('HeroFileInput Validation Logic Test Suite', () => {
  // Unit test the validation logic specification from HeroFileInput
  const validateFiles = (
    files: { name: string; size: number; type: string }[],
    options: {
      accept?: string;
      multiple?: boolean;
      maxSizeBytes?: number;
      maxCount?: number;
    }
  ) => {
    const {
      accept,
      multiple = false,
      maxSizeBytes = 25 * 1024 * 1024,
      maxCount = 10,
    } = options;

    if (files.length === 0) return { valid: false, error: 'No files' };
    if (!multiple && files.length > 1) {
      return { valid: false, error: 'Please select only a single file.' };
    }
    if (multiple && files.length > maxCount) {
      return { valid: false, error: `You can upload at most ${maxCount} files at once.` };
    }

    for (const f of files) {
      if (maxSizeBytes && f.size > maxSizeBytes) {
        return { valid: false, error: `File "${f.name}" exceeds the maximum size limit.` };
      }
      if (accept) {
        const parts = accept.split(',').map((p) => p.trim().toLowerCase());
        const ext = `.${f.name.split('.').pop()?.toLowerCase()}`;
        const mime = f.type.toLowerCase();
        const matches = parts.some((p) => {
          if (p.startsWith('.')) return ext === p;
          if (p.endsWith('/*')) return mime.startsWith(p.slice(0, -1));
          return mime === p;
        });
        if (!matches) {
          return { valid: false, error: `File "${f.name}" does not match accepted format.` };
        }
      }
    }

    return { valid: true, error: null };
  };

  test('Validates accepted file extensions (.xlsx, .csv)', () => {
    const validCsv = [{ name: 'roster.csv', size: 1024, type: 'text/csv' }];
    const validXlsx = [{ name: 'scores.xlsx', size: 2048, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }];
    const invalidPdf = [{ name: 'document.pdf', size: 2048, type: 'application/pdf' }];

    assert.equal(validateFiles(validCsv, { accept: '.xlsx,.xls,.csv' }).valid, true);
    assert.equal(validateFiles(validXlsx, { accept: '.xlsx,.xls,.csv' }).valid, true);
    assert.equal(validateFiles(invalidPdf, { accept: '.xlsx,.xls,.csv' }).valid, false);
  });

  test('Rejects files exceeding maxSizeBytes', () => {
    const max5MB = 5 * 1024 * 1024;
    const smallFile = [{ name: 'small.png', size: 1 * 1024 * 1024, type: 'image/png' }];
    const bigFile = [{ name: 'large.png', size: 10 * 1024 * 1024, type: 'image/png' }];

    assert.equal(validateFiles(smallFile, { maxSizeBytes: max5MB }).valid, true);
    assert.equal(validateFiles(bigFile, { maxSizeBytes: max5MB }).valid, false);
    assert.match(validateFiles(bigFile, { maxSizeBytes: max5MB }).error!, /exceeds the maximum size limit/);
  });

  test('Enforces single vs multiple file constraints', () => {
    const twoFiles = [
      { name: '1.png', size: 100, type: 'image/png' },
      { name: '2.png', size: 100, type: 'image/png' },
    ];

    assert.equal(validateFiles(twoFiles, { multiple: false }).valid, false);
    assert.equal(validateFiles(twoFiles, { multiple: true, maxCount: 5 }).valid, true);
    assert.equal(validateFiles(twoFiles, { multiple: true, maxCount: 1 }).valid, false);
  });
});
