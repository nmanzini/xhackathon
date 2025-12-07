import type { InterviewOutput, InterviewAnalysis } from "../types";
import { mockInterviews as initialMockInterviews } from "../data/mockInterviews";

const INTERVIEWS_KEY = "interviews";
const ANALYSIS_RESULTS_KEY = "analysisResults";
const RANKED_ORDER_KEY = "rankedOrder";
const SCORE_FILTER_KEY = "scoreFilter";
const SORT_ORDER_KEY = "sortOrder";

export type SortOrder = "date" | "rank" | "score";

type Listener<T> = (value: T) => void;

function createStore<T>(key: string, initialValue: T) {
  let value: T = initialValue;
  const listeners = new Set<Listener<T>>();

  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      value = JSON.parse(stored);
    } catch {
      value = initialValue;
    }
  }

  function get(): T {
    return value;
  }

  function set(newValue: T): void {
    value = newValue;
    localStorage.setItem(key, JSON.stringify(newValue));
    listeners.forEach((listener) => listener(value));
  }

  function subscribe(listener: Listener<T>): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { get, set, subscribe };
}

export const interviewsStore = createStore<InterviewOutput[]>(
  INTERVIEWS_KEY,
  initialMockInterviews
);

export const analysisResultsStore = createStore<
  Record<string, InterviewAnalysis>
>(ANALYSIS_RESULTS_KEY, {});

export const rankedOrderStore = createStore<string[] | null>(
  RANKED_ORDER_KEY,
  null
);

export const scoreFilterStore = createStore<string>(SCORE_FILTER_KEY, "all");

export const sortOrderStore = createStore<SortOrder>(SORT_ORDER_KEY, "date");
