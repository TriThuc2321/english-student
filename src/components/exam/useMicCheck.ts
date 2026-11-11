import { useCallback, useEffect, useRef, useState } from 'react';

import { pickMimeType, type RecorderError } from './useRecorder';

export const SAMPLE_MS = 5000;
// RMS of quiet speech sits around 0.02–0.05; anything above this is a voice, not room noise.
const HEARD_LEVEL = 0.15;
const FULL_SCALE_RMS = 0.25;

type Session = {
  stream: MediaStream;
  mimeType: string;
  context: AudioContext | null;
  frame: number | null;
};

export type MicCheckState = 'idle' | 'requesting' | 'listening' | 'error';

export function useMicCheck() {
  const [state, setState] = useState<MicCheckState>('idle');
  const [error, setError] = useState<RecorderError | null>(null);
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState(false);
  const [sampling, setSampling] = useState(false);
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);
  const session = useRef<Session | null>(null);
  const sampleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlRef = useRef<string | null>(null);

  const release = useCallback(() => {
    const current = session.current;
    session.current = null;
    if (sampleTimer.current) clearTimeout(sampleTimer.current);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    if (!current) return;
    if (current.frame !== null) cancelAnimationFrame(current.frame);
    current.stream.getTracks().forEach((track) => track.stop());
    void current.context?.close();
  }, []);

  useEffect(() => release, [release]);

  const meter = (current: Session) => {
    const Context = globalThis.AudioContext;
    // Without Web Audio there is no live level; the sample playback is the only check left.
    if (typeof Context === 'undefined') return;
    const context = new Context();
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    context.createMediaStreamSource(current.stream).connect(analyser);
    current.context = context;
    const samples = new Float32Array(analyser.fftSize);
    const read = () => {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const value of samples) sum += value * value;
      const next = Math.min(
        1,
        Math.sqrt(sum / samples.length) / FULL_SCALE_RMS,
      );
      setLevel(Math.round(next * 50) / 50);
      if (next >= HEARD_LEVEL) setHeard(true);
      current.frame = requestAnimationFrame(read);
    };
    current.frame = requestAnimationFrame(read);
  };

  const start = useCallback(async () => {
    release();
    setSampleUrl(null);
    setSampling(false);
    const mimeType = pickMimeType();
    if (!mimeType) {
      setError('unsupported');
      setState('error');
      return;
    }
    setState('requesting');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('permission');
      setState('error');
      return;
    }
    const current: Session = { stream, mimeType, context: null, frame: null };
    session.current = current;
    setError(null);
    setState('listening');
    meter(current);
  }, [release]);

  const recordSample = useCallback(() => {
    const current = session.current;
    if (!current || sampleTimer.current) return;
    const recorder = new MediaRecorder(current.stream, {
      mimeType: current.mimeType,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      sampleTimer.current = null;
      setSampling(false);
      if (session.current !== current) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const type = current.mimeType.split(';')[0];
      urlRef.current = URL.createObjectURL(new Blob(chunks, { type }));
      setSampleUrl(urlRef.current);
    };
    recorder.start();
    setSampling(true);
    sampleTimer.current = setTimeout(() => recorder.stop(), SAMPLE_MS);
  }, []);

  return {
    state,
    error,
    level,
    heard,
    sampling,
    sampleUrl,
    start,
    recordSample,
  };
}
