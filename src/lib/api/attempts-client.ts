import type {
  Attempt,
  AttemptAnswerState,
  AttemptAudioUpload,
  SaveAnswerItem,
  SaveAnswersResult,
  StartAttemptInput,
} from '@/types/attempt';

import { api, ApiError, apiErrorCode, apiErrorField } from './client';

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

export const ATTEMPT_AUDIO_MAX_BYTES = 20 * 1024 * 1024;

export const requestAudioUpload = (
  id: string,
  input: { questionId: number; contentType: string; size: number },
) =>
  api<AttemptAudioUpload>(`${base(id)}/audio/upload-url`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const confirmAttemptAudio = (
  id: string,
  input: { questionId: number; storageKey: string },
) =>
  api<AttemptAnswerState>(`${base(id)}/audio`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export async function uploadAttemptAudio(
  id: string,
  questionId: number,
  blob: Blob,
): Promise<number> {
  if (blob.size > ATTEMPT_AUDIO_MAX_BYTES) throw new Error('AUDIO_TOO_LARGE');
  const upload = await requestAudioUpload(id, {
    questionId,
    contentType: blob.type,
    size: blob.size,
  });
  // Straight to storage: the presigned URL is not behind the BFF.
  const put = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: upload.headers,
    body: blob,
  });
  if (!put.ok) throw new ApiError(put.status, null);
  const answer = await confirmAttemptAudio(id, {
    questionId,
    storageKey: upload.storageKey,
  });
  if (!answer.response || !('mediaId' in answer.response)) {
    throw new Error('AUDIO_NOT_SAVED');
  }
  return answer.response.mediaId;
}

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
