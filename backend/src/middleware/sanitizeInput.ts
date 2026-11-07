import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Recursively inspects and cleanses request objects to strip MongoDB operator injection vectors.
 * Recursively removes any object keys starting with '$' (e.g. $ne, $gt, $where, $regex)
 * and ensures nested objects are not passed as unexpected query operators.
 */
export function sanitizeNoSqlPayload<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeNoSqlPayload(item)) as unknown as T;
  }

  if (typeof input === 'object' && !(input instanceof Date) && !(input instanceof RegExp)) {
    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(input)) {
      // Disallow any key starting with '$' to prevent MongoDB operator injection ($ne, $gt, $where, etc.)
      if (key.startsWith('$')) {
        continue;
      }

      cleaned[key] = sanitizeNoSqlPayload(value);
    }

    return cleaned as T;
  }

  return input;
}

/**
 * Fastify preValidation hook to sanitize request.query, request.params, and request.body
 * against NoSQL operator injection before reaching any route handler.
 */
export const sanitizeInputsHook = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  if (request.query && typeof request.query === 'object') {
    request.query = sanitizeNoSqlPayload(request.query);
  }

  if (request.params && typeof request.params === 'object') {
    request.params = sanitizeNoSqlPayload(request.params);
  }

  if (request.body && typeof request.body === 'object') {
    request.body = sanitizeNoSqlPayload(request.body);
  }
};

export default sanitizeInputsHook;
