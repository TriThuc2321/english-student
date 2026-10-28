import { useCallback, useEffect, useRef, useState } from 'react';

import type { ExamState } from '@/lib/exam/reducer';

import { saveExamDraft } from '@/lib/exam/draft';

const DEBOUNCE_MS = 500;
const INTERVAL_MS = 5000;

export type SaveStatus = 'saved' | 'saving' | 'failed';

export function useExamPersistence(
  slug: string,
  state: ExamState,
  enabled: boolean,
  sectionIds?: number[] | null,
): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>('saved');
  // Timers and listeners must write the latest state, not the one they closed over.
  const stateRef = useRef(state);
  const sectionIdsRef = useRef(sectionIds);
  useEffect(() => {
    stateRef.current = state;
    sectionIdsRef.current = sectionIds;
  });

  const prevRef = useRef<ExamState | null>(null);
  const prevSectionRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);
  const { answers, flagged, partId, sectionId, remaining, submitted } = state;

  // Only changed state is written, so an idle second tab never overwrites a newer draft with stale state.
  const writeIfDirty = useCallback(() => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    setStatus(
      saveExamDraft(slug, stateRef.current, sectionIdsRef.current)
        ? 'saved'
        : 'failed',
    );
  }, [slug]);

  useEffect(() => {
    if (!enabled) {
      prevRef.current = null;
      dirtyRef.current = false;
      return;
    }
    // First run after enabling holds the restored/initial state; saving it would create a draft nobody asked for.
    if (prevRef.current) dirtyRef.current = true;
    prevRef.current = stateRef.current;
  }, [enabled, answers, flagged, partId, sectionId, remaining, submitted]);

  useEffect(() => {
    const prevSection = prevSectionRef.current;
    prevSectionRef.current = sectionId;
    if (!enabled || !dirtyRef.current) return;

    if (prevSection !== sectionId) {
      writeIfDirty();
      return;
    }
    setStatus('saving');
    const timer = setTimeout(writeIfDirty, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [enabled, writeIfDirty, answers, flagged, partId, sectionId, submitted]);

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') writeIfDirty();
    };
    const interval = setInterval(writeIfDirty, INTERVAL_MS);
    window.addEventListener('pagehide', writeIfDirty);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pagehide', writeIfDirty);
      document.removeEventListener('visibilitychange', onVisibility);
      // In-app navigation (Exit) fires neither pagehide nor visibilitychange.
      writeIfDirty();
    };
  }, [enabled, writeIfDirty]);

  return status;
}
