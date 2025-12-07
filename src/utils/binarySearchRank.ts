import type { InterviewOutput } from "../types";
import { compareInterviewsToNumber } from "./compareInterviews";

const API_KEY = import.meta.env.VITE_XAI_API_KEY || "";

export async function binarySearchRank(
  candidate: InterviewOutput,
  sortedIds: string[],
  allInterviews: InterviewOutput[]
): Promise<number> {
  if (sortedIds.length === 0) {
    return 0;
  }

  const interviewMap = new Map(allInterviews.map((i) => [i.id, i]));

  let left = 0;
  let right = sortedIds.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const midInterview = interviewMap.get(sortedIds[mid]);

    if (!midInterview) {
      left = mid + 1;
      continue;
    }

    const comparison = await compareInterviewsToNumber(
      candidate,
      midInterview,
      API_KEY
    );

    if (comparison <= 0) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }

  return left;
}
