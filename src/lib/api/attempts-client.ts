import type {
  Attempt,
  SaveAnswerItem,
  SaveAnswersResult,
  StartAttemptInput,
} from '@/types/attempt';

import { api, apiErrorCode, apiErrorField } from './client';

const base = (id: string) => `/student/attempts/${encodeURIComponent(id)}`;

export const startAttempt = (input: StartAttemptInput) =>
  api<Attempt>('/student/attempts', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const getAttempt = (id: string) => api<Attempt>(base(id));

export const saveAttemptAnswers = (
  id: string,
  answers: SaveAnswerItem[],
  { keepalive = false }: { keepalive?: boolean } = {},
) =>
  api<SaveAnswersResult>(`${base(id)}/answers`, {
    method: 'PUT',
    body: JSON.stringify({ answers }),
    keepalive,
  });

export const submitAttemptSection = (id: string, sectionId: number) =>
  api<Attempt>(`${base(id)}/sections/${sectionId}/submit`, { method: 'POST' });

export const submitAttempt = (id: string) =>
  api<Attempt>(`${base(id)}/submit`, { method: 'POST' });

// Only one attempt per test can be open, so starting again resumes it.
export async function openAttempt(input: StartAttemptInput): Promise<Attempt> {
  try {
    return await startAttempt(input);
  } catch (error) {
    const attemptId = apiErrorField(error, 'attemptId');
    if (
      apiErrorCode(error) === 'ATTEMPT_IN_PROGRESS' &&
      typeof attemptId === 'string'
    ) {
      return getAttempt(attemptId);
    }
    throw error;
  }
}
