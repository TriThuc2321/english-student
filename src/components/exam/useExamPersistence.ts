import { useEffect, useRef } from 'react';

import type { ExamState } from '@/lib/exam/reducer';

import { saveExamDraft } from '@/lib/exam/draft';

const DEBOUNCE_MS = 500;
const INTERVAL_MS = 5000;

export function useExamPersistence(
  slug: string,
  state: ExamState,
  enabled: boolean,
): void {
  // Timers and listeners must write the latest state, not the one they closed over.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const prevRef = useRef<ExamState | null>(null);
  const { answers, flagged, partId, sectionId } = state;

  useEffect(() => {
    if (!enabled) {
      prevRef.current = null;
      return;
    }
    const prev = prevRef.current;
    prevRef.current = stateRef.current;
    // First run after enabling holds the restored/initial state; saving it would create a draft nobody asked for.
    if (!prev) return;

    if (prev.sectionId !== sectionId) {
      saveExamDraft(slug, stateRef.current);
      return;
    }
    const timer = setTimeout(
      () => saveExamDraft(slug, stateRef.current),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [slug, enabled, answers, flagged, partId, sectionId]);

  useEffect(() => {
    if (!enabled) return;
    const flush = () => saveExamDraft(slug, stateRef.current);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const interval = setInterval(flush, INTERVAL_MS);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [slug, enabled]);
}
