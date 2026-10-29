'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import type { Answer } from '@/lib/exam/structure';
import type { StudentQuestionGroup } from '@/types/student-test';

import { toGroupView } from '@/lib/exam/group-view';
import { isAnswered } from '@/lib/exam/structure';

import { ExamGroupContext } from './context';
import { PassagePane } from './parts';
import { VIEWS } from './views';

const KEYWORDS =
  /\b(ONE|TWO|THREE|NO MORE THAN|AND\/OR A NUMBER|ONLY|TRUE|FALSE|NOT GIVEN|YES|NO)\b/;

const Instruction = ({ text }: { text: string }) => (
  <p className="text-muted whitespace-pre-line">
    {text.split(KEYWORDS).map((part, i) =>
      i % 2 ? (
        <b key={i} className="text-foreground font-semibold">
          {part}
        </b>
      ) : (
        part
      ),
    )}
  </p>
);

type GroupViewProps = {
  group: StudentQuestionGroup;
  answers: Record<number, Answer>;
  setAnswer: (n: number, value: Answer) => void;
  readOnly: boolean;
  flagged: number[];
  toggleFlag: (n: number) => void;
};

export function GroupView({
  group,
  answers,
  setAnswer,
  readOnly,
  flagged,
  toggleFlag,
}: GroupViewProps) {
  const t = useTranslations('taking');
  const view = useMemo(() => toGroupView(group), [group]);
  const View = VIEWS[view.view];

  const from = view.questions[0]?.n;
  const lastQuestion = view.questions.at(-1);
  const to = lastQuestion && Math.max(lastQuestion.n, lastQuestion.nTo);
  const range =
    from == null || to == null
      ? undefined
      : from === to
        ? `${from}`
        : `${from}–${to}`;

  let total = 0;
  let done = 0;
  for (const q of view.questions) {
    const size = Math.max(q.nTo, q.n) - q.n + 1;
    total += size;
    if (isAnswered(answers[q.n], size)) done += size;
  }
  const headingId = `group-${group.id}-heading`;

  return (
    <ExamGroupContext.Provider
      value={{ group: view, answers, setAnswer, readOnly, flagged, toggleFlag }}
    >
      <section
        aria-labelledby={range ? headingId : undefined}
        className="bg-surface border-separator shadow-surface flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border pb-4"
      >
        <header className="bg-brand-navy-soft flex flex-col gap-1 px-5 py-4">
          <div className="flex items-center justify-between gap-3 text-xs leading-4">
            <span className="text-brand-navy font-semibold tracking-[.08em] uppercase">
              {t(`questionType.${view.type}`)}
            </span>
            {total > 0 && (
              <span className="text-muted">
                {t('groupAnswered', { answered: done, total })}
              </span>
            )}
          </div>
          {range && (
            <h3 id={headingId} className="text-lg leading-[26px] font-bold">
              {t('questionsRange', { range })}
            </h3>
          )}
          {view.instruction && <Instruction text={view.instruction} />}
        </header>
        {view.passages.map((passage, i) => (
          <PassagePane
            key={i}
            passage={passage}
            className="bg-surface-secondary mx-3 max-h-none rounded-[10px] border-0 px-[18px] py-3.5 sm:mx-4 md:border-r-0"
          />
        ))}
        <div className="min-w-0 px-2 sm:px-3">
          <View />
        </div>
      </section>
    </ExamGroupContext.Provider>
  );
}
