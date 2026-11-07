import axios, { AxiosInstance } from 'axios';
import { IRCEProvider, NormalizedRCERequest, RCEExecutionResponse, SupportedLanguage } from './types';

// Standard Judge0 language IDs (CE)
export const JUDGE0_LANGUAGE_MAP: Record<SupportedLanguage, number> = {
  c: 50, // C (GCC 9.2.0)
  cpp: 54, // C++ (GCC 9.2.0)
  python: 71, // Python (3.8.1)
  java: 62, // Java (OpenJDK 13.0.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
};

// Sandbox resource constraints
export const JUDGE0_SANDBOX_CONSTRAINTS = {
  DEFAULT_MEMORY_LIMIT_KB: 256000, // 256 MB (verified across C, C++, Python, JS, Java)
  DEFAULT_MAX_FILE_SIZE_KB: 1024,  // 1 MB file size limit
  ENABLE_NETWORK: false,           // Hard sandboxing: block outbound network access
};

function parseJudge0Result(data: any, elapsed: number): RCEExecutionResponse {
  const statusId = data.status?.id;
  const stdout = data.stdout || '';
  const stderr = data.stderr || data.compile_output || '';

  if (statusId === 6) {
    return {
      stdout,
      stderr: data.compile_output || 'Compilation error',
      exitCode: data.exit_code || 1,
      executionTimeMs: elapsed,
      status: 'compilation_error',
    };
  }

  if (statusId === 5) {
    return {
      stdout,
      stderr: 'Time Limit Exceeded',
      exitCode: 124,
      executionTimeMs: elapsed,
      status: 'timeout',
    };
  }

  if (statusId >= 7 && statusId <= 12) {
    return {
      stdout,
      stderr: stderr || data.status?.description || 'Runtime error',
      exitCode: data.exit_code || 1,
      executionTimeMs: elapsed,
      status: 'runtime_error',
    };
  }

  return {
    stdout,
    stderr,
    exitCode: data.exit_code || 0,
    executionTimeMs: elapsed,
    status: 'success',
  };
}

export class Judge0Provider implements IRCEProvider {
  public readonly name = 'Judge0';
  private readonly client: AxiosInstance;
  public readonly baseUrl: string;

  constructor() {
    this.baseUrl = (
      process.env.JUDGE0_API_URL || 'https://ce.judge0.com'
    ).replace(/\/$/, '');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (process.env.JUDGE0_API_KEY) {
      headers['X-RapidAPI-Key'] = process.env.JUDGE0_API_KEY;
      headers['X-RapidAPI-Host'] =
        process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers,
    });
  }

  /**
   * Startup verification of remote Judge0 version against CVE-2024-28185 / CVE-2024-28189.
   * Warns if version is below 1.13.1 without crashing server startup.
   */
  public async verifyRemoteVersion(): Promise<string | null> {
    try {
      const response = await this.client.get('/about', { timeout: 4000 });
      const version = response.data?.version;
      if (!version) {
        console.warn('[Judge0Provider] Version field not present in /about response');
        return null;
      }

      const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        const patch = parseInt(match[3], 10);

        const isVulnerable =
          major < 1 ||
          (major === 1 && minor < 13) ||
          (major === 1 && minor === 13 && patch < 1);

        if (isVulnerable) {
          console.warn(
            `\n=========================================================================\n` +
            `[SECURITY WARNING] Remote Judge0 version is ${version} (< 1.13.1)!\n` +
            `Versions below 1.13.1 contain known sandbox-escape vulnerabilities\n` +
            `(CVE-2024-28185 / CVE-2024-28189 isolate breakout). Upgrade upstream immediately.\n` +
            `=========================================================================\n`
          );
        } else {
          console.log(`[Judge0Provider] Verified remote Judge0 version: ${version} (secure >= 1.13.1)`);
        }
      }

      return String(version);
    } catch (err: any) {
      console.warn(`[Judge0Provider] Could not verify remote Judge0 version (/about check failed: ${err.message}). Running in unverified mode.`);
      return null;
    }
  }

  /**
   * Build hardened submission payload enforcing sandboxing and resource bounds.
   */
  public buildSubmissionPayload(req: NormalizedRCERequest) {
    const languageId = JUDGE0_LANGUAGE_MAP[req.language];
    if (!languageId) {
      throw new Error(`Unsupported language for Judge0: ${req.language}`);
    }

    const cpuTimeLimit = Math.max(1, Math.ceil(req.timeoutMs / 1000));
    const wallTimeLimit = Math.max(cpuTimeLimit + 1, Math.ceil((req.timeoutMs + 2000) / 1000));

    return {
      source_code: req.sourceCode,
      language_id: languageId,
      stdin: req.stdin || '',
      cpu_time_limit: cpuTimeLimit,
      wall_time_limit: wallTimeLimit,
      memory_limit: JUDGE0_SANDBOX_CONSTRAINTS.DEFAULT_MEMORY_LIMIT_KB,
      max_file_size: JUDGE0_SANDBOX_CONSTRAINTS.DEFAULT_MAX_FILE_SIZE_KB,
      enable_network: JUDGE0_SANDBOX_CONSTRAINTS.ENABLE_NETWORK,
    };
  }

  /**
   * Execute single untrusted code submission with hardened resource limits.
   */
  public async execute(req: NormalizedRCERequest): Promise<RCEExecutionResponse> {
    const startTime = Date.now();

    try {
      const payload = this.buildSubmissionPayload(req);

      // Synchronous execution using wait=true
      const response = await this.client.post(
        '/submissions?base64_encoded=false&wait=true',
        payload,
        { timeout: req.timeoutMs + 4000 }
      );

      const elapsed = Date.now() - startTime;
      return parseJudge0Result(response.data, elapsed);
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          stdout: '',
          stderr: 'Judge0 execution timed out',
          exitCode: 124,
          executionTimeMs: elapsed,
          status: 'timeout',
          error: 'Judge0 provider timeout',
        };
      }

      // Handle provider validation errors (e.g. HTTP 422: limits above provider maximum)
      if (error.response?.status === 422) {
        const valData = error.response.data;
        const errorMsg = typeof valData === 'object' ? JSON.stringify(valData) : String(valData);
        console.warn(`[Judge0Provider] Provider validation error (HTTP 422): ${errorMsg}`);
        return {
          stdout: '',
          stderr: `Judge0 parameter validation error: ${errorMsg}`,
          exitCode: -1,
          executionTimeMs: elapsed,
          status: 'error',
          error: errorMsg,
        };
      }

      const msg = error.response?.data?.message || error.message;
      return {
        stdout: '',
        stderr: `Judge0 execution error: ${msg}`,
        exitCode: -1,
        executionTimeMs: elapsed,
        status: 'error',
        error: msg,
      };
    }
  }

  /**
   * Execute batch submissions for a challenge solution across all test cases.
   * Collapses N individual roundtrips into 1 batch POST and 1 batch GET polling call.
   */
  public async executeBatch(reqs: NormalizedRCERequest[]): Promise<RCEExecutionResponse[]> {
    if (reqs.length === 0) return [];
    if (reqs.length === 1) {
      const single = await this.execute(reqs[0]);
      return [single];
    }

    const startTime = Date.now();
    try {
      const submissions = reqs.map((req) => this.buildSubmissionPayload(req));

      const postRes = await this.client.post(
        '/submissions/batch?base64_encoded=false',
        { submissions },
        { timeout: 8000 }
      );

      const tokenRecords = postRes.data;
      if (!Array.isArray(tokenRecords) || tokenRecords.length === 0) {
        throw new Error('Batch submission did not return tokens array');
      }

      const tokens = tokenRecords.map((t: any) => t.token).filter(Boolean).join(',');
      const maxTimeoutMs = Math.max(...reqs.map((r) => r.timeoutMs)) + 6000;
      const pollDeadline = Date.now() + maxTimeoutMs;

      let batchResults: any[] = [];
      let allDone = false;

      // Poll until batch is completed or deadline is reached
      while (!allDone && Date.now() < pollDeadline) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const getRes = await this.client.get(
          `/submissions/batch?tokens=${tokens}&base64_encoded=false`,
          { timeout: 8000 }
        );

        batchResults = getRes.data?.submissions || [];
        // Judge0 status ids 1 = In Queue, 2 = Processing
        const hasPending = batchResults.some((sub: any) => !sub.status || sub.status.id <= 2);
        if (!hasPending && batchResults.length === reqs.length) {
          allDone = true;
          break;
        }
      }

      const elapsed = Date.now() - startTime;
      if (!allDone) {
        console.warn('[Judge0Provider] Batch execution poll timed out, returning partial/timeout results');
      }

      return reqs.map((req, idx) => {
        const subData = batchResults[idx];
        if (!subData || !subData.status || subData.status.id <= 2) {
          return {
            stdout: '',
            stderr: 'Judge0 batch execution timed out',
            exitCode: 124,
            executionTimeMs: elapsed,
            status: 'timeout' as const,
            error: 'Batch polling deadline exceeded',
          };
        }
        return parseJudge0Result(subData, elapsed);
      });
    } catch (err: any) {
      console.warn(`[Judge0Provider] Batch execution failed (${err.message}), falling back to sequential`);
      // Seamless fallback to sequential execution if batch API is unavailable
      const sequentialResults: RCEExecutionResponse[] = [];
      for (const r of reqs) {
        sequentialResults.push(await this.execute(r));
      }
      return sequentialResults;
    }
  }
}
export default Judge0Provider;
