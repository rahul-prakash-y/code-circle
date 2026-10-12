import axios, { AxiosInstance } from 'axios';
import { IRCEProvider, NormalizedRCERequest, RCEExecutionResponse, SupportedLanguage } from './types';

// Standard Judge0 language IDs (CE)
const JUDGE0_LANGUAGE_MAP: Record<SupportedLanguage, number> = {
  c: 50, // C (GCC 9.2.0)
  cpp: 54, // C++ (GCC 9.2.0)
  python: 71, // Python (3.8.1)
  java: 62, // Java (OpenJDK 13.0.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
};

export class Judge0Provider implements IRCEProvider {
  public readonly name = 'Judge0';
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

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

  public async execute(req: NormalizedRCERequest): Promise<RCEExecutionResponse> {
    const languageId = JUDGE0_LANGUAGE_MAP[req.language];
    if (!languageId) {
      throw new Error(`Unsupported language for Judge0: ${req.language}`);
    }

    const startTime = Date.now();

    try {
      const payload = {
        source_code: req.sourceCode,
        language_id: languageId,
        stdin: req.stdin || '',
        cpu_time_limit: Math.ceil(req.timeoutMs / 1000),
      };

      // Use wait=true for synchronous response
      const response = await this.client.post(
        '/submissions?base64_encoded=false&wait=true',
        payload,
        { timeout: req.timeoutMs + 3000 }
      );

      const elapsed = Date.now() - startTime;
      const data = response.data;

      // Judge0 status ids: 3: Accepted, 4: Wrong Answer, 5: TLE, 6: Compilation Error, 7-12: Runtime Errors
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
}
