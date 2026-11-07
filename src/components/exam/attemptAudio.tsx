import { createContext, useContext } from 'react';

import type { RecorderError } from './useRecorder';

export type UploadError = 'sectionClosed' | 'audioTooLarge' | 'uploadFailed';

export type RecordingStatus =
  | { kind: 'uploading' }
  | { kind: 'saved' }
  | { kind: 'failed'; error: UploadError };

export type AttemptAudio = {
  // The question being recorded; one recording runs at a time.
  recordingId: number | null;
  elapsedMs: number;
  // Set when the last start() failed, for the question it was started on.
  recorderError: { questionId: number; error: RecorderError } | null;
  // null when nothing was recorded for the question in this session.
  statusOf: (questionId: number) => RecordingStatus | null;
  start: (questionId: number) => Promise<void>;
  stop: () => Promise<void>;
  retry: (questionId: number) => Promise<void>;
};

// null outside an attempt that can take recordings, e.g. a read-only preview.
export const AttemptAudioContext = createContext<AttemptAudio | null>(null);

export const useAttemptAudio = () => useContext(AttemptAudioContext);
