import type { InterviewOutput, InterviewInput, TranscriptEntry } from "../types";
import type { TranscriptEntry as LiveTranscriptEntry } from "../hooks/useTranscript";
import { buildSystemPrompt } from "./prompt";

/**
 * Convert live transcript entries to the format expected by InterviewOutput
 */
function convertTranscript(liveTranscript: LiveTranscriptEntry[]): TranscriptEntry[] {
  const converted: TranscriptEntry[] = [];
  
  for (const entry of liveTranscript) {
    // Skip code-sent and tool entries (they're not part of the main conversation)
    if (entry.role === "code" || entry.role === "tool") {
      continue;
    }
    
    // Convert test_run entries
    if (entry.role === "test_run") {
      converted.push({
        role: "test_run",
        message: entry.content,
        code: entry.code || "",
        timestamp: new Date(entry.timestamp).getTime(),
        testResults: entry.testResults,
      });
      continue;
    }
    
    // Convert user/assistant to llm/user format
    const role = entry.role === "assistant" ? "llm" : "user";
    
    converted.push({
      role,
      message: entry.content,
      code: entry.code || "",
      timestamp: new Date(entry.timestamp).getTime(),
    });
  }
  
  return converted;
}

/**
 * Generate a unique ID for the interview
 */
function generateInterviewId(): string {
  return `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save completed interview to storage
 */
export function createInterviewOutput(
  interviewInput: InterviewInput,
  liveTranscript: LiveTranscriptEntry[]
): InterviewOutput {
  const transcript = convertTranscript(liveTranscript);
  const compiledSystemPrompt = buildSystemPrompt(interviewInput);
  
  return {
    id: generateInterviewId(),
    input: interviewInput,
    compiledSystemPrompt,
    transcript,
  };
}

