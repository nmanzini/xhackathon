export type HelpLevel = "none" | "low" | "medium" | "high";

export interface UserInfo {
  name: string;
}

export interface InterviewInput {
  instruction: string;
  question: string;
  userInfo: UserInfo;
  helpLevel: HelpLevel;
  expectedSolution: string;
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
  transcriptIndex: number;
  scores: InterviewScores;
}

export interface InterviewAnalysis {
  finalScores: InterviewScores;
  solutionOutcome: SolutionOutcome;
  solutionExplanation: string;
  hints: HintMarker[];
  scoreProgression: ScoreSnapshot[];
}
