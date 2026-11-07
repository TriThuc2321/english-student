import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ATTEMPT_AUDIO_MAX_BYTES, uploadAttemptAudio } from './attempts-client';
import { ApiError } from './client';

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status });

const upload = {
  storageKey: 'attempts/a1/abc.webm',
  uploadUrl: 'https://storage.test/put?sig=1',
  headers: { 'Content-Type': 'audio/webm', 'Cache-Control': 'private' },
  expiresIn: 600,
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('uploadAttemptAudio', () => {
  const blob = new Blob(['voice'], { type: 'audio/webm' });

  it('uploads then confirms and returns the media id', async () => {
    fetchMock
      .mockResolvedValueOnce(json(201, upload))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        json(201, {
          questionId: 5,
          response: { mediaId: 42 },
          flagged: false,
          answeredAt: '2026-11-07T10:00:00.000Z',
        }),
      );

    await expect(uploadAttemptAudio('a1', 5, blob)).resolves.toBe(42);

    const [first, put, confirm] = fetchMock.mock.calls;
    expect(first[0]).toBe('/api/bff/student/attempts/a1/audio/upload-url');
    expect(JSON.parse(first[1].body)).toEqual({
      questionId: 5,
      contentType: 'audio/webm',
      size: blob.size,
    });
    expect(put[0]).toBe(upload.uploadUrl);
    expect(put[1]).toMatchObject({
      method: 'PUT',
      headers: upload.headers,
      body: blob,
    });
    expect(confirm[0]).toBe('/api/bff/student/attempts/a1/audio');
    expect(JSON.parse(confirm[1].body)).toEqual({
      questionId: 5,
      storageKey: upload.storageKey,
    });
  });

  it('rejects a file over 20 MB without calling the API', async () => {
    expect(ATTEMPT_AUDIO_MAX_BYTES).toBe(20 * 1024 * 1024);
    const big = { size: ATTEMPT_AUDIO_MAX_BYTES + 1, type: 'audio/webm' };

    await expect(uploadAttemptAudio('a1', 5, big as Blob)).rejects.toThrow(
      'AUDIO_TOO_LARGE',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces a failed PUT', async () => {
    fetchMock
      .mockResolvedValueOnce(json(201, upload))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));

    const error = await uploadAttemptAudio('a1', 5, blob).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
