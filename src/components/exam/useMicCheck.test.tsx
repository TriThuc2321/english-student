import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SAMPLE_MS, useMicCheck } from './useMicCheck';

const stopTrack = vi.fn();
const getUserMedia = vi.fn();
const closeContext = vi.fn();
let amplitude = 0;

class FakeRecorder {
  static isTypeSupported = (type: string) => type.startsWith('audio/webm');
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(
    public stream: MediaStream,
    public options: { mimeType: string },
  ) {}
  start() {}
  stop() {
    this.ondataavailable?.({
      data: new Blob(['voice'], { type: this.options.mimeType }),
    });
    this.onstop?.();
  }
}

class FakeAudioContext {
  createAnalyser() {
    return {
      fftSize: 0,
      getFloatTimeDomainData: (samples: Float32Array) =>
        samples.fill(amplitude),
    };
  }
  createMediaStreamSource() {
    return { connect: () => {} };
  }
  close = closeContext;
}

beforeEach(() => {
  vi.useFakeTimers();
  amplitude = 0;
  stopTrack.mockReset();
  closeContext.mockReset();
  getUserMedia.mockReset();
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  vi.stubGlobal('AudioContext', FakeAudioContext);
  URL.createObjectURL = vi.fn(() => 'blob:sample');
  URL.revokeObjectURL = vi.fn();
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useMicCheck', () => {
  it('shows the live level and marks a voice as heard', async () => {
    const { result } = renderHook(() => useMicCheck());
    await act(() => result.current.start());
    expect(result.current.state).toBe('listening');

    act(() => vi.advanceTimersByTime(50));
    expect(result.current.level).toBe(0);
    expect(result.current.heard).toBe(false);

    amplitude = 0.1;
    act(() => vi.advanceTimersByTime(50));
    expect(result.current.level).toBeGreaterThan(0.15);
    expect(result.current.heard).toBe(true);

    amplitude = 0;
    act(() => vi.advanceTimersByTime(50));
    expect(result.current.heard).toBe(true);
  });

  it('records a sample that stops on its own for playback', async () => {
    const { result } = renderHook(() => useMicCheck());
    await act(() => result.current.start());

    act(() => result.current.recordSample());
    expect(result.current.sampling).toBe(true);

    act(() => vi.advanceTimersByTime(SAMPLE_MS));
    expect(result.current.sampling).toBe(false);
    expect(result.current.sampleUrl).toBe('blob:sample');
  });

  it('reports a blocked microphone', async () => {
    getUserMedia.mockRejectedValue(new DOMException('denied'));
    const { result } = renderHook(() => useMicCheck());
    await act(() => result.current.start());
    expect(result.current.state).toBe('error');
    expect(result.current.error).toBe('permission');
  });

  it('reports a browser without recording support', async () => {
    vi.stubGlobal('MediaRecorder', undefined);
    const { result } = renderHook(() => useMicCheck());
    await act(() => result.current.start());
    expect(result.current.error).toBe('unsupported');
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('releases the microphone on unmount', async () => {
    const { result, unmount } = renderHook(() => useMicCheck());
    await act(() => result.current.start());
    act(() => result.current.recordSample());
    act(() => vi.advanceTimersByTime(SAMPLE_MS));

    unmount();
    expect(stopTrack).toHaveBeenCalled();
    expect(closeContext).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:sample');
  });
});
