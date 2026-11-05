export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  sort: Record<string, 1 | -1>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  pages: number; // Backward-compatibility alias
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  hasMore: boolean; // Backward-compatibility alias
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  [key: string]: any; // Allow backward-compatible legacy payload keys
}

export interface ParsePaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
  allowedSortFields?: string[];
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
}

/**
 * Parses and sanitizes incoming pagination and sorting query parameters.
 * Enforces strict integer boundaries and whitelisted sort fields to protect the database.
 */
export function parsePaginationParams(
  query: any = {},
  options: ParsePaginationOptions = {}
): PaginationParams {
  const {
    defaultPage = 1,
    defaultLimit = 20,
    maxLimit = 100,
    allowedSortFields = ['createdAt', '_id', 'updatedAt'],
    defaultSortBy = 'createdAt',
    defaultSortOrder = 'desc',
  } = options;

  // 1. Parse and clamp page number (minimum: 1)
  const rawPage = query.page !== undefined ? Number(query.page) : defaultPage;
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : defaultPage;

  // 2. Parse and clamp limit (minimum: 1, maximum: maxLimit)
  const rawLimit = query.limit !== undefined ? Number(query.limit) : defaultLimit;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(maxLimit, Math.floor(rawLimit))
      : defaultLimit;

  // 3. Calculate database skip offset
  const skip = (page - 1) * limit;

  // 4. Validate sortBy against whitelisted fields
  let sortBy = String(query.sortBy || defaultSortBy).trim();
  if (!allowedSortFields.includes(sortBy)) {
    sortBy = defaultSortBy;
  }

  // 5. Validate sort direction ('asc' or 'desc')
  const rawOrder = String(query.sortOrder || query.order || defaultSortOrder).toLowerCase().trim();
  const sortOrder: 'asc' | 'desc' = rawOrder === 'asc' ? 'asc' : 'desc';
  const sortDir: 1 | -1 = sortOrder === 'asc' ? 1 : -1;

  // 6. Build deterministic sorting object with _id as tie-breaker
  const sort: Record<string, 1 | -1> = { [sortBy]: sortDir };
  if (sortBy !== '_id') {
    sort._id = sortDir;
  }

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    sort,
  };
}

/**
 * Calculates standardized pagination metadata based on total record count.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const safeTotal = Math.max(0, Number.isFinite(total) ? Math.floor(total) : 0);
  const safeLimit = Math.max(1, Number.isFinite(limit) ? Math.floor(limit) : 20);
  const safePage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1);

  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));
  const hasNextPage = safePage < totalPages;
  const hasPreviousPage = safePage > 1 && safePage <= totalPages + 1;

  return {
    page: safePage,
    limit: safeLimit,
    total: safeTotal,
    totalPages,
    pages: totalPages,
    hasNextPage,
    hasPreviousPage,
    hasMore: hasNextPage,
  };
}

/**
 * Constructs a standardized API response with items and pagination metadata.
 * Additional properties can be passed to preserve backward compatibility with existing frontends.
 */
export function formatPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  extraFields: Record<string, any> = {}
): PaginatedResponse<T> {
  const pagination = buildPaginationMeta(total, page, limit);

  return {
    success: true,
    data: items,
    pagination,
    ...extraFields,
  };
}

/**
 * Encodes arbitrary cursor values into an opaque base64 string.
 */
export function encodeCursor(payload: Record<string, any>): string {
  try {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  } catch {
    return '';
  }
}

/**
 * Decodes an opaque base64 cursor string into typed parameters.
 */
export function decodeCursor<T = Record<string, any>>(cursor: string): T | null {
  if (!cursor || typeof cursor !== 'string') return null;
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
