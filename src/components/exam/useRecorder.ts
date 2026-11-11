import { useCallback, useEffect, useRef, useState } from 'react';

const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

export type RecorderError = 'permission' | 'unsupported';

export const pickMimeType = () =>
  typeof MediaRecorder === 'undefined' || !navigator.mediaDevices
    ? undefined
    : MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));

type Session = {
  recorder: MediaRecorder;
  stream: MediaStream;
  chunks: Blob[];
  mimeType: string;
};

const release = (stream: MediaStream) =>
  stream.getTracks().forEach((track) => track.stop());

export function useRecorder() {
  const [state, setState] = useState<'idle' | 'recording' | 'error'>('idle');
  const [error, setError] = useState<RecorderError | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const session = useRef<Session | null>(null);

  useEffect(() => {
    if (state !== 'recording') return;
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), 250);
    return () => clearInterval(timer);
  }, [state]);

  useEffect(
    () => () => {
      if (session.current) release(session.current.stream);
    },
    [],
  );

  const start = useCallback(async (): Promise<boolean> => {
    const mimeType = pickMimeType();
    if (!mimeType) {
      setError('unsupported');
      setState('error');
      return false;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('permission');
      setState('error');
      return false;
    }
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.start();
    session.current = { recorder, stream, chunks, mimeType };
    setError(null);
    setElapsedMs(0);
    setState('recording');
    return true;
  }, []);

  const stop = useCallback(
    () =>
      new Promise<Blob>((resolve, reject) => {
        const current = session.current;
        if (!current) {
          reject(new Error('Not recording'));
          return;
        }
        current.recorder.onstop = () => {
          release(current.stream);
          session.current = null;
          setState('idle');
          // Storage and the API match on the bare media type, without codec parameters.
          const type = current.mimeType.split(';')[0];
          resolve(new Blob(current.chunks, { type }));
        };
        current.recorder.stop();
      }),
    [],
  );

  return { state, error, elapsedMs, start, stop };
}
