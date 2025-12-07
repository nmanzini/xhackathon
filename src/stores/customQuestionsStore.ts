import type { QuestionTemplate } from "../config/interview";

const CUSTOM_QUESTIONS_KEY = "customQuestions";

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

export const customQuestionsStore = createStore<QuestionTemplate[]>(
  CUSTOM_QUESTIONS_KEY,
  []
);
