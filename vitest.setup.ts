import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Vitest runs without `globals`, so RTL can't register its own auto-cleanup.
afterEach(cleanup);

// jsdom has no ResizeObserver; HeroUI Tabs measures its indicator with one.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// RTL only detects Jest fake timers; without this its async wrapper waits on a
// faked setTimeout(0) forever whenever a test calls `vi.useFakeTimers()`.
Object.assign(globalThis, {
  jest: { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) },
});

// jsdom lacks the Web Animations API that React Aria's SharedElementTransition (Tabs indicator) calls.
if (typeof Element !== 'undefined' && !Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => [];
}
