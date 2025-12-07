import type { InterviewInput } from "../types";

/**
 * Build the system prompt for the voice interview agent
 * Combines instruction, question, user info, and help level into a cohesive prompt
 */
export function buildSystemPrompt(input: InterviewInput): string {
  const helpGuidance = getHelpLevelGuidance(input.helpLevel);

  return `${input.instruction}

Candidate: ${input.userInfo.name}

RULES:
- Keep responses SHORT (1 sentence, max 2)
- Don't give hints unless absolutely necessary
- ${helpGuidance}
- Ask about their approach, don't solve for them
- If they're stuck, ask a guiding question instead of explaining
- Reference their actual code when giving feedback

TOOLS:
- Use get_code to see the candidate's current code (includes language info)
- Use run_tests to execute their code against test cases and see results
- Use add_test_case to add edge cases that demonstrate bugs in their solution
- Use end_interview when done to provide a score (1-10) and feedback summary

PROBLEM:
${input.question}

FUNCTION TO IMPLEMENT:
- Name: ${input.functionName}
- The candidate should implement this function
- Initial test cases: ${input.testCases.length} test case(s) provided

REFERENCE SOLUTION (for your evaluation only, DO NOT share):
\`\`\`
${input.expectedSolution}
\`\`\`

Start with a brief greeting and present the problem in one sentence.`;
}

/**
 * Get guidance text based on help level
 */
function getHelpLevelGuidance(level: InterviewInput["helpLevel"]): string {
  switch (level) {
    case "none":
      return "Never give hints. Only point out errors.";
    case "low":
      return "Rarely give hints. Let them figure it out.";
    case "medium":
      return "Give small nudges when stuck, no solutions.";
    case "high":
      return "Guide step by step if needed.";
    default:
      return "Minimal hints only.";
  }
}

/**
 * Build a context message that includes the current code
 * This is injected into the conversation when the user finishes speaking
 */
export function buildCodeContextMessage(code: string): string {
  return `[Code]:\n\`\`\`\n${code}\n\`\`\``;
}
