import { SupportedLanguage } from '../../models/codingChallengeModel';

export { SupportedLanguage };

export interface RCEExecutionRequest {
  language: string;
  sourceCode: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface NormalizedRCERequest {
  language: SupportedLanguage;
  sourceCode: string;
  stdin: string;
  timeoutMs: number;
}

export type RCEExecutionStatus =
  | 'success'
  | 'compilation_error'
  | 'runtime_error'
  | 'timeout'
  | 'error';

export interface RCEExecutionResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  status: RCEExecutionStatus;
  error?: string;
}

export interface IRCEProvider {
  readonly name: string;
  execute(req: NormalizedRCERequest): Promise<RCEExecutionResponse>;
}
