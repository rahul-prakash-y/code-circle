import {
  IRCEProvider,
  RCEExecutionRequest,
  RCEExecutionResponse,
  SupportedLanguage,
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

  constructor() {
    const providerType = (process.env.RCE_PROVIDER || 'piston').toLowerCase();
    const piston = new PistonProvider();
    const judge0 = new Judge0Provider();

    if (providerType === 'judge0') {
      this.primaryProvider = judge0;
      this.fallbackProvider = piston;
    } else {
      this.primaryProvider = piston;
      this.fallbackProvider = judge0;
    }
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
   * Execute untrusted code via sandboxed external RCE provider.
   *
   * SECURITY GUARANTEES:
   * - Never compiles or executes code locally on the Fastify host.
   * - Validates code size and input size before dispatch.
   * - Enforces outbound timeout.
   * - Limits concurrency to preserve host responsiveness and prevent provider exhaustion.
   */
  public async executeCode(request: RCEExecutionRequest): Promise<RCEExecutionResponse> {
    // 1. Language validation & normalization
    const language = this.normalizeAndValidateLanguage(request.language);

    // 2. Validate source-code size
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

    // 3. Validate stdin size
    const stdin = request.stdin || '';
    const stdinBytes = Buffer.byteLength(stdin, 'utf8');
    if (stdinBytes > MAX_STDIN_BYTES) {
      throw ApiError.badRequest(
        `stdin exceeds maximum allowed size of ${MAX_STDIN_BYTES / 1024} KB`
      );
    }

    // 4. Determine request timeout
    const envTimeout = Number(process.env.RCE_TIMEOUT_MS);
    const timeoutMs =
      request.timeoutMs && request.timeoutMs > 0 && request.timeoutMs <= 15000
        ? request.timeoutMs
        : !isNaN(envTimeout) && envTimeout > 0
        ? envTimeout
        : DEFAULT_EXECUTION_TIMEOUT_MS;

    // 5. Concurrency-limited external execution with seamless fallback
    return await globalRceLimiter.run(async () => {
      const result = await this.primaryProvider.execute({
        language,
        sourceCode: request.sourceCode,
        stdin,
        timeoutMs,
      });

      // If primary provider suffered an infrastructure error (e.g. whitelist / unreachable), fallback
      if (result.status === 'error' && this.fallbackProvider) {
        return await this.fallbackProvider.execute({
          language,
          sourceCode: request.sourceCode,
          stdin,
          timeoutMs,
        });
      }

      return result;
    });
  }

  public getProviderName(): string {
    return this.primaryProvider.name;
  }

  public setPrimaryProvider(provider: IRCEProvider): void {
    this.primaryProvider = provider;
  }
}


export const rceService = new RCEService();
export default rceService;
