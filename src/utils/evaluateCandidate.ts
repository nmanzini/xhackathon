import type { InterviewOutput } from "../types";
import {
  interviewsStore,
  analysisResultsStore,
  rankedOrderStore,
  loadingCandidatesStore,
} from "../stores";
import { analyzeInterview } from "./analyzeInterview";
import { binarySearchRank } from "./binarySearchRank";

const API_KEY = import.meta.env.VITE_XAI_API_KEY || "";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyzeWithRetry(interview: InterviewOutput, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await analyzeInterview(interview, API_KEY);
    } catch (error) {
      const isRateLimit =
        error instanceof Error && error.message.includes("429");
      if (isRateLimit && attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function evaluateCandidate(
  interview: InterviewOutput
): Promise<void> {
  const loadingIds = loadingCandidatesStore.get();
  loadingCandidatesStore.set([...loadingIds, interview.id]);

  try {
    const rankedOrder = rankedOrderStore.get();

    const scoringPromise = analyzeWithRetry(interview).then((analysis) => {
      const currentResults = analysisResultsStore.get();
      analysisResultsStore.set({
        ...currentResults,
        [interview.id]: analysis,
      });
    });

    const rankingPromise = (async () => {
      if (!rankedOrder) {
        return;
      }

      const allInterviews = interviewsStore.get();
      const insertIndex = await binarySearchRank(
        interview,
        rankedOrder,
        allInterviews
      );

      const currentRankedOrder = rankedOrderStore.get();
      if (currentRankedOrder) {
        const newRankedOrder = [...currentRankedOrder];
        newRankedOrder.splice(insertIndex, 0, interview.id);
        rankedOrderStore.set(newRankedOrder);
      }
    })();

    await Promise.all([scoringPromise, rankingPromise]);
  } catch (error) {
    console.error("[evaluateCandidate] Failed:", error);
  } finally {
    const currentLoading = loadingCandidatesStore.get();
    loadingCandidatesStore.set(
      currentLoading.filter((id) => id !== interview.id)
    );
  }
}
