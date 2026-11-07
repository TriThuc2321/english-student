import { Button, Spinner } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { LuMic, LuSquare } from 'react-icons/lu';

import type { QuestionView } from '@/lib/exam/group-view';

import type { AttemptAudio } from '../../attemptAudio';

import { useExamGroup } from '../context';
import { mmss } from '../parts';

export function IeltsRecorder({
  q,
  audio,
}: {
  q: QuestionView;
  audio: AttemptAudio;
}) {
  const t = useTranslations('taking');
  const { answers, readOnly } = useExamGroup();

  const audioRef = useRef(audio);
  useEffect(() => {
    audioRef.current = audio;
  });
  // Leaving the question mid-answer keeps what was said instead of discarding it.
  useEffect(
    () => () => {
      if (audioRef.current.recordingId === q.id) void audioRef.current.stop();
    },
    [q.id],
  );

  const status =
    audio.statusOf(q.id) ??
    (answers[q.n] === undefined ? null : ({ kind: 'saved' } as const));
  const recording = audio.recordingId === q.id;
  const uploading = status?.kind === 'uploading';
  const busyElsewhere = audio.recordingId !== null && !recording;
  const recorderError =
    audio.recorderError?.questionId === q.id ? audio.recorderError.error : null;

  return (
    <div className="bg-default rounded-field mt-3 flex flex-col gap-2 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        {recording ? (
          <Button size="sm" variant="danger" onPress={() => void audio.stop()}>
            <LuSquare aria-hidden className="size-3.5" />
            {t('stopRecording')}
          </Button>
        ) : (
          <Button
            size="sm"
            variant={status?.kind === 'saved' ? 'secondary' : 'primary'}
            isDisabled={readOnly || uploading || busyElsewhere}
            onPress={() => void audio.start(q.id)}
          >
            <LuMic aria-hidden className="size-3.5" />
            {status?.kind === 'saved' || status?.kind === 'failed'
              ? t('recordAgain')
              : t('record')}
          </Button>
        )}
        {recording && (
          <span className="text-danger font-semibold tabular-nums">
            {mmss(Math.floor(audio.elapsedMs / 1000))}
          </span>
        )}
        {uploading && (
          <span className="text-muted flex items-center gap-2">
            <Spinner size="sm" color="current" />
            {t('uploading')}
          </span>
        )}
        {status?.kind === 'saved' && !recording && (
          <span className="text-success font-semibold">
            {t('recordingSaved')}
          </span>
        )}
      </div>
      <output className="empty:hidden">
        {recorderError === 'permission' && t('micDenied')}
        {recorderError === 'unsupported' && t('micUnsupported')}
        {status?.kind === 'failed' && (
          <span className="text-danger flex flex-wrap items-center gap-2">
            {t(status.error)}
            {status.error === 'uploadFailed' && (
              <Button
                size="sm"
                variant="secondary"
                onPress={() => void audio.retry(q.id)}
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
