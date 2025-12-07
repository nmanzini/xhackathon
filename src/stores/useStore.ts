import { useSyncExternalStore } from "react";

interface Store<T> {
  get: () => T;
  set: (value: T) => void;
  subscribe: (listener: (value: T) => void) => () => void;
}

export function useStore<T>(store: Store<T>): [T, (value: T) => void] {
  const value = useSyncExternalStore(store.subscribe, store.get, store.get);
  return [value, store.set];
}
