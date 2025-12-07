export type HelpLevel = "none" | "low" | "medium" | "high";

export interface UserInfo {
  name: string;
}

export interface InterviewInput {
  instruction: string;
  question: string;
  userInfo: UserInfo;
  helpLevel: HelpLevel;
}

export type TranscriptEntryRole = "llm" | "user";

export interface TranscriptEntry {
  role: TranscriptEntryRole;
  message: string;
  code: string;
  timestamp: number;
}

export interface InterviewOutput {
  input: InterviewInput;
  compiledSystemPrompt: string;
  transcript: TranscriptEntry[];
}
