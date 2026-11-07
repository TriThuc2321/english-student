import { createContext, useContext } from 'react';

export type AttemptAudio = {
  upload: (questionId: number, blob: Blob) => Promise<number>;
};

// null outside an attempt that can take recordings, e.g. a read-only preview.
export const AttemptAudioContext = createContext<AttemptAudio | null>(null);

export const useAttemptAudio = () => useContext(AttemptAudioContext);
