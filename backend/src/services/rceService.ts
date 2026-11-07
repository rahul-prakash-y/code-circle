import {
  IRCEProvider,
  RCEExecutionRequest,
  RCEExecutionResponse,
  SupportedLanguage,
  NormalizedRCERequest,
} from './rce/types';
import { PistonProvider } from './rce/pistonProvider';
import { Judge0Provider } from './rce/judge0Provider';
import { globalRceLimiter } from './rce/concurrencyLimiter';
import { SUPPORTED_LANGUAGES } from '../models/codingChallengeModel';
import { ApiError } from '../utils/ApiError';

export const MAX_SOURCE_CODE_BYTES = 64 * 1024; // 64 KB
export const MAX_STDIN_BYTES = 32 * 1024; // 32 KB
export const DEFAULT_EXECUTION_TIMEOUT_MS = 10000; // 10 seconds

export class RCEService {
  private primaryProvider: IRCEProvider;
  private fallbackProvider: IRCEProvider;
  private judge0Instance: Judge0Provider;

  constructor() {
    const providerType = (process.env.RCE_PROVIDER || 'judge0').toLowerCase();
    const piston = new PistonProvider();
    const judge0 = new Judge0Provider();
    this.judge0Instance = judge0;

    if (providerType === 'piston') {
      this.primaryProvider = piston;
      this.fallbackProvider = judge0;
    } else {
      this.primaryProvider = judge0;
      this.fallbackProvider = piston;
    }

    // Verify remote version at startup asynchronously without blocking or crashing
    judge0.verifyRemoteVersion().catch((err) => {
      console.warn('[RCEService] Remote Judge0 version check failed:', err.message);
    });
  }

  /**
   * Normalize and validate language identifier against the strict allowlist.
   */
  public normalizeAndValidateLanguage(language: unknown): SupportedLanguage {
    if (typeof language !== 'string') {
      throw ApiError.badRequest('Language must be a string identifier');
    }

    const normalized = language.trim().toLowerCase() as SupportedLanguage;

    if (!SUPPORTED_LANGUAGES.includes(normalized)) {
      throw ApiError.badRequest(
        `Language "${language}" is not supported. Allowed languages: ${SUPPORTED_LANGUAGES.join(
          ', '
        )}`
      );
    }

    return normalized;
  }

  /**
   * Validate and normalize a single execution request.
   */
  public normalizeRequest(request: RCEExecutionRequest): NormalizedRCERequest {
    const language = this.normalizeAndValidateLanguage(request.language);

    if (typeof request.sourceCode !== 'string') {
      throw ApiError.badRequest('sourceCode is required and must be a string');
    }

    const codeBytes = Buffer.byteLength(request.sourceCode, 'utf8');
    if (codeBytes === 0) {
      throw ApiError.badRequest('sourceCode cannot be empty');
    }
    if (codeBytes > MAX_SOURCE_CODE_BYTES) {
      throw ApiError.badRequest(
        `Source code exceeds maximum allowed size of ${MAX_SOURCE_CODE_BYTES / 1024} KB`
      );
    }

    const stdin = request.stdin || '';
    const stdinBytes = Buffer.byteLength(stdin, 'utf8');
    if (stdinBytes > MAX_STDIN_BYTES) {
      throw ApiError.badRequest(
        `stdin exceeds maximum allowed size of ${MAX_STDIN_BYTES / 1024} KB`
      );
    }

    const envTimeout = Number(process.env.RCE_TIMEOUT_MS);
    const timeoutMs =
      request.timeoutMs && request.timeoutMs > 0 && request.timeoutMs <= 15000
        ? request.timeoutMs
        : !isNaN(envTimeout) && envTimeout > 0
        ? envTimeout
        : DEFAULT_EXECUTION_TIMEOUT_MS;

    return {
      language,
      sourceCode: request.sourceCode,
      stdin,
      timeoutMs,
    };
  }

  /**
   * Execute untrusted code via sandboxed external RCE provider.
   */
  public async executeCode(request: RCEExecutionRequest): Promise<RCEExecutionResponse> {
    const normalized = this.normalizeRequest(request);

    return await globalRceLimiter.run(async () => {
      const result = await this.primaryProvider.execute(normalized);

      // If primary provider suffered an infrastructure error (e.g. whitelist / unreachable), fallback
      if (result.status === 'error' && this.fallbackProvider) {
        return await this.fallbackProvider.execute(normalized);
      }

      return result;
    });
  }

  /**
   * Execute batch of test cases for a submission in a single provider roundtrip.
   */
  public async executeBatchCode(requests: RCEExecutionRequest[]): Promise<RCEExecutionResponse[]> {
    if (requests.length === 0) return [];

    const normalizedRequests = requests.map((req) => this.normalizeRequest(req));

    return await globalRceLimiter.run(async () => {
      // If primary provider supports batching (e.g. Judge0), use it
      if (this.primaryProvider.executeBatch) {
        return await this.primaryProvider.executeBatch(normalizedRequests);
      }

      // Fallback: sequential execution
      const results: RCEExecutionResponse[] = [];
      for (const req of normalizedRequests) {
        results.push(await this.primaryProvider.execute(req));
      }
      return results;
    });
  }

  public getProviderName(): string {
    return this.primaryProvider.name;
  }

  public setPrimaryProvider(provider: IRCEProvider): void {
    this.primaryProvider = provider;
  }

  public getJudge0Instance(): Judge0Provider {
    return this.judge0Instance;
  }
}

export const rceService = new RCEService();
export default rceService;
