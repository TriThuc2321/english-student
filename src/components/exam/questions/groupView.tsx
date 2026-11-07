'use client';

import { cn } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { LuCheck } from 'react-icons/lu';

import type { Answer } from '@/lib/exam/structure';
import type { StudentQuestionGroup } from '@/types/student-test';

import { toGroupView } from '@/lib/exam/group-view';
import { isAnswered } from '@/lib/exam/structure';

import {
  ExamGroupContext,
  questionAnchorId,
  type ExamGroupContextValue,
} from './context';
import { PassagePane } from './parts';
import { VIEWS } from './views';

const KEYWORDS =
  /\b(ONE|TWO|THREE|NO MORE THAN|AND\/OR A NUMBER|ONLY|TRUE|FALSE|NOT GIVEN|YES|NO)\b/;

const Instruction = ({ text }: { text: string }) => (
  <p className="text-muted text-sm leading-relaxed whitespace-pre-line">
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

// answers, flagged and the callbacks are keyed by question id, like the exam state.
type GroupViewProps = {
  group: StudentQuestionGroup;
  answers: Record<number, Answer>;
  setAnswer: (questionId: number, value: Answer) => void;
  readOnly: boolean;
  flagged: number[];
  toggleFlag: (questionId: number) => void;
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

  const context = useMemo((): ExamGroupContextValue => {
    const idOf = new Map(view.questions.map((q) => [q.n, q.id]));
    const byNumber: Record<number, Answer> = {};
    for (const q of view.questions) {
      if (answers[q.id] !== undefined) byNumber[q.n] = answers[q.id];
    }
    return {
      group: view,
      answers: byNumber,
      // A template blank with no matching question has nowhere to save to.
      setAnswer: (n, value) => {
        const id = idOf.get(n);
        if (id !== undefined) setAnswer(id, value);
      },
      readOnly,
      flagged: view.questions
        .filter((q) => flagged.includes(q.id))
        .map((q) => q.n),
      toggleFlag: (n) => {
        const id = idOf.get(n);
        if (id !== undefined) toggleFlag(id);
      },
      anchorId: (n) => {
        const id = idOf.get(n);
        return id === undefined
          ? `blank-${view.id}-${n}`
          : questionAnchorId(id);
      },
    };
  }, [view, answers, setAnswer, readOnly, flagged, toggleFlag]);

  let total = 0;
  let done = 0;
  for (const q of view.questions) {
    const size = Math.max(q.nTo, q.n) - q.n + 1;
    total += size;
    if (isAnswered(answers[q.id], size)) done += size;
  }
  const headingId = `group-${group.id}-heading`;
  // A lone writing/speaking task is already named by its type; "Questions 1" adds nothing.
  const taskLike =
    (view.view === 'write' || view.view === 'speak') &&
    view.questions.length === 1;
  const typeLabel = t(`questionType.${view.type}`);
  const title = taskLike
    ? typeLabel
    : range &&
      (from === to
        ? t('questionN', { n: range })
        : t('questionsRange', { range }));

  return (
    <ExamGroupContext.Provider value={context}>
      <section
        aria-labelledby={title ? headingId : undefined}
        className="bg-surface shadow-surface flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl pb-4"
      >
        <header className="border-separator flex flex-col gap-1.5 border-b px-5 pt-4 pb-4">
          <div className="flex items-center justify-between gap-3">
            {taskLike ? (
              <h3
                id={headingId}
                className="text-lg leading-snug font-semibold tracking-tight"
              >
                {title}
              </h3>
            ) : (
              <span className="eyebrow">{typeLabel}</span>
            )}
            {total > 0 && (
              <span
                className={cn(
                  'ml-auto flex flex-none items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                  done === total
                    ? 'bg-success/15 text-success'
                    : 'bg-default text-muted',
                )}
              >
                {done === total && <LuCheck aria-hidden className="size-3" />}
                {t('groupAnswered', { answered: done, total })}
              </span>
            )}
          </div>
          {title && !taskLike && (
            <h3
              id={headingId}
              className="text-lg leading-snug font-semibold tracking-tight"
            >
              {title}
            </h3>
          )}
          {view.instruction && <Instruction text={view.instruction} />}
        </header>
        {view.passages.map((passage, i) => (
          <PassagePane
            key={i}
            passage={passage}
            className="bg-surface-secondary mx-3 max-h-none rounded-xl border-0 px-5 py-4 sm:mx-4 md:border-r-0"
          />
        ))}
        <div className="min-w-0 px-2 sm:px-3">
          <View />
        </div>
      </section>
    </ExamGroupContext.Provider>
  );
}
