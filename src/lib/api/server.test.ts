// @vitest-environment node
import { redirect } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiGet } from './server';

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'token' }) }),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const fetchMock = vi.fn();

const respond = (status: number, body: unknown) =>
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

describe('apiGet', () => {
  it('returns the parsed body on 200', async () => {
    respond(200, { id: 1 });

    await expect(apiGet('/student/tests/1')).resolves.toEqual({ id: 1 });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token');
  });

  it('redirects to the session-expired route on 401', async () => {
    respond(401, { message: 'Unauthorized' });

    await expect(apiGet('/student/tests')).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/api/session/expired');
  });

  it('throws ApiError with status and body on 500', async () => {
    respond(500, { message: 'boom' });

    await expect(apiGet('/student/tests')).rejects.toMatchObject({
      status: 500,
      data: { message: 'boom' },
    });
  });
});
