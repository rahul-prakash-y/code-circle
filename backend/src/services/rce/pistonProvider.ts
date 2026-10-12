import axios, { AxiosInstance } from 'axios';
import { IRCEProvider, NormalizedRCERequest, RCEExecutionResponse, SupportedLanguage } from './types';

interface PistonLanguageConfig {
  language: string;
  version: string;
  fileName: string;
}

const PISTON_LANGUAGE_MAP: Record<SupportedLanguage, PistonLanguageConfig> = {
  c: {
    language: 'c',
    version: '10.2.0',
    fileName: 'main.c',
  },
  cpp: {
    language: 'c++',
    version: '10.2.0',
    fileName: 'main.cpp',
  },
  python: {
    language: 'python',
    version: '3.10.0',
    fileName: 'solution.py',
  },
  java: {
    language: 'java',
    version: '15.0.2',
    fileName: 'Main.java',
  },
  javascript: {
    language: 'javascript',
    version: '18.15.0',
    fileName: 'solution.js',
  },
};

export class PistonProvider implements IRCEProvider {
  public readonly name = 'Piston';
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = (
      process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston'
    ).replace(/\/$/, '');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (process.env.PISTON_API_KEY) {
      headers['Authorization'] = process.env.PISTON_API_KEY;
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers,
    });
  }

  public async execute(req: NormalizedRCERequest): Promise<RCEExecutionResponse> {
    const langConfig = PISTON_LANGUAGE_MAP[req.language];
    if (!langConfig) {
      throw new Error(`Unsupported language for Piston: ${req.language}`);
    }

    const startTime = Date.now();

    try {
      const payload = {
        language: langConfig.language,
        version: langConfig.version,
        files: [
          {
            name: langConfig.fileName,
            content: req.sourceCode,
          },
        ],
        stdin: req.stdin || '',
        compile_timeout: Math.min(req.timeoutMs, 10000),
        run_timeout: Math.min(req.timeoutMs, 10000),
      };

      const response = await this.client.post('/execute', payload, {
        timeout: req.timeoutMs + 2000, // Margin above internal execution timeout
      });

      const elapsed = Date.now() - startTime;
      const data = response.data;

      // Handle compilation errors (C, C++, Java, etc.)
      if (data.compile && data.compile.code !== 0) {
        return {
          stdout: data.compile.stdout || '',
          stderr: data.compile.stderr || data.compile.output || 'Compilation failed',
          exitCode: data.compile.code || 1,
          executionTimeMs: elapsed,
          status: 'compilation_error',
        };
      }

      const run = data.run || {};
      const exitCode = typeof run.code === 'number' ? run.code : 0;
      const stdout = run.stdout || '';
      const stderr = run.stderr || '';

      // Check for SIGKILL or timeout indicators
      if (run.signal === 'SIGKILL' || run.signal === 'SIGTERM') {
        return {
          stdout,
          stderr: stderr || 'Execution timed out (Time Limit Exceeded)',
          exitCode: 124,
          executionTimeMs: elapsed,
          status: 'timeout',
        };
      }

      if (exitCode !== 0) {
        return {
          stdout,
          stderr: stderr || run.output || `Process exited with code ${exitCode}`,
          exitCode,
          executionTimeMs: elapsed,
          status: 'runtime_error',
        };
      }

      return {
        stdout,
        stderr,
        exitCode: 0,
        executionTimeMs: elapsed,
        status: 'success',
      };
    } catch (error: any) {
      const elapsed = Date.now() - startTime;

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          stdout: '',
          stderr: 'Execution timed out waiting for RCE provider',
          exitCode: 124,
          executionTimeMs: elapsed,
          status: 'timeout',
          error: 'RCE provider timeout',
        };
      }

      const providerMessage =
        error.response?.data?.message || error.response?.data?.error || error.message;

      return {
        stdout: '',
        stderr: `RCE execution error: ${providerMessage}`,
        exitCode: -1,
        executionTimeMs: elapsed,
        status: 'error',
        error: providerMessage,
      };
    }
  }
}
