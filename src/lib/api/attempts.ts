import { cache } from 'react';

import type { Attempt, AttemptResult } from '@/types/attempt';

import { ApiError, apiErrorCode } from './client';
import { apiGet } from './server';

export type AttemptResultLookup =
  | { status: 'ok'; result: AttemptResult }
  | { status: 'notFound' }
  | { status: 'notGraded'; testSlug: string };

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
      if (apiErrorCode(error) === 'ATTEMPT_NOT_GRADED') {
        const attempt = await apiGet<Attempt>(
          `/student/attempts/${encodeURIComponent(id)}`,
        );
        return { status: 'notGraded', testSlug: attempt.testSlug };
      }
      throw error;
    }
  },
);
