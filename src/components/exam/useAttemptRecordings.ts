import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { uploadAttemptAudio } from '@/lib/api/attempts-client';
import { ApiError } from '@/lib/api/client';

import type {
  AttemptAudio,
  RecordingStatus,
  UploadError,
} from './attemptAudio';

import { useRecorder } from './useRecorder';

function uploadError(error: unknown): UploadError {
  if (error instanceof ApiError && error.status === 409) return 'sectionClosed';
  if (error instanceof Error && error.message === 'AUDIO_TOO_LARGE') {
    return 'audioTooLarge';
  }
  return 'uploadFailed';
}

// Owned by the exam runner rather than the question view, so a recording survives the view
// unmounting (part change, time-up, submit) and is uploaded instead of dropped.
export function useAttemptRecordings(
  attemptId: string | null,
  onSaved: (questionId: number, mediaId: number) => void,
): AttemptAudio & { settle: () => Promise<void> } {
  const recorder = useRecorder();
  const [statuses, setStatuses] = useState<Record<number, RecordingStatus>>({});
  const [recordingId, setRecordingId] = useState<number | null>(null);
  const [startedOn, setStartedOn] = useState<number | null>(null);
  const recordingRef = useRef<number | null>(null);
  const failedBlobs = useRef(new Map<number, Blob>());
  const inFlight = useRef(new Set<Promise<void>>());
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  const setStatus = (questionId: number, status: RecordingStatus) =>
    setStatuses((prev) => ({ ...prev, [questionId]: status }));

  const track = useCallback((work: Promise<void>) => {
    inFlight.current.add(work);
    void work.finally(() => inFlight.current.delete(work));
    return work;
  }, []);

  const send = useCallback(
    async (questionId: number, blob: Blob) => {
      if (!attemptId) return;
      setStatus(questionId, { kind: 'uploading' });
      try {
        const mediaId = await uploadAttemptAudio(attemptId, questionId, blob);
        failedBlobs.current.delete(questionId);
        setStatus(questionId, { kind: 'saved' });
        onSavedRef.current(questionId, mediaId);
      } catch (error) {
        failedBlobs.current.set(questionId, blob);
        setStatus(questionId, { kind: 'failed', error: uploadError(error) });
      }
    },
    [attemptId],
  );

  const start = useCallback(
    async (questionId: number) => {
      if (recordingRef.current !== null) return;
      setStartedOn(questionId);
      if (!(await recorder.start())) return;
      recordingRef.current = questionId;
      setRecordingId(questionId);
    },
    [recorder],
  );

  const stop = useCallback(() => {
    const questionId = recordingRef.current;
    if (questionId === null) return Promise.resolve();
    recordingRef.current = null;
    setRecordingId(null);
    return track(
      recorder.stop().then(
        (blob) => send(questionId, blob),
        () => undefined,
      ),
    );
  }, [recorder, send, track]);

  const retry = useCallback(
    async (questionId: number) => {
      const blob = failedBlobs.current.get(questionId);
      if (blob) await track(send(questionId, blob));
    },
    [send, track],
  );

  // Never rejects: a failed upload is shown on the question and must not block the submit.
  const settle = useCallback(async () => {
    await stop();
    await Promise.allSettled(inFlight.current);
  }, [stop]);

  const statusOf = useCallback(
    (questionId: number) => statuses[questionId] ?? null,
    [statuses],
  );

  const { elapsedMs, error } = recorder;
  return useMemo(
    () => ({
      recordingId,
      elapsedMs,
      recorderError:
        error && startedOn !== null ? { questionId: startedOn, error } : null,
      statusOf,
      start,
      stop,
      retry,
      settle,
    }),
    [
      recordingId,
      elapsedMs,
      error,
      startedOn,
      statusOf,
      start,
      stop,
      retry,
      settle,
    ],
  );
}
