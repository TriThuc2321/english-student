import { cache } from 'react';

import type {
  Attempt,
  AttemptListItem,
  AttemptResult,
  AttemptStatus,
} from '@/types/attempt';
import type { Paginated } from '@/types/student-test';

import { ApiError, apiErrorCode } from './client';
import { apiGet } from './server';

export const ATTEMPTS_PAGE_SIZE = 10;

type MyAttemptsParams = {
  status?: AttemptStatus;
  page?: number;
  take?: number;
};

export function getMyAttempts({ status, page, take }: MyAttemptsParams) {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (page) query.set('page', String(page));
  if (take) query.set('take', String(take));
  return apiGet<Paginated<AttemptListItem>>(`/student/attempts?${query}`);
}

export type AttemptResultLookup =
  | { status: 'ok'; result: AttemptResult }
  | { status: 'notFound' }
  | { status: 'inProgress'; testSlug: string };

export const getAttemptResult = cache(
  async (id: string): Promise<AttemptResultLookup> => {
    try {
      const result = await apiGet<AttemptResult>(
        `/student/attempts/${encodeURIComponent(id)}/result`,
      );
      return { status: 'ok', result };
    } catch (error) {
      // A malformed id is rejected with 400 by the uuid pipe, which is a missing page to the user.
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 400)
      ) {
        return { status: 'notFound' };
      }
      // The API only refuses a result while the attempt is still being taken.
      if (apiErrorCode(error) === 'ATTEMPT_NOT_GRADED') {
        const attempt = await apiGet<Attempt>(
          `/student/attempts/${encodeURIComponent(id)}`,
        );
        return { status: 'inProgress', testSlug: attempt.testSlug };
      }
      throw error;
    }
  },
);
