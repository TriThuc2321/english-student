// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  makeAttempt,
  makeAttemptListItem,
  makeAttemptResult,
} from '@/test/fixtures/attempt';
import { makeTest } from '@/test/fixtures/student-test';

import { getAttemptContent, getAttemptResult, getAttempts } from './attempts';
import { ApiError } from './client';

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

describe('getAttemptResult', () => {
  it('returns the result', async () => {
    const result = makeAttemptResult();
    respond(200, result);

    await expect(getAttemptResult('a1')).resolves.toEqual({
      status: 'ok',
      result,
    });
    expect(String(fetchMock.mock.calls[0][0])).toMatch(
      /\/api\/student\/attempts\/a1\/result$/,
    );
  });

  it.each([404, 400])('treats %d as not found', async (status) => {
    respond(status, { message: 'Not found', statusCode: status });

    await expect(getAttemptResult(`missing-${status}`)).resolves.toEqual({
      status: 'notFound',
    });
  });

  it('looks up the test of an attempt that is not graded yet', async () => {
    respond(409, { message: 'Not graded', code: 'ATTEMPT_NOT_GRADED' });
    respond(200, makeAttempt({ testSlug: 'cam-18' }));

    await expect(getAttemptResult('open')).resolves.toEqual({
      status: 'notGraded',
      testSlug: 'cam-18',
    });
  });

  it('rethrows other errors', async () => {
    respond(500, { message: 'boom' });

    const error = await getAttemptResult('broken').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
  });
});

describe('getAttempts', () => {
  it('passes paging and status filters', async () => {
    const page = {
      data: [makeAttemptListItem()],
      meta: { page: 2, take: 10, totalCount: 11 },
    };
    respond(200, page);

    await expect(
      getAttempts({ page: 2, take: 10, status: 'GRADED' }),
    ).resolves.toEqual(page);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(
      /\/api\/student\/attempts\?page=2&take=10&status=GRADED$/,
    );
  });
});

describe('getAttemptContent', () => {
  it('returns the content of the attempt', async () => {
    const test = makeTest();
    respond(200, test);

    await expect(getAttemptContent('a1')).resolves.toEqual(test);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(
      /\/api\/student\/attempts\/a1\/content$/,
    );
  });

  it.each([404, 400])('returns null for %d', async (status) => {
    respond(status, { message: 'Not found', statusCode: status });

    await expect(getAttemptContent(`gone-${status}`)).resolves.toBeNull();
  });
});
