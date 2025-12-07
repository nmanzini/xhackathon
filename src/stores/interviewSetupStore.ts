import type { HelpLevel } from "../types";

export interface InterviewSetup {
  candidateName: string;
  helpLevel: HelpLevel;
  questionId: string;
  customInstruction: string;
}

type Listener<T> = (value: T) => void;

function createMemoryStore<T>(initialValue: T) {
  let value: T = initialValue;
  const listeners = new Set<Listener<T>>();

  function get(): T {
    return value;
  }

  function set(newValue: T): void {
    value = newValue;
    listeners.forEach((listener) => listener(value));
  }

  function subscribe(listener: Listener<T>): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { get, set, subscribe };
}

export const interviewSetupStore = createMemoryStore<InterviewSetup | null>(
  null
);
