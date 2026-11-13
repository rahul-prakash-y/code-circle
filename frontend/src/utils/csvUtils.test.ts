import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { escapeCsvField, parseCsvLine, parseCsv } from './csvUtils.ts';

describe('csvUtils Verification Test Suite', () => {
  test('escapeCsvField properly wraps fields with commas and escapes quotes', () => {
    assert.equal(escapeCsvField('hello'), 'hello');
    assert.equal(escapeCsvField('hello, world'), '"hello, world"');
    assert.equal(escapeCsvField('hello "quote" world'), '"hello ""quote"" world"');
    assert.equal(escapeCsvField(42), '42');
    assert.equal(escapeCsvField(null), '');
  });

  test('parseCsvLine parses standard and quoted CSV lines correctly', () => {
    const line1 = '7376221EC105,Chandran R,chandran.ec22@bitsathy.ac.in,ECE';
    assert.deepEqual(parseCsvLine(line1), ['7376221EC105', 'Chandran R', 'chandran.ec22@bitsathy.ac.in', 'ECE']);

    const line2 = '7376221EC105,"Chandran, R",chandran.ec22@bitsathy.ac.in,"ECE, Robotics"';
    assert.deepEqual(parseCsvLine(line2), ['7376221EC105', 'Chandran, R', 'chandran.ec22@bitsathy.ac.in', 'ECE, Robotics']);
  });

  test('parseCsv transforms CSV content into structured JSON records', () => {
    const csvContent = `Roll Number,Student Name,Score
7376221EC105,Chandran R,95
7376221EC106,Alice M,88`;

    const records = parseCsv(csvContent);
    assert.equal(records.length, 2);
    assert.equal(records[0]['Roll Number'], '7376221EC105');
    assert.equal(records[0]['Student Name'], 'Chandran R');
    assert.equal(records[0]['Score'], '95');
    assert.equal(records[1]['Student Name'], 'Alice M');
  });
});
