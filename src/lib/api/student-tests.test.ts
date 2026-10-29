// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from './client';
import { getStudentTest, getStudentTests } from './student-tests';

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

const fetchedUrl = () => String(fetchMock.mock.calls[0][0]);

const emptyPage = { data: [], meta: { page: 1, take: 4, totalCount: 0 } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

describe('getStudentTests', () => {
  it('sends only defined params', async () => {
    respond(200, emptyPage);

    await getStudentTests({ examType: 'TOEIC_LR', take: 4 });
    expect(fetchedUrl()).toMatch(
      /\/api\/student\/tests\?examType=TOEIC_LR&take=4$/,
    );
  });

  it('omits an empty search', async () => {
    respond(200, emptyPage);

    await getStudentTests({ search: '', page: 2, take: 12 });
    expect(fetchedUrl()).toMatch(/\/api\/student\/tests\?page=2&take=12$/);
  });
});

describe('getStudentTest', () => {
  it('returns null on 404', async () => {
    respond(404, { message: 'Not found', statusCode: 404 });

    await expect(getStudentTest('missing-test')).resolves.toBeNull();
  });

  it('rethrows other errors', async () => {
    respond(500, { message: 'boom' });

    const error = await getStudentTest('broken-test').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 500 });
  });
});
