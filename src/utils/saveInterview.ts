import type { InterviewOutput, InterviewInput, TranscriptEntry, EnrichedTestResult, TestCase, Language } from "../types";
import type { TranscriptEntry as LiveTranscriptEntry } from "../hooks/useTranscript";
import { buildSystemPrompt } from "./prompt";
import { runTest } from "./codeRunner";

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
 * Run final hidden test cases against the final code
 */
async function runFinalTests(
  code: string,
  language: Language,
  functionName: string,
  finalTestCases: TestCase[]
): Promise<EnrichedTestResult[]> {
  const results: EnrichedTestResult[] = [];
  
  for (const testCase of finalTestCases) {
    try {
      const result = await runTest(code, language, functionName, testCase);
      results.push({
        id: testCase.id,
        input: testCase.input,
        expected: testCase.expected,
        passed: result.passed,
        actual: result.actual,
        error: result.error,
      });
    } catch (error) {
      results.push({
        id: testCase.id,
        input: testCase.input,
        expected: testCase.expected,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  return results;
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
export async function createInterviewOutput(
  interviewInput: InterviewInput,
  liveTranscript: LiveTranscriptEntry[],
  finalCode: string,
  language: Language
): Promise<InterviewOutput> {
  const transcript = convertTranscript(liveTranscript);
  const compiledSystemPrompt = buildSystemPrompt(interviewInput);
  
  // Run final hidden tests on the user's final code
  const finalTestResults = await runFinalTests(
    finalCode,
    language,
    interviewInput.functionName,
    interviewInput.finalTestCases
  );
  
  return {
    id: generateInterviewId(),
    input: interviewInput,
    compiledSystemPrompt,
    transcript,
    finalTestResults,
  };
}

