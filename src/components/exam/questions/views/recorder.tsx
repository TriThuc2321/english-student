import { Button, Spinner } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuMic, LuSquare } from 'react-icons/lu';

import type { QuestionView } from '@/lib/exam/group-view';

import { ApiError } from '@/lib/api/client';

import type { AttemptAudio } from '../../attemptAudio';

import { useRecorder } from '../../useRecorder';
import { useExamGroup } from '../context';
import { mmss } from '../parts';

type UploadError = 'sectionClosed' | 'audioTooLarge' | 'uploadFailed';

type Status =
  | { kind: 'idle' }
  | { kind: 'uploading' }
  | { kind: 'saved' }
  | { kind: 'failed'; error: UploadError; blob: Blob };

function uploadError(error: unknown): UploadError {
  if (error instanceof ApiError && error.status === 409) return 'sectionClosed';
  if (error instanceof Error && error.message === 'AUDIO_TOO_LARGE') {
    return 'audioTooLarge';
  }
  return 'uploadFailed';
}

export function IeltsRecorder({
  q,
  audio,
}: {
  q: QuestionView;
  audio: AttemptAudio;
}) {
  const t = useTranslations('taking');
  const { answers, setAnswer, readOnly } = useExamGroup();
  const recorder = useRecorder();
  const [status, setStatus] = useState<Status>(() =>
    answers[q.n] === undefined ? { kind: 'idle' } : { kind: 'saved' },
  );

  const send = async (blob: Blob) => {
    setStatus({ kind: 'uploading' });
    try {
      const mediaId = await audio.upload(q.id, blob);
      setAnswer(q.n, String(mediaId));
      setStatus({ kind: 'saved' });
    } catch (error) {
      setStatus({ kind: 'failed', error: uploadError(error), blob });
    }
  };

  const recording = recorder.state === 'recording';
  const uploading = status.kind === 'uploading';

  return (
    <div className="bg-default rounded-field mt-3 flex flex-col gap-2 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        {recording ? (
          <Button
            size="sm"
            variant="danger"
            onPress={async () => void send(await recorder.stop())}
          >
            <LuSquare aria-hidden className="size-3.5" />
            {t('stopRecording')}
          </Button>
        ) : (
          <Button
            size="sm"
            variant={status.kind === 'saved' ? 'secondary' : 'primary'}
            isDisabled={readOnly || uploading}
            onPress={() => void recorder.start()}
          >
            <LuMic aria-hidden className="size-3.5" />
            {status.kind === 'saved' || status.kind === 'failed'
              ? t('recordAgain')
              : t('record')}
          </Button>
        )}
        {recording && (
          <span
            className="text-danger font-semibold tabular-nums"
            aria-live="off"
          >
            {mmss(Math.floor(recorder.elapsedMs / 1000))}
          </span>
        )}
        {uploading && (
          <span className="text-muted flex items-center gap-2">
            <Spinner size="sm" color="current" />
            {t('uploading')}
          </span>
        )}
        {status.kind === 'saved' && !recording && (
          <span className="text-success font-semibold">
            {t('recordingSaved')}
          </span>
        )}
      </div>
      <output className="empty:hidden">
        {recorder.error === 'permission' && t('micDenied')}
        {recorder.error === 'unsupported' && t('micUnsupported')}
        {status.kind === 'failed' && (
          <span className="text-danger flex flex-wrap items-center gap-2">
            {t(status.error)}
            {status.error === 'uploadFailed' && (
              <Button
                size="sm"
                variant="secondary"
                onPress={() => void send(status.blob)}
              >
                {t('retryUpload')}
              </Button>
            )}
          </span>
        )}
      </output>
    </div>
  );
}
