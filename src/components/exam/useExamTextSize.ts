import { useSyncExternalStore } from 'react';

export const TEXT_SIZES = ['sm', 'md', 'lg'] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

const KEY = 'exam-text-size';

// zoom (not font-size) so question views with fixed rem sizes and inputs scale together.
export const TEXT_ZOOM: Record<TextSize, string> = {
  sm: '[zoom:0.9]',
  md: '',
  lg: '[zoom:1.15]',
};

const listeners = new Set<() => void>();
// Fallback for blocked storage, so the control still works for this visit.
let memory: TextSize = 'md';

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function read(): TextSize {
  try {
    const saved = localStorage.getItem(KEY);
    return TEXT_SIZES.includes(saved as TextSize)
      ? (saved as TextSize)
      : memory;
  } catch {
    return memory;
  }
}

function write(size: TextSize) {
  memory = size;
  try {
    localStorage.setItem(KEY, size);
  } catch {
    // Blocked storage: memory still holds the size for this visit.
  }
  listeners.forEach((listener) => listener());
}

export function useExamTextSize() {
  // The server snapshot keeps the first client render identical to SSR.
  const size = useSyncExternalStore(subscribe, read, () => 'md' as const);
  return [size, write] as const;
}
