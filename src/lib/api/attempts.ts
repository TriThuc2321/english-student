import { cache } from 'react';

import type {
  Attempt,
  AttemptListItem,
  AttemptResult,
  AttemptStatus,
} from '@/types/attempt';
import type { Paginated, StudentTestDetail } from '@/types/student-test';

import { ApiError, apiErrorCode } from './client';
import { apiGet } from './server';

export const ATTEMPTS_PAGE_SIZE = 10;

export type AttemptResultLookup =
  | { status: 'ok'; result: AttemptResult }
  | { status: 'notFound' }
  | { status: 'notGraded'; testSlug: string };

const base = (id: string) => `/student/attempts/${encodeURIComponent(id)}`;

// A malformed id is rejected with 400 by the uuid pipe, which is a missing page to the user.
const isMissing = (error: unknown) =>
  error instanceof ApiError && (error.status === 404 || error.status === 400);

type AttemptsParams = {
  page?: number;
  take?: number;
  status?: AttemptStatus;
};

export function getAttempts({ page, take, status }: AttemptsParams = {}) {
  const query = new URLSearchParams();
  if (page) query.set('page', String(page));
  if (take) query.set('take', String(take));
  if (status) query.set('status', status);
  return apiGet<Paginated<AttemptListItem>>(`/student/attempts?${query}`);
}

export const getAttemptResult = cache(
  async (id: string): Promise<AttemptResultLookup> => {
    try {
      const result = await apiGet<AttemptResult>(`${base(id)}/result`);
      return { status: 'ok', result };
    } catch (error) {
      if (isMissing(error)) return { status: 'notFound' };
      if (apiErrorCode(error) === 'ATTEMPT_NOT_GRADED') {
        const attempt = await apiGet<Attempt>(base(id));
        return { status: 'notGraded', testSlug: attempt.testSlug };
      }
      throw error;
    }
  },
);

// Only the sections of this attempt, as they were when it was taken.
export const getAttemptContent = cache(
  async (id: string): Promise<StudentTestDetail | null> => {
    try {
      return await apiGet<StudentTestDetail>(`${base(id)}/content`);
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
  },
);
