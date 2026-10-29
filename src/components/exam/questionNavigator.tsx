'use client';

import { Button, cn, Drawer, useOverlayState } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import type { Answer } from '@/lib/exam/structure';
import type { StudentTestSectionDetail } from '@/types/student-test';

import { isAnswered, questionSlots } from '@/lib/exam/structure';

type QuestionNavigatorProps = {
  section: StudentTestSectionDetail;
  partId: number | null;
  activeQuestion: number | null;
  answers: Record<number, Answer>;
  flagged: number[];
  onSelect: (partId: number, from: number) => void;
  onStep: (dir: 1 | -1) => void;
  canPrev: boolean;
  canNext: boolean;
};

export type PartGroup = {
  id: number;
  title: string | null;
  index: number;
  numbers: { n: number; from: number; answered: boolean }[];
};

export function partGroups(
  section: StudentTestSectionDetail,
  answers: Record<number, Answer>,
) {
  const slots = questionSlots(section);
  const sizeOf = new Map<number, number>();
  for (const s of slots) sizeOf.set(s.from, (sizeOf.get(s.from) ?? 0) + 1);

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
          answered: isAnswered(answers[s.from], sizeOf.get(s.from) ?? 1),
        })),
    }));
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
        'relative grid h-9 min-w-9 place-items-center overflow-hidden rounded-lg border px-1 text-sm font-semibold tabular-nums transition-colors',
        answered
          ? 'border-brand-navy bg-brand-navy text-brand-navy-foreground'
          : 'border-field-border bg-surface text-foreground hover:bg-default',
        current && 'ring-foreground ring-offset-surface ring-2 ring-offset-2',
        className,
      )}
    >
      {n}
      {flagged && (
        <span
          aria-hidden
          className="border-t-warning absolute top-0 right-0 size-0 border-t-[12px] border-l-[12px] border-l-transparent"
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
  onSelect: (partId: number, from: number) => void;
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
              onClick={() => first && onSelect(group.id, first.from)}
              className="hover:bg-default h-10 rounded-lg px-3 text-sm font-semibold whitespace-nowrap disabled:opacity-50"
            >
              {title} <span className="text-muted font-normal">{progress}</span>
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
                'text-sm whitespace-nowrap',
                isCurrentPart ? 'font-bold' : 'text-muted font-medium',
              )}
            >
              {title} <span className="text-muted font-normal">{progress}</span>
            </span>
            <ul className="flex flex-wrap gap-1.5 p-0.5">
              {group.numbers.map(({ n, from, answered }) => {
                const isFlagged = flagged.includes(from);
                return (
                  <li key={n}>
                    <NavNumber
                      n={n}
                      answered={answered}
                      flagged={isFlagged}
                      current={isCurrentPart && from === current}
                      label={t('navQuestion', {
                        n,
                        status: answered ? 'answered' : 'unanswered',
                        flagged: isFlagged ? 'yes' : 'no',
                      })}
                      onPress={() => onSelect(group.id, from)}
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
  'border-field-border bg-surface hover:bg-default grid size-11 flex-none place-items-center rounded-lg border disabled:pointer-events-none disabled:opacity-50';

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
    current?.numbers.find((x) => x.from === activeQuestion)?.from ??
    current?.numbers[0]?.from ??
    null;

  const select = (id: number, from: number) => {
    drawer.close();
    onSelect(id, from);
  };

  return (
    <nav
      aria-label={t('questions')}
      className="border-border bg-surface flex flex-none items-center gap-4 border-t px-5 py-2.5"
    >
      <button
        type="button"
        aria-label={t('prevQuestion')}
        disabled={!canPrev}
        onClick={() => onStep(-1)}
        className={STEP_CLASS}
      >
        <LuChevronLeft aria-hidden className="size-5" />
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
        className="min-w-0 flex-1 justify-start md:hidden"
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
        <LuChevronRight aria-hidden className="size-5" />
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
