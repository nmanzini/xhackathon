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
- You CAN see the candidate's code editor - it will be shown below as "Current Code in Editor"
- Reference their actual code when giving feedback

PROBLEM:
${input.question}

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
