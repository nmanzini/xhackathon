import type { InterviewOutput } from "../types";

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const comparisonSchema = {
  type: "object",
  properties: {
    winner: { type: "string", enum: ["A", "B", "tie"] },
    reasoning: { type: "string" },
  },
  required: ["winner", "reasoning"],
};

function buildComparisonPrompt(
  interviewA: InterviewOutput,
  interviewB: InterviewOutput
): string {
  const formatInterview = (interview: InterviewOutput, label: string) => {
    const transcriptText = interview.transcript
      .map((entry, index) => {
        const role = entry.role === "llm" ? "Interviewer" : "Candidate";
        return `[${index}] ${role}: ${entry.message}\nCode at this point:\n\`\`\`\n${entry.code}\n\`\`\``;
      })
      .join("\n\n");

    return `## CANDIDATE ${label}

### Interview Question:
${interview.input.question}

### Expected Solution:
\`\`\`
${interview.input.expectedSolution}
\`\`\`

### Interview Transcript:
${transcriptText}`;
  };

  return `Compare these two technical interview performances and determine which candidate performed better.

${formatInterview(interviewA, "A")}

---

${formatInterview(interviewB, "B")}

---

EVALUATION CRITERIA (weighted by importance):

1. COMMUNICATION (30%): 
   - Did the candidate clearly explain their thinking throughout?
   - Did they articulate their approach before coding?
   - Did they ask clarifying questions when needed?
   - Did they verbalize their thought process while solving?

2. THOUGHT PROCESS (35%):
   - Did they break down the problem systematically?
   - Did they consider edge cases and constraints?
   - Did they demonstrate logical reasoning and problem-solving skills?
   - Did they recognize and recover from mistakes?

3. SOLUTION QUALITY (35%):
   - Is the final solution correct?
   - Is it efficient (good time/space complexity)?
   - Is the code clean and well-structured?
   - Does it handle edge cases properly?

IMPORTANT: An incomplete interview (very short, minimal interaction, no real problem-solving attempt, or no working solution) should ALWAYS rank below a completed interview where the candidate made a genuine attempt, even if that attempt was imperfect. A candidate who shows up and tries is better than one who doesn't engage.

Compare both candidates across all three criteria, weighting them as indicated. Determine which candidate performed better overall. If they are essentially equal, you may declare a tie, but prefer to pick a winner when there is any meaningful difference.`;
}

export interface ComparisonResult {
  winner: "A" | "B" | "tie";
  reasoning: string;
}

export async function compareInterviews(
  interviewA: InterviewOutput,
  interviewB: InterviewOutput,
  apiKey: string
): Promise<ComparisonResult> {
  console.log(
    `[Compare] Starting: ${interviewA.input.userInfo.name} vs ${interviewB.input.userInfo.name}`
  );
  console.log(`[Compare] API Key length: ${apiKey.length}`);

  const response = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-3-fast",
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical interview evaluator. Compare two interview performances and determine which candidate performed better.",
        },
        {
          role: "user",
          content: buildComparisonPrompt(interviewA, interviewB),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "interview_comparison",
          strict: true,
          schema: comparisonSchema,
        },
      },
    }),
  });

  console.log(`[Compare] Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Compare] API Error: ${response.status} - ${errorText}`);
    throw new Error(`Grok API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`[Compare] Got response data`);
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in Grok API response");
  }

  const result = JSON.parse(content) as ComparisonResult;
  console.log(
    `[Compare] Result: ${interviewA.input.userInfo.name} vs ${interviewB.input.userInfo.name} -> Winner: ${result.winner}`
  );
  return result;
}

export async function compareWithRetry(
  interviewA: InterviewOutput,
  interviewB: InterviewOutput,
  apiKey: string,
  maxRetries = 5
): Promise<ComparisonResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await compareInterviews(interviewA, interviewB, apiKey);
    } catch (error) {
      const isRateLimit =
        error instanceof Error && error.message.includes("429");
      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[Compare] Rate limited, retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function compareInterviewsToNumber(
  interviewA: InterviewOutput,
  interviewB: InterviewOutput,
  apiKey: string
): Promise<number> {
  const result = await compareWithRetry(interviewA, interviewB, apiKey);
  if (result.winner === "A") {
    return -1;
  }
  if (result.winner === "B") {
    return 1;
  }
  return 0;
}
