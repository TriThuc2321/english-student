'use client';

import { Button, cn, Drawer, useOverlayState } from '@heroui/react';
import { useTranslations } from 'next-intl';

import type { Answer } from '@/lib/exam/structure';
import type { StudentTestSectionDetail } from '@/types/student-test';

import { isAnswered, questionSlots } from '@/lib/exam/structure';

type QuestionNavigatorProps = {
  section: StudentTestSectionDetail;
  partId: number | null;
  answers: Record<number, Answer>;
  flagged: number[];
  onSelect: (partId: number, from: number) => void;
  onStep: (dir: 1 | -1) => void;
  canPrev: boolean;
  canNext: boolean;
};

type PartGroup = {
  id: number;
  title: string | null;
  index: number;
  numbers: { n: number; from: number; answered: boolean }[];
};

function usePartGroups(
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

type GridProps = {
  groups: PartGroup[];
  partId: number | null;
  flagged: number[];
  onSelect: (partId: number, from: number) => void;
};

function NumberGrid({ groups, partId, flagged, onSelect }: GridProps) {
  const t = useTranslations('taking');
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {groups.map((group) => (
        <div key={group.id} className="flex items-center gap-2">
          <span className="text-muted text-xs font-semibold whitespace-nowrap">
            {group.title ?? t('partFallback', { n: group.index + 1 })}
          </span>
          <div className="flex flex-wrap gap-1">
            {group.numbers.map(({ n, from, answered }) => {
              const isFlagged = flagged.includes(from);
              return (
                <button
                  key={n}
                  type="button"
                  data-answered={answered}
                  data-flagged={isFlagged || undefined}
                  aria-current={group.id === partId || undefined}
                  onClick={() => onSelect(group.id, from)}
                  className={cn(
                    'rounded-field relative grid size-8 place-items-center border text-xs font-semibold',
                    answered
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border bg-surface text-foreground',
                    group.id === partId && !answered && 'border-accent',
                  )}
                >
                  {n}
                  {isFlagged && (
                    <span className="bg-warning absolute -top-1 -right-1 size-2.5 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuestionNavigator({
  section,
  partId,
  answers,
  flagged,
  onSelect,
  onStep,
  canPrev,
  canNext,
}: QuestionNavigatorProps) {
  const t = useTranslations('taking');
  const drawer = useOverlayState();
  const groups = usePartGroups(section, answers);
  const current = groups.find((g) => g.id === partId) ?? groups[0];
  const answered = current?.numbers.filter((x) => x.answered).length ?? 0;

  const select = (id: number, from: number) => {
    drawer.close();
    onSelect(id, from);
  };

  return (
    <nav className="border-border bg-surface flex items-center gap-3 border-t px-4 py-2">
      <div className="hidden min-w-0 flex-1 md:block">
        <NumberGrid
          groups={groups}
          partId={partId}
          flagged={flagged}
          onSelect={onSelect}
        />
      </div>
      <Button
        variant="secondary"
        className="min-w-0 flex-1 justify-start md:hidden"
        onPress={drawer.open}
      >
        {current &&
          `${current.title ?? t('partFallback', { n: current.index + 1 })} · ${t('answeredCount', { answered, total: current.numbers.length })}`}
      </Button>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="secondary"
          isDisabled={!canPrev}
          onPress={() => onStep(-1)}
        >
          {t('prev')}
        </Button>
        <Button isDisabled={!canNext} onPress={() => onStep(1)}>
          {t('next')}
        </Button>
      </div>
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
