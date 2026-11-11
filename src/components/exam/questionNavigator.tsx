'use client';

import { Button, cn, Drawer, useOverlayState } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { LuCheck, LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import type { Answer } from '@/lib/exam/structure';
import type { StudentTestSectionDetail } from '@/types/student-test';

import { QUESTION_VIEWS } from '@/lib/exam/question-views';
import { isAnswered, questionSlots } from '@/lib/exam/structure';
import { wordCount } from '@/lib/exam/word-count';

type QuestionNavigatorProps = {
  section: StudentTestSectionDetail;
  partId: number | null;
  // Question ids, like the exam state.
  activeQuestion: number | null;
  answers: Record<number, Answer>;
  flagged: number[];
  onSelect: (partId: number, questionId: number) => void;
  onStep: (dir: 1 | -1) => void;
  canPrev: boolean;
  canNext: boolean;
};

export type PartGroup = {
  id: number;
  title: string | null;
  index: number;
  numbers: { n: number; from: number; questionId: number; answered: boolean }[];
};

export function partGroups(
  section: StudentTestSectionDetail,
  answers: Record<number, Answer>,
) {
  const slots = questionSlots(section);
  const sizeOf = new Map<number, number>();
  for (const s of slots) {
    sizeOf.set(s.questionId, (sizeOf.get(s.questionId) ?? 0) + 1);
  }

  return [...section.testParts]
    .sort((a, b) => a.order - b.order)
    .map((part, index): PartGroup => ({
      id: part.id,
      title: part.title,
      index,
      numbers: slots
        .filter((s) => s.partId === part.id)
        .map((s) => ({
          n: s.n,
          from: s.from,
          questionId: s.questionId,
          answered: isAnswered(
            answers[s.questionId],
            sizeOf.get(s.questionId) ?? 1,
          ),
        })),
    }));
}

type WritingTask = {
  partId: number;
  questionId: number;
  title: string | null;
  index: number;
  words: number;
  min: number | null;
};

// Null unless every part is a single essay, where a grid of one number per part says nothing.
export function writingTasks(
  section: StudentTestSectionDetail,
  answers: Record<number, Answer>,
): WritingTask[] | null {
  const parts = [...section.testParts].sort((a, b) => a.order - b.order);
  const tasks: WritingTask[] = [];
  for (const [index, part] of parts.entries()) {
    const questions = part.questionGroups.flatMap((g) =>
      g.questions.map((q) => ({ q, hints: QUESTION_VIEWS[g.questionType] })),
    );
    if (questions.length !== 1 || questions[0].hints.view !== 'write') {
      return null;
    }
    const { q, hints } = questions[0];
    const answer = answers[q.id];
    tasks.push({
      partId: part.id,
      questionId: q.id,
      title: part.title,
      index,
      words: typeof answer === 'string' ? wordCount(answer) : 0,
      min: hints.minWords ?? null,
    });
  }
  return tasks.length > 0 ? tasks : null;
}

function TaskTabs({
  tasks,
  partId,
  flagged,
  onSelect,
}: {
  tasks: WritingTask[];
  partId: number | null;
  flagged: number[];
  onSelect: (partId: number, questionId: number) => void;
}) {
  const t = useTranslations('taking');
  return (
    <ul className="bg-default mx-auto flex w-full max-w-xl gap-1 rounded-full p-1">
      {tasks.map((task) => {
        const current = task.partId === partId;
        const reached = task.min !== null && task.words >= task.min;
        const isFlagged = flagged.includes(task.questionId);
        return (
          <li key={task.partId} className="min-w-0 flex-1">
            <button
              type="button"
              aria-current={current || undefined}
              onClick={() => onSelect(task.partId, task.questionId)}
              className={cn(
                'relative flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-full px-3 text-sm transition-colors',
                current
                  ? 'bg-surface shadow-surface font-semibold'
                  : 'text-muted hover:text-foreground font-medium',
              )}
            >
              <span className="truncate">
                {task.title ?? t('partFallback', { n: task.index + 1 })}
              </span>
              <span
                className={cn(
                  'flex flex-none items-center gap-1 text-xs font-normal tabular-nums',
                  reached ? 'text-success' : 'text-muted',
                )}
              >
                {reached && <LuCheck aria-hidden className="size-3.5" />}
                {task.min === null
                  ? t('wordCount', { count: task.words })
                  : t('taskWords', { count: task.words, min: task.min })}
              </span>
              {isFlagged && (
                <span
                  aria-label={t('flagged')}
                  className="bg-warning ring-surface absolute top-1 right-2 size-2 rounded-full ring-2"
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function NavNumber({
  n,
  answered,
  flagged,
  current = false,
  label,
  onPress,
  className,
}: {
  n: number;
  answered: boolean;
  flagged: boolean;
  current?: boolean;
  label: string;
  onPress: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-answered={answered}
      data-flagged={flagged || undefined}
      aria-current={current || undefined}
      aria-label={label}
      onClick={onPress}
      className={cn(
        'relative grid h-8 min-w-8 place-items-center rounded-lg px-1 text-[13px] font-medium tabular-nums transition-colors',
        answered
          ? 'bg-brand-navy text-brand-navy-foreground'
          : 'bg-default text-foreground hover:bg-surface-tertiary',
        current && 'ring-brand-navy ring-offset-surface ring-2 ring-offset-2',
        className,
      )}
    >
      {n}
      {flagged && (
        <span
          aria-hidden
          className="bg-warning ring-surface absolute -top-1 -right-1 size-2.5 rounded-full ring-2"
        />
      )}
    </button>
  );
}

type GridProps = {
  groups: PartGroup[];
  partId: number | null;
  current: number | null;
  flagged: number[];
  onSelect: (partId: number, questionId: number) => void;
  // Collapsed: only the current part shows its numbers; the others become a single jump button.
  collapsed?: boolean;
};

function NumberGrid({
  groups,
  partId,
  current,
  flagged,
  onSelect,
  collapsed = false,
}: GridProps) {
  const t = useTranslations('taking');
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {groups.map((group) => {
        const title = group.title ?? t('partFallback', { n: group.index + 1 });
        const isCurrentPart = group.id === partId;
        const progress = t('partProgress', {
          answered: group.numbers.filter((x) => x.answered).length,
          total: group.numbers.length,
        });
        const first = group.numbers[0];

        if (collapsed && !isCurrentPart) {
          return (
            <button
              key={group.id}
              type="button"
              disabled={!first}
              onClick={() => first && onSelect(group.id, first.questionId)}
              className="hover:bg-default text-muted hover:text-foreground flex h-8 items-center gap-2 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50"
            >
              {title}
              <span className="text-xs font-normal tabular-nums">
                {progress}
              </span>
            </button>
          );
        }

        return (
          <div
            key={group.id}
            data-current-part={isCurrentPart || undefined}
            className="flex flex-wrap items-center gap-3"
          >
            <span
              className={cn(
                'flex items-baseline gap-2 text-sm whitespace-nowrap',
                isCurrentPart ? 'font-semibold' : 'text-muted font-medium',
              )}
            >
              {title}
              <span className="text-muted text-xs font-normal tabular-nums">
                {progress}
              </span>
            </span>
            <ul className="flex flex-wrap gap-1.5 p-1">
              {group.numbers.map(({ n, questionId, answered }) => {
                const isFlagged = flagged.includes(questionId);
                return (
                  <li key={`${questionId}-${n}`}>
                    <NavNumber
                      n={n}
                      answered={answered}
                      flagged={isFlagged}
                      current={isCurrentPart && questionId === current}
                      label={t('navQuestion', {
                        n,
                        status: answered ? 'answered' : 'unanswered',
                        flagged: isFlagged ? 'yes' : 'no',
                      })}
                      onPress={() => onSelect(group.id, questionId)}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

const STEP_CLASS =
  'border-border bg-surface hover:bg-default grid size-9 flex-none place-items-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-40';

export function QuestionNavigator({
  section,
  partId,
  activeQuestion,
  answers,
  flagged,
  onSelect,
  onStep,
  canPrev,
  canNext,
}: QuestionNavigatorProps) {
  const t = useTranslations('taking');
  const drawer = useOverlayState();
  const groups = partGroups(section, answers);
  const current = groups.find((g) => g.id === partId) ?? groups[0];
  const answered = current?.numbers.filter((x) => x.answered).length ?? 0;
  const currentQuestion =
    current?.numbers.find((x) => x.questionId === activeQuestion)?.questionId ??
    current?.numbers[0]?.questionId ??
    null;

  const select = (id: number, questionId: number) => {
    drawer.close();
    onSelect(id, questionId);
  };

  const tasks = writingTasks(section, answers);
  if (tasks) {
    return (
      <nav
        aria-label={t('tasks')}
        className="border-separator bg-surface flex flex-none items-center border-t px-4 py-2 md:px-5"
      >
        <TaskTabs
          tasks={tasks}
          partId={partId}
          flagged={flagged}
          onSelect={onSelect}
        />
      </nav>
    );
  }

  return (
    <nav
      aria-label={t('questions')}
      className="border-separator bg-surface flex flex-none items-center gap-3 border-t px-4 py-2 md:gap-4 md:px-5"
    >
      <button
        type="button"
        aria-label={t('prevQuestion')}
        disabled={!canPrev}
        onClick={() => onStep(-1)}
        className={STEP_CLASS}
      >
        <LuChevronLeft aria-hidden className="size-4.5" />
      </button>
      <div className="hidden min-w-0 flex-1 md:block">
        <NumberGrid
          groups={groups}
          partId={partId}
          current={currentQuestion}
          flagged={flagged}
          onSelect={onSelect}
          collapsed
        />
      </div>
      <Button
        variant="secondary"
        className="min-w-0 flex-1 justify-start rounded-full md:hidden"
        onPress={drawer.open}
      >
        {current &&
          `${current.title ?? t('partFallback', { n: current.index + 1 })} · ${t('partProgress', { answered, total: current.numbers.length })}`}
      </Button>
      <button
        type="button"
        aria-label={t('nextQuestion')}
        disabled={!canNext}
        onClick={() => onStep(1)}
        className={STEP_CLASS}
      >
        <LuChevronRight aria-hidden className="size-4.5" />
      </button>
      <Drawer.Backdrop isOpen={drawer.isOpen} onOpenChange={drawer.setOpen}>
        <Drawer.Content placement="bottom">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Handle />
            <Drawer.Header>
              <Drawer.Heading>{t('questions')}</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <NumberGrid
                groups={groups}
                partId={partId}
                current={currentQuestion}
                flagged={flagged}
                onSelect={select}
              />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </nav>
  );
}
