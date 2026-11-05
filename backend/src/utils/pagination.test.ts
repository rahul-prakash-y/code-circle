import assert from 'node:assert/strict';
import {
  parsePaginationParams,
  buildPaginationMeta,
  formatPaginatedResponse,
  encodeCursor,
  decodeCursor,
} from './pagination';

console.log('--- Starting Pagination Unit Tests ---');

// Test 1: Default values when empty query is provided
{
  const params = parsePaginationParams({});
  assert.equal(params.page, 1, 'Default page should be 1');
  assert.equal(params.limit, 20, 'Default limit should be 20');
  assert.equal(params.skip, 0, 'Default skip should be 0');
  assert.equal(params.sortBy, 'createdAt', 'Default sortBy should be createdAt');
  assert.equal(params.sortOrder, 'desc', 'Default sortOrder should be desc');
  assert.deepEqual(params.sort, { createdAt: -1, _id: -1 }, 'Deterministic sort should include _id tie-breaker');
  console.log('✓ Test 1: Default values passed');
}

// Test 2: Custom valid parameters
{
  const params = parsePaginationParams(
    { page: '3', limit: '25', sortBy: 'name', sortOrder: 'asc' },
    { allowedSortFields: ['createdAt', 'name', 'points'] }
  );
  assert.equal(params.page, 3);
  assert.equal(params.limit, 25);
  assert.equal(params.skip, 50, 'Skip for page 3 with limit 25 should be (3-1)*25 = 50');
  assert.equal(params.sortBy, 'name');
  assert.equal(params.sortOrder, 'asc');
  assert.deepEqual(params.sort, { name: 1, _id: 1 });
  console.log('✓ Test 2: Custom valid parameters passed');
}

// Test 3: Clamping maximum page size
{
  const params = parsePaginationParams({ page: '1', limit: '500' }, { maxLimit: 100 });
  assert.equal(params.limit, 100, 'Limit should be clamped to maxLimit 100');
  console.log('✓ Test 3: Clamping maximum page size passed');
}

// Test 4: Handling negative, zero, or malformed page and limit
{
  const params = parsePaginationParams({ page: '-5', limit: '0' });
  assert.equal(params.page, 1, 'Negative page should normalize to default page (1)');
  assert.equal(params.limit, 20, 'Zero limit should normalize to default limit (20)');

  const malformed = parsePaginationParams({ page: 'abc', limit: 'xyz' });
  assert.equal(malformed.page, 1, 'NaN page should fallback to default (1)');
  assert.equal(malformed.limit, 20, 'NaN limit should fallback to default (20)');
  console.log('✓ Test 4: Malformed and negative parameter handling passed');
}

// Test 5: Sort field whitelisting prevents injection
{
  const params = parsePaginationParams(
    { sortBy: '$where', sortOrder: 'desc' },
    { allowedSortFields: ['createdAt', 'title'], defaultSortBy: 'createdAt' }
  );
  assert.equal(params.sortBy, 'createdAt', 'Disallowed sort field should fallback to default');
  console.log('✓ Test 5: Sort field whitelisting passed');
}

// Test 6: Metadata calculation for empty collection
{
  const meta = buildPaginationMeta(0, 1, 20);
  assert.equal(meta.total, 0);
  assert.equal(meta.page, 1);
  assert.equal(meta.limit, 20);
  assert.equal(meta.totalPages, 1);
  assert.equal(meta.pages, 1);
  assert.equal(meta.hasNextPage, false);
  assert.equal(meta.hasPreviousPage, false);
  assert.equal(meta.hasMore, false);
  console.log('✓ Test 6: Empty collection metadata passed');
}

// Test 7: Metadata calculation for multi-page collection
{
  const meta = buildPaginationMeta(95, 2, 20);
  assert.equal(meta.total, 95);
  assert.equal(meta.page, 2);
  assert.equal(meta.limit, 20);
  assert.equal(meta.totalPages, 5); // ceil(95/20) = 5
  assert.equal(meta.pages, 5);
  assert.equal(meta.hasNextPage, true);
  assert.equal(meta.hasPreviousPage, true);
  assert.equal(meta.hasMore, true);
  console.log('✓ Test 7: Multi-page collection metadata passed');
}

// Test 8: Metadata on the last page
{
  const meta = buildPaginationMeta(95, 5, 20);
  assert.equal(meta.hasNextPage, false);
  assert.equal(meta.hasPreviousPage, true);
  assert.equal(meta.hasMore, false);
  console.log('✓ Test 8: Last page metadata passed');
}

// Test 9: Out-of-range requested page
{
  const meta = buildPaginationMeta(50, 10, 20);
  assert.equal(meta.page, 10);
  assert.equal(meta.totalPages, 3);
  assert.equal(meta.hasNextPage, false);
  console.log('✓ Test 9: Out-of-range page metadata passed');
}

// Test 10: Standardized response formatter with backward compatibility
{
  const mockItems = [{ id: '1' }, { id: '2' }];
  const response = formatPaginatedResponse(mockItems, 50, 1, 2, { users: mockItems });
  assert.equal(response.success, true);
  assert.deepEqual(response.data, mockItems);
  assert.deepEqual(response.users, mockItems, 'Legacy payload field preserved');
  assert.equal(response.pagination.total, 50);
  assert.equal(response.pagination.totalPages, 25);
  console.log('✓ Test 10: Response formatting with legacy alias passed');
}

// Test 11: Cursor encoding and decoding
{
  const timestamp = '2026-01-01T00:00:00.000Z';
  const id = '507f1f77bcf86cd799439011';
  const cursor = encodeCursor({ id, timestamp });
  assert.ok(typeof cursor === 'string' && cursor.length > 0);

  const decoded = decodeCursor<{ id: string; timestamp: string }>(cursor);
  assert.ok(decoded !== null);
  assert.equal(decoded?.id, id);
  assert.equal(decoded?.timestamp, timestamp);

  // Test invalid cursor string
  assert.equal(decodeCursor('invalid-base64-not-json'), null);
  console.log('✓ Test 11: Cursor encoding and decoding passed');
}

console.log('--- ALL PAGINATION UNIT TESTS PASSED SUCCESSFULLY ---');
