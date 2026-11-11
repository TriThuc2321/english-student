import { cn, Tooltip } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { LuMic } from 'react-icons/lu';

import type { QuestionView } from '@/lib/exam/group-view';

import { isRecordedQuestion } from '@/lib/exam/attempt-sync';
import { wordCount } from '@/lib/exam/word-count';

import { useAttemptAudio } from '../../attemptAudio';
import { useExamGroup } from '../context';
import { ExamImage, ZoomableImage } from '../media';
import { Hint, mmss, Prompt, QRow } from '../parts';
import { GroupAudio } from './groupMedia';
import { IeltsRecorder } from './recorder';

const Task = ({ children }: { children: React.ReactNode }) => (
  <div className="border-border mb-3 rounded-xl border p-4">{children}</div>
);

const Recorder = ({ q }: { q: QuestionView }) => {
  const t = useTranslations('taking');
  const prep = q.content?.prepSeconds ?? 0;
  const response = q.content?.responseSeconds ?? 0;
  return (
    <div className="bg-default mt-3 flex flex-wrap items-center gap-3 rounded-xl px-3 py-2 text-sm">
      <Tooltip delay={0}>
        <Tooltip.Trigger aria-label={t('recordSoon')} tabIndex={0}>
          <span className="bg-danger text-danger-foreground grid size-8 place-items-center rounded-full opacity-50">
            <LuMic className="size-4" />
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>{t('recordSoon')}</p>
        </Tooltip.Content>
      </Tooltip>
      <span>{t('timing', { prep: mmss(prep), response: mmss(response) })}</span>
    </div>
  );
};

export const SpeakView = () => {
  const t = useTranslations('taking');
  const { group, review } = useExamGroup();
  const audio = useAttemptAudio();
  const recordable = audio !== null && isRecordedQuestion(group.type);
  const info = group.content?.info;

  return (
    <>
      <GroupAudio />
      {info && (
        <div className="mb-4">
          {info.title && <h5 className="mb-1.5 font-bold">{info.title}</h5>}
          <table className="w-full border-collapse text-sm">
            <tbody>
              {info.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="border-border border p-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {group.questions.map((q) => {
        const image = q.image ?? group.image;
        return (
          <Task key={q.n}>
            <QRow n={q.n}>
              <Hint>{t('questionN', { n: q.n })}</Hint>
              {image && <ExamImage media={image} className="mb-2 max-w-md" />}
              {group.type === 'READ_ALOUD' ? (
                <div className="bg-surface-secondary rounded-xl p-4 leading-7">
                  {q.prompt}
                </div>
              ) : (
                q.prompt && (
                  <Prompt>
                    <b>{q.prompt}</b>
                  </Prompt>
                )
              )}
              {review ? null : recordable ? (
                <IeltsRecorder q={q} audio={audio} />
              ) : (
                <Recorder q={q} />
              )}
            </QRow>
          </Task>
        );
      })}
    </>
  );
};

const WritePrompt = ({ q }: { q: QuestionView }) => {
  const { group } = useExamGroup();
  const prompt = q.prompt ?? '';

  if (group.type === 'WRITE_SENTENCE_PICTURE') {
    return (
      <div className="mb-2 flex flex-wrap gap-2">
        {prompt.split('/').map((word) => (
          <span
            key={word}
            className="bg-brand-navy-soft text-brand-navy rounded-full px-3 py-1 font-medium"
          >
            {word.trim()}
          </span>
        ))}
      </div>
    );
  }
  if (group.email) {
    const [head, ...rest] = prompt.split('\n\n');
    return (
      <div className="border-border mb-2 overflow-hidden rounded-xl border text-sm">
        <div className="border-border bg-surface-secondary border-b px-4 py-2.5 whitespace-pre-line">
          {head}
        </div>
        <div className="px-4 py-3 whitespace-pre-line">{rest.join('\n\n')}</div>
      </div>
    );
  }
  return (
    <Prompt>
      <b>{prompt}</b>
    </Prompt>
  );
};

export const WriteView = () => {
  const t = useTranslations('taking');
  const { group, answers, setAnswer, readOnly, review } = useExamGroup();
  const single = group.questions.length === 1;

  return group.questions.map((q) => {
    const seconds = q.content?.responseSeconds;
    const value = (answers[q.n] as string | undefined) ?? '';
    const image = q.image ?? group.image;
    const words = wordCount(value);
    const min = group.minWords;
    const reached = min != null && words >= min;
    const hint = [
      !single && t('questionN', { n: q.n }),
      seconds != null && t('timeAllowed', { time: mmss(seconds) }),
    ].filter(Boolean);
    const brief = (hint.length > 0 || q.prompt || image) && (
      <div
        className={cn(
          'flex min-w-0 flex-col gap-3',
          // The chart stays in view while the essay grows past it.
          image && 'lg:sticky lg:top-4 lg:self-start',
        )}
      >
        {hint.length > 0 && <Hint>{hint.join(' · ')}</Hint>}
        <WritePrompt q={q} />
        {image && <ZoomableImage media={image} />}
      </div>
    );
    return (
      <QRow key={q.n} n={q.n} bare={single}>
        <div
          className={cn(
            'grid gap-5',
            image && 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]',
          )}
        >
          {brief}
          <div className="border-border bg-surface focus-within:border-brand-navy focus-within:ring-brand-navy/15 flex min-w-0 flex-col rounded-xl border transition-[border-color,box-shadow] focus-within:ring-3">
            <textarea
              rows={Math.max(group.rows ?? 4, 12)}
              aria-label={t('answerLabel', { n: q.n })}
              placeholder={t('typeAnswer')}
              className={cn(
                // Grows with the essay so the page scrolls, not a box inside it; the floor fills the screen.
                'field-sizing-content min-h-[max(16rem,calc(100dvh-22rem))] w-full resize-none rounded-t-xl bg-transparent px-5 py-4 text-base leading-7 outline-none disabled:opacity-60',
                review && 'disabled:opacity-100',
              )}
              value={value}
              disabled={readOnly}
              onChange={(e) => setAnswer(q.n, e.target.value)}
            />
            <div className="border-separator bg-surface-secondary sticky bottom-0 z-[1] flex items-center gap-3 rounded-b-xl border-t px-5 py-2 text-xs">
              <span
                className={cn(
                  'font-medium tabular-nums',
                  reached ? 'text-success' : 'text-foreground',
                )}
              >
                {t('wordCount', { count: words })}
                {min != null && (
                  <span className="text-muted font-normal">
                    {` · ${t('minWords', { count: min })}`}
                  </span>
                )}
              </span>
              {min != null && (
                <div
                  aria-hidden
                  className="bg-default ml-auto h-1 w-24 overflow-hidden rounded-full"
                >
                  <div
                    className={cn(
                      'h-full rounded-full transition-[width]',
                      reached ? 'bg-success' : 'bg-brand-navy',
                    )}
                    style={{ width: `${Math.min(100, (words / min) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </QRow>
    );
  });
};
