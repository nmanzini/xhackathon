import type {
  InterviewOutput,
  InterviewAnalysis,
  Score,
  SolutionOutcome,
} from "../types";

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

const analysisSchema = {
  type: "object",
  properties: {
    finalScores: {
      type: "object",
      properties: {
        communication: { type: "integer", enum: [1, 2, 3, 4, 5] },
        thoughtProcess: { type: "integer", enum: [1, 2, 3, 4, 5] },
        overall: { type: "integer", enum: [1, 2, 3, 4, 5] },
      },
      required: ["communication", "thoughtProcess", "overall"],
    },
    solutionOutcome: {
      type: "string",
      enum: ["optimal", "working", "partial", "incorrect", "incomplete"],
    },
    solutionExplanation: {
      type: "string",
    },
    hints: {
      type: "array",
      items: {
        type: "object",
        properties: {
          transcriptIndex: { type: "integer" },
          description: { type: "string" },
        },
        required: ["transcriptIndex", "description"],
      },
    },
    scoreProgression: {
      type: "array",
      items: {
        type: "object",
        properties: {
          minute: { type: "integer" },
          scores: {
            type: "object",
            properties: {
              communication: { type: "integer", enum: [1, 2, 3, 4, 5] },
              thoughtProcess: { type: "integer", enum: [1, 2, 3, 4, 5] },
              overall: { type: "integer", enum: [1, 2, 3, 4, 5] },
            },
            required: ["communication", "thoughtProcess", "overall"],
          },
        },
        required: ["minute", "scores"],
      },
    },
  },
  required: [
    "finalScores",
    "solutionOutcome",
    "solutionExplanation",
    "hints",
    "scoreProgression",
  ],
};

function buildAnalysisPrompt(interview: InterviewOutput): string {
  const firstTimestamp = interview.transcript[0]?.timestamp || 0;
  const lastTimestamp =
    interview.transcript[interview.transcript.length - 1]?.timestamp || 0;
  const durationMinutes = Math.ceil((lastTimestamp - firstTimestamp) / 60000);

  const transcriptText = interview.transcript
    .map((entry, index) => {
      const role = entry.role === "llm" ? "Interviewer" : "Candidate";
      const relativeMs = entry.timestamp - firstTimestamp;
      const minutes = Math.floor(relativeMs / 60000);
      const seconds = Math.floor((relativeMs % 60000) / 1000);
      const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
      return `[${index}] [${timeStr}] ${role}: ${entry.message}\nCode at this point:\n\`\`\`\n${entry.code}\n\`\`\``;
    })
    .join("\n\n");

  return `Analyze this technical interview and provide scores.

INTERVIEW QUESTION:
${interview.input.question}

EXPECTED SOLUTION:
\`\`\`
${interview.input.expectedSolution}
\`\`\`

INTERVIEW TRANSCRIPT:
${transcriptText}

INTERVIEW DURATION: ${durationMinutes} minutes (from 0:00 to ${durationMinutes}:00)

SCORING CRITERIA (1-5 scale):
- Communication (1-5): How clearly did the candidate explain their thinking? Did they ask clarifying questions? Did they communicate their approach before coding?
- Thought Process (1-5): Did the candidate demonstrate logical problem-solving? Did they consider edge cases? Did they break down the problem effectively?
- Overall (1-5): Overall interview performance considering all factors.

SOLUTION OUTCOME (choose one):
- "optimal": Candidate found the best/optimal solution
- "working": Candidate's solution works correctly but is not optimal
- "partial": Solution is partially correct (handles some cases)
- "incorrect": Solution has wrong approach or logic
- "incomplete": Candidate did not finish the solution

TASKS:
1. Identify SOLUTION HINTS only - be very strict about this. A hint is ONLY when the interviewer directly reveals part of the solution, such as:
   - Suggesting a specific algorithm or data structure to use
   - Pointing out a bug in the code and how to fix it
   - Explaining a key insight needed to solve the problem
   - Giving away part of the answer

   The following are NOT hints and should NOT be included:
   - Asking the candidate to explain their approach ("Can you walk me through that?")
   - Encouraging the candidate to continue ("Great, now implement that")
   - Asking clarifying questions ("What's your time complexity?")
   - General prompts ("Let's think about this")
   - Praising the candidate ("Good job!", "Excellent approach!")

   If no actual solution hints were given, return an empty array.

2. Track the candidate's performance throughout the interview with score snapshots at each minute mark (0, 1, 2, ... ${durationMinutes}). Provide a snapshot for each minute of the interview. Scores should reflect how the candidate is doing AT THAT SPECIFIC MOMENT based on what has happened up to that minute - scores can go up OR down as performance changes. For example, a candidate might start with strong thought process but lose it later, or have poor communication early but improve.

3. Provide final scores for communication, thought process, and overall.

4. Determine the solution outcome based on the candidate's final code compared to the expected solution. Provide a brief explanation (2-3 sentences) of why this outcome was chosen, comparing the candidate's solution to the expected solution.

Be fair but rigorous in your assessment.`;
}

export async function analyzeInterview(
  interview: InterviewOutput,
  apiKey: string
): Promise<InterviewAnalysis> {
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
            "You are an expert technical interview evaluator. Analyze interviews and provide detailed, fair assessments with structured scoring.",
        },
        {
          role: "user",
          content: buildAnalysisPrompt(interview),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "interview_analysis",
          strict: true,
          schema: analysisSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in Grok API response");
  }

  const analysis = JSON.parse(content);

  return {
    finalScores: {
      communication: analysis.finalScores.communication as Score,
      thoughtProcess: analysis.finalScores.thoughtProcess as Score,
      overall: analysis.finalScores.overall as Score,
    },
    solutionOutcome: analysis.solutionOutcome as SolutionOutcome,
    solutionExplanation: analysis.solutionExplanation,
    hints: analysis.hints,
    scoreProgression: analysis.scoreProgression.map(
      (snapshot: {
        minute: number;
        scores: {
          communication: number;
          thoughtProcess: number;
          overall: number;
        };
      }) => ({
        minute: snapshot.minute,
        scores: {
          communication: snapshot.scores.communication as Score,
          thoughtProcess: snapshot.scores.thoughtProcess as Score,
          overall: snapshot.scores.overall as Score,
        },
      })
    ),
  };
}
