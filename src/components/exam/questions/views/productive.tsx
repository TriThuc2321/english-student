import { Tooltip } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { LuMic } from 'react-icons/lu';

import type { QuestionView } from '@/lib/exam/group-view';

import { useExamGroup } from '../context';
import { ExamImage } from '../media';
import { Hint, mmss, Prompt, QRow } from '../parts';
import { GroupAudio } from './groupMedia';

const Task = ({ children }: { children: React.ReactNode }) => (
  <div className="border-border rounded-field mb-3 border p-4">{children}</div>
);

const wordCount = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

const Recorder = ({ q }: { q: QuestionView }) => {
  const t = useTranslations('taking');
  const prep = q.content?.prepSeconds ?? 0;
  const response = q.content?.responseSeconds ?? 0;
  return (
    <div className="bg-default rounded-field mt-3 flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
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
  const { group } = useExamGroup();
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
                <div className="bg-default/50 rounded-field p-3 leading-7">
                  {q.prompt}
                </div>
              ) : (
                q.prompt && (
                  <Prompt>
                    <b>{q.prompt}</b>
                  </Prompt>
                )
              )}
              <Recorder q={q} />
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
            className="bg-accent-soft text-accent-soft-foreground rounded-field px-3 py-1 font-semibold"
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
      <div className="border-border rounded-field mb-2 border text-sm">
        <div className="border-border bg-default/50 border-b px-3 py-2 whitespace-pre-line">
          {head}
        </div>
        <div className="px-3 py-2 whitespace-pre-line">{rest.join('\n\n')}</div>
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
  const { group, answers, setAnswer, readOnly } = useExamGroup();

  return group.questions.map((q) => {
    const seconds = q.content?.responseSeconds;
    const value = (answers[q.n] as string | undefined) ?? '';
    const image = q.image ?? group.image;
    return (
      <Task key={q.n}>
        <QRow n={q.n}>
          <Hint>
            {t('questionN', { n: q.n })}
            {seconds != null &&
              ` · ${t('timeAllowed', { time: mmss(seconds) })}`}
          </Hint>
          {image && <ExamImage media={image} className="mb-2 max-w-sm" />}
          <WritePrompt q={q} />
          <textarea
            rows={group.rows ?? 4}
            aria-label={t('answerLabel', { n: q.n })}
            placeholder={t('typeAnswer')}
            className="border-border bg-surface focus:border-accent rounded-field w-full border p-2 text-sm outline-none disabled:opacity-60"
            value={value}
            disabled={readOnly}
            onChange={(e) => setAnswer(q.n, e.target.value)}
          />
          <div className="text-muted mt-1 text-xs">
            {t('wordCount', { count: wordCount(value) })}
            {group.minWords != null &&
              ` · ${t('minWords', { count: group.minWords })}`}
          </div>
        </QRow>
      </Task>
    );
  });
};
