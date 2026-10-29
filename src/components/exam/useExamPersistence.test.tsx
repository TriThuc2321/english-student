import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExamState } from '@/lib/exam/reducer';

import { loadExamDraft } from '@/lib/exam/draft';

import { useExamPersistence } from './useExamPersistence';

const base: ExamState = {
  answers: {},
  sectionId: 1,
  partId: null,
  remaining: { 1: 600 },
  flagged: {},
  submitted: [],
};

function setup(enabled = true) {
  return renderHook(
    ({ state, enabled }) => useExamPersistence('t', state, enabled),
    { initialProps: { state: base, enabled } },
  );
}

describe('useExamPersistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it('debounces answer changes by 500 ms', () => {
    const { rerender } = setup();
    rerender({ state: { ...base, answers: { 1: { 1: 'A' } } }, enabled: true });
    act(() => vi.advanceTimersByTime(499));
    expect(loadExamDraft('t')).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(loadExamDraft('t')?.answers).toEqual({ 1: { 1: 'A' } });
  });

  it('flushes on pagehide', () => {
    const { rerender } = setup();
    rerender({ state: { ...base, answers: { 1: { 1: 'B' } } }, enabled: true });
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(loadExamDraft('t')?.answers).toEqual({ 1: { 1: 'B' } });
  });

  it('writes immediately when the section changes', () => {
    const { rerender } = setup();
    rerender({ state: { ...base, sectionId: 2 }, enabled: true });
    expect(loadExamDraft('t')?.sectionId).toBe(2);
  });

  it('saves the latest remaining on the 5 s interval', () => {
    const { rerender } = setup();
    rerender({ state: { ...base, remaining: { 1: 590 } }, enabled: true });
    act(() => vi.advanceTimersByTime(5000));
    expect(loadExamDraft('t')?.remaining).toEqual({ 1: 590 });
  });

  it('writes nothing while disabled', () => {
    const { rerender } = setup(false);
    rerender({
      state: { ...base, answers: { 1: { 1: 'A' } } },
      enabled: false,
    });
    act(() => {
      vi.advanceTimersByTime(6000);
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(loadExamDraft('t')).toBeNull();
  });

  it('saves pending changes when unmounted before the debounce fires', () => {
    const { rerender, unmount } = setup();
    rerender({ state: { ...base, answers: { 1: { 1: 'C' } } }, enabled: true });
    act(() => vi.advanceTimersByTime(100));
    unmount();
    expect(loadExamDraft('t')?.answers).toEqual({ 1: { 1: 'C' } });
  });

  it('writes nothing without changes, on the interval or pagehide', () => {
    const { unmount } = setup();
    act(() => {
      vi.advanceTimersByTime(6000);
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(loadExamDraft('t')).toBeNull();
    unmount();
    expect(loadExamDraft('t')).toBeNull();
  });

  it('does not rewrite an unchanged draft on later intervals', () => {
    const { rerender } = setup();
    rerender({ state: { ...base, answers: { 1: { 1: 'A' } } }, enabled: true });
    act(() => vi.advanceTimersByTime(5000));
    localStorage.clear();
    act(() => vi.advanceTimersByTime(5000));
    expect(loadExamDraft('t')).toBeNull();
  });
});
