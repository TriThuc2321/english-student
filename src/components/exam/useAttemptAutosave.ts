import { useCallback, useEffect, useRef, useState } from 'react';

import type { ExamState } from '@/lib/exam/reducer';
import type { StudentTestDetail } from '@/types/student-test';

import { saveAttemptAnswers } from '@/lib/api/attempts-client';
import { chunk, diffAnswers } from '@/lib/exam/attempt-sync';

import type { SaveStatus } from './useExamPersistence';

const DEBOUNCE_MS = 3000;
const RETRY_MS = 15_000;

type Saved = Pick<ExamState, 'answers' | 'flagged'>;

export function useAttemptAutosave(
  attemptId: string | null,
  test: StudentTestDetail,
  state: ExamState,
  // What the server already holds, set once the attempt is loaded.
  baseline: Saved | null,
): { status: SaveStatus; flush: () => Promise<boolean> } {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const stateRef = useRef(state);
  const savedRef = useRef<Saved | null>(baseline);
  // Saves run one at a time so a slow request can't land after a newer one.
  const queueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  useEffect(() => {
    stateRef.current = state;
  });
  useEffect(() => {
    savedRef.current = baseline;
  }, [baseline]);

  const save = useCallback(
    (keepalive = false) => {
      const run = async () => {
        const saved = savedRef.current;
        if (!attemptId || !saved) return true;
        const snapshot = stateRef.current;
        const items = diffAnswers(test, saved, snapshot);
        if (items.length === 0) return true;
        setStatus('saving');
        try {
          for (const batch of chunk(items)) {
            await saveAttemptAnswers(attemptId, batch, { keepalive });
          }
          savedRef.current = {
            answers: snapshot.answers,
            flagged: snapshot.flagged,
          };
          setStatus(
            diffAnswers(test, savedRef.current, stateRef.current).length
              ? 'saving'
              : 'saved',
          );
          return true;
        } catch {
          setStatus('failed');
          return false;
        }
      };
      queueRef.current = queueRef.current.then(run);
      return queueRef.current;
    },
    [attemptId, test],
  );

  const flush = useCallback(() => save(), [save]);

  const { answers, flagged, submitted } = state;
  useEffect(() => {
    if (!attemptId || !savedRef.current) return;
    const timer = setTimeout(() => void save(), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [attemptId, save, answers, flagged, submitted, baseline]);

  useEffect(() => {
    if (!attemptId) return;
    const retry = setInterval(() => void save(), RETRY_MS);
    // keepalive lets the request outlive a closing tab.
    const onHide = () => void save(true);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onHide();
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(retry);
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
      // In-app navigation (Exit) fires neither pagehide nor visibilitychange.
      void save(true);
    };
  }, [attemptId, save]);

  return { status, flush };
}
