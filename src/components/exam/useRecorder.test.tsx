import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRecorder } from './useRecorder';

const stopTrack = vi.fn();
const getUserMedia = vi.fn();

class FakeRecorder {
  static isTypeSupported = (type: string) => type.startsWith('audio/webm');
  state = 'inactive';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(
    public stream: MediaStream,
    public options: { mimeType: string },
  ) {}
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({
      data: new Blob(['voice'], { type: this.options.mimeType }),
    });
    this.onstop?.();
  }
}

beforeEach(() => {
  stopTrack.mockReset();
  getUserMedia.mockReset();
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useRecorder', () => {
  it('records and returns a webm blob', async () => {
    const { result } = renderHook(() => useRecorder());

    await act(() => result.current.start());
    expect(result.current.state).toBe('recording');
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });

    let blob: Blob | undefined;
    await act(async () => {
      blob = await result.current.stop();
    });
    expect(blob?.type).toBe('audio/webm');
    expect(blob?.size).toBeGreaterThan(0);
    expect(result.current.state).toBe('idle');
  });

  it('releases the microphone on stop', async () => {
    const { result } = renderHook(() => useRecorder());
    await act(() => result.current.start());
    await act(async () => {
      await result.current.stop();
    });
    expect(stopTrack).toHaveBeenCalled();
  });

  it('reports permission denied', async () => {
    getUserMedia.mockRejectedValue(
      new DOMException('denied', 'NotAllowedError'),
    );
    const { result } = renderHook(() => useRecorder());

    await act(() => result.current.start());
    expect(result.current).toMatchObject({
      state: 'error',
      error: 'permission',
    });
  });

  it('reports unsupported', async () => {
    vi.stubGlobal('MediaRecorder', undefined);
    const { result } = renderHook(() => useRecorder());

    await act(() => result.current.start());
    expect(result.current).toMatchObject({
      state: 'error',
      error: 'unsupported',
    });
  });

  it('releases the microphone on unmount', async () => {
    const { result, unmount } = renderHook(() => useRecorder());
    await act(() => result.current.start());
    unmount();
    expect(stopTrack).toHaveBeenCalled();
  });
});
