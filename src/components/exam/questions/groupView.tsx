'use client';

import { cn } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { LuCheck } from 'react-icons/lu';

import type { ViewKind } from '@/lib/exam/question-views';
import type { Answer } from '@/lib/exam/structure';
import type { ReviewItem } from '@/lib/results/view';
import type { StudentQuestionGroup } from '@/types/student-test';

import { toGroupView, type GroupViewModel } from '@/lib/exam/group-view';
import { isAnswered } from '@/lib/exam/structure';

import {
  ExamGroupContext,
  questionAnchorId,
  type ExamGroupContextValue,
  type GroupReview,
} from './context';
import { PassagePane } from './parts';
import { ReviewNote } from './reviewNote';
import { VIEWS } from './views';

// Views that place their answers inline in text or tables, with no row to hang a review note on.
const INLINE_VIEWS = new Set<ViewKind>([
  'template',
  'sentence',
  'summary',
  'table',
  'diagram',
  'map',
]);

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
  // Set to show a graded attempt back; keyed by question id.
  review?: Record<number, ReviewItem[]>;
  // The part heading already names and instructs this group.
  headless?: boolean;
};

export function GroupView({
  group,
  answers,
  setAnswer,
  readOnly,
  flagged,
  toggleFlag,
  review,
  headless = false,
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
      review: review && groupReview(view.questions, review),
    };
  }, [view, answers, setAnswer, readOnly, flagged, toggleFlag, review]);

  let total = 0;
  let done = 0;
  for (const q of view.questions) {
    if (review) {
      // In review the chip counts right answers among the auto-marked numbers.
      for (const item of review[q.id] ?? []) {
        if (item.status === 'pending' || item.status === 'graded') continue;
        total += 1;
        if (item.status === 'correct') done += 1;
      }
      continue;
    }
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
        aria-labelledby={title && !headless ? headingId : undefined}
        // clip, not hidden: hidden would make this the scroller and break the sticky editor footer.
        className={cn(
          'bg-surface shadow-surface flex min-w-0 flex-col gap-3 overflow-clip rounded-2xl pb-4',
          headless && 'pt-4',
        )}
      >
        {!headless && (
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
              {total > 0 && view.view !== 'write' && (
                <span
                  className={cn(
                    'ml-auto flex flex-none items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                    done === total
                      ? 'bg-success/15 text-success'
                      : 'bg-default text-muted',
                  )}
                >
                  {done === total && <LuCheck aria-hidden className="size-3" />}
                  {review
                    ? t('groupCorrect', { correct: done, total })
                    : t('groupAnswered', { answered: done, total })}
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
        )}
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
        {review && INLINE_VIEWS.has(view.view) && (
          <ul
            aria-label={t('groupReview')}
            className="border-separator divide-separator mx-3 flex flex-col divide-y border-t sm:mx-4"
          >
            {view.questions.map((q) => (
              <li key={q.n} className="pb-3">
                <ReviewNote n={q.n} numbered />
              </li>
            ))}
          </ul>
        )}
      </section>
    </ExamGroupContext.Provider>
  );
}

function groupReview(
  questions: GroupViewModel['questions'],
  review: Record<number, ReviewItem[]>,
): GroupReview {
  const byNumber = new Map<number, ReviewItem>();
  for (const q of questions) {
    for (const item of review[q.id] ?? []) byNumber.set(item.n, item);
  }
  return {
    item: (n) => byNumber.get(n),
    question: (n) => {
      const id = byNumber.get(n)?.questionId;
      return id === undefined ? [] : (review[id] ?? []);
    },
  };
}
