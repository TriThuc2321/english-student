import { useCallback, useMemo, useRef } from 'react';

import { uploadAttemptAudio } from '@/lib/api/attempts-client';

import type { AttemptAudio } from './attemptAudio';

export function useAttemptRecordings(
  attemptId: string | null,
): AttemptAudio & { settle: () => Promise<void> } {
  const inFlight = useRef(new Set<Promise<number>>());

  const upload = useCallback(
    async (questionId: number, blob: Blob) => {
      if (!attemptId) throw new Error('No attempt');
      const pending = uploadAttemptAudio(attemptId, questionId, blob);
      inFlight.current.add(pending);
      try {
        return await pending;
      } finally {
        inFlight.current.delete(pending);
      }
    },
    [attemptId],
  );

  // Never rejects: a failed upload is shown on the question and must not block the submit.
  const settle = useCallback(async () => {
    await Promise.allSettled(inFlight.current);
  }, []);

  return useMemo(() => ({ upload, settle }), [upload, settle]);
}
