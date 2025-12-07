export type HelpLevel = "none" | "low" | "medium" | "high";
export type Language = "javascript" | "python";

export interface UserInfo {
  name: string;
}

export interface TestCase {
  id: string;
  input: any[];
  expected: any;
}

export interface TestResult {
  id: string;
  passed: boolean;
  actual?: any;
  error?: string;
}

export interface InterviewInput {
  instruction: string;
  question: string;
  userInfo: UserInfo;
  helpLevel: HelpLevel;
  expectedSolution: string;
  functionName: string;
  starterCode: { javascript: string; python: string };
  testCases: TestCase[];
}

export type TranscriptEntryRole = "llm" | "user";

export interface TranscriptEntry {
  role: TranscriptEntryRole;
  message: string;
  code: string;
  timestamp: number;
}

export interface InterviewOutput {
  id: string;
  input: InterviewInput;
  compiledSystemPrompt: string;
  transcript: TranscriptEntry[];
}

export type Score = 1 | 2 | 3 | 4 | 5;

export type SolutionOutcome =
  | "optimal"
  | "working"
  | "partial"
  | "incorrect"
  | "incomplete";

export interface InterviewScores {
  communication: Score;
  thoughtProcess: Score;
  overall: Score;
}

export interface HintMarker {
  transcriptIndex: number;
  description: string;
}

export interface ScoreSnapshot {
  minute: number;
  scores: InterviewScores;
}

export interface InterviewAnalysis {
  finalScores: InterviewScores;
  solutionOutcome: SolutionOutcome;
  solutionExplanation: string;
  hints: HintMarker[];
  scoreProgression: ScoreSnapshot[];
}
