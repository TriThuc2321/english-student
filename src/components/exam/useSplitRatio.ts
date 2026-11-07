import { useSyncExternalStore } from 'react';

const KEY = 'exam-split-ratio';
export const SPLIT_MIN = 30;
export const SPLIT_MAX = 70;
const DEFAULT = 50;

export const clampSplit = (value: number) =>
  Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, Math.round(value)));

const listeners = new Set<() => void>();
// Fallback for blocked storage, so dragging still works for this visit.
let memory = DEFAULT;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function read(): number {
  try {
    const saved = Number(localStorage.getItem(KEY));
    return saved ? clampSplit(saved) : memory;
  } catch {
    return memory;
  }
}

function write(value: number) {
  memory = clampSplit(value);
  try {
    localStorage.setItem(KEY, String(memory));
  } catch {
    // Blocked storage: memory still holds the ratio for this visit.
  }
  listeners.forEach((listener) => listener());
}

/** Width of the passage pane, in percent of the split container. */
export function useSplitRatio() {
  const ratio = useSyncExternalStore(subscribe, read, () => DEFAULT);
  return [ratio, write] as const;
}
