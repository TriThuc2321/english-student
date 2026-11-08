'use client';

import type { IconType } from 'react-icons';

import { Button, cn, Drawer, useOverlayState } from '@heroui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  LuBookOpen,
  LuChevronLeft,
  LuChevronRight,
  LuHeadphones,
  LuMic,
  LuPenLine,
  LuSkipForward,
} from 'react-icons/lu';

import type { FocusRequest } from '@/components/exam/partView';
import type {
  ReviewModel,
  ReviewPosition,
  ReviewSlot,
} from '@/lib/results/review';
import type { ExamType } from '@/types/student-test';

import { PartView } from '@/components/exam/partView';
import { BADGE_CLASSES, isMiss } from '@/components/results/status';
import { ROUTES } from '@/constants/routes';
import { partSequence } from '@/lib/exam/structure';
import {
  partAssessment,
  partTranscripts,
  reviewSlots,
} from '@/lib/results/review';

const SKILL_ICON: Record<string, IconType> = {
  LISTENING: LuHeadphones,
  READING: LuBookOpen,
  WRITING: LuPenLine,
  SPEAKING: LuMic,
};

const noop = () => {};

type Focus = FocusRequest & { sectionId: number; partId: number | null };

type ReviewRunnerProps = {
  model: ReviewModel;
  initial: ReviewPosition;
};

export function ReviewRunner({ model, initial }: ReviewRunnerProps) {
  const { test } = model;
  const [position, setPosition] = useState({
    sectionId: initial.sectionId,
    partId: initial.partId,
  });
  const [focus, setFocus] = useState<Focus | null>(
    initial.questionId === null
      ? null
      : { ...initial, questionId: initial.questionId, seq: 1 },
  );
  const [active, setActive] = useState<number | null>(initial.questionId);

  const sequence = useMemo(() => partSequence(test), [test]);
  const slots = useMemo(() => reviewSlots(model), [model]);

  const sections = test.testSections;
  const section =
    sections.find((s) => s.id === position.sectionId) ?? sections[0];
  const parts = [...(section?.testParts ?? [])].sort(
    (a, b) => a.order - b.order,
  );
  const partIndex = parts.findIndex((p) => p.id === position.partId);
  const part = parts[partIndex] ?? parts[0] ?? null;
  const reviewSection = model.sections.find((s) => s.sectionId === section?.id);
  const at = sequence.findIndex(
    (ref) => ref.sectionId === section?.id && ref.partId === part?.id,
  );

  const goTo = (
    sectionId: number,
    partId: number | null,
    questionId?: number,
  ) => {
    setPosition({ sectionId, partId });
    if (questionId === undefined) {
      setFocus(null);
      setActive(null);
      return;
    }
    setActive(questionId);
    setFocus((prev) => ({
      sectionId,
      partId,
      questionId,
      seq: (prev?.seq ?? 0) + 1,
    }));
  };

  const step = (dir: 1 | -1) => {
    const next = sequence[at + dir];
    if (next) goTo(next.sectionId, next.partId);
  };

  // Starts after the question in view, or at the top of the part when none is.
  const nextMiss = () => {
    const lastOfActive =
      active === null
        ? slots.findIndex(
            (s) => s.sectionId === section?.id && s.partId === part?.id,
          ) - 1
        : slots.findLastIndex((s) => s.questionId === active);
    const ordered = [
      ...slots.slice(lastOfActive + 1),
      ...slots.slice(0, lastOfActive + 1),
    ];
    const target = ordered.find(
      (s) => isMiss(s.status) && s.questionId !== active,
    );
    if (target) goTo(target.sectionId, target.partId, target.questionId);
  };
  const hasMiss = slots.some(
    (s) => isMiss(s.status) && s.questionId !== active,
  );

  if (!section) return null;

  return (
    <div className="bg-background flex h-dvh flex-col">
      <ReviewHeader
        title={test.title}
        examType={test.examType}
        exitHref={ROUTES.attemptResult(model.attemptId)}
        sections={model.sections}
        sectionId={section.id}
        onSection={(id) => {
          const first = sequence.find((ref) => ref.sectionId === id);
          if (first) goTo(first.sectionId, first.partId);
        }}
        onNextMiss={hasMiss ? nextMiss : null}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <PartView
          key={`${section.id}-${part?.id ?? 'none'}`}
          part={part}
          index={Math.max(partIndex, 0)}
          answers={model.answers}
          onAnswer={noop}
          readOnly
          flagged={[]}
          onToggleFlag={noop}
          focusRequest={
            focus?.sectionId === section.id && focus.partId === part?.id
              ? focus
              : null
          }
          onActiveQuestion={setActive}
          review={
            part
              ? {
                  items: model.items,
                  transcripts: partTranscripts(
                    part,
                    reviewSection?.transcripts ?? [],
                  ),
                  assessment: partAssessment(
                    reviewSection?.assessment ?? null,
                    part.id,
                    part.id === parts[0]?.id,
                  ),
                }
              : undefined
          }
        />
      </div>
      <ReviewNavigator
        parts={parts.map((p, index) => ({
          id: p.id,
          title: p.title,
          index,
          slots: slots.filter(
            (s) => s.sectionId === section.id && s.partId === p.id,
          ),
        }))}
        partId={part?.id ?? null}
        active={active}
        onSelect={(partId, questionId) => goTo(section.id, partId, questionId)}
        onStep={step}
        canPrev={at > 0}
        canNext={at !== -1 && at < sequence.length - 1}
      />
    </div>
  );
}

function ReviewHeader({
  title,
  examType,
  exitHref,
  sections,
  sectionId,
  onSection,
  onNextMiss,
}: {
  title: string;
  examType: ExamType;
  exitHref: string;
  sections: ReviewModel['sections'];
  sectionId: number;
  onSection: (sectionId: number) => void;
  onNextMiss: (() => void) | null;
}) {
  const t = useTranslations();
  return (
    <header className="border-separator bg-surface flex flex-none flex-wrap items-center gap-x-5 gap-y-2 border-b px-4 py-2 md:px-5">
      <div className="flex min-w-0 flex-[1_1_260px] items-center gap-2">
        <Link
          href={exitHref}
          aria-label={t('review.backToResult')}
          className="text-muted hover:text-foreground hover:bg-default -ml-1.5 grid size-9 flex-none place-items-center rounded-full transition-colors"
        >
          <LuChevronLeft aria-hidden className="size-5" />
        </Link>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-sm font-semibold">{title}</h1>
          <span className="text-muted text-xs">
            {t(`exam.${examType}`)} · {t('review.title')}
          </span>
        </div>
      </div>
      {sections.length > 1 && (
        <nav
          aria-label={t('results.sectionsLabel')}
          className="bg-default flex items-center gap-0.5 rounded-full p-[3px]"
        >
          {sections.map((s) => {
            const Icon = SKILL_ICON[s.skill] ?? LuBookOpen;
            const current = s.sectionId === sectionId;
            return (
              <button
                key={s.sectionId}
                type="button"
                aria-pressed={current}
                onClick={() => onSection(s.sectionId)}
                className={cn(
                  'text-muted flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors',
                  current
                    ? 'bg-segment text-foreground shadow-surface'
                    : 'hover:text-foreground',
                )}
              >
                <Icon aria-hidden className="size-3.5" />
                <span className="hidden sm:inline">
                  {t(`exam.skill.${s.skill}`)}
                </span>
                {s.scaledScore !== null && (
                  <span className="text-xs tabular-nums">
                    {examType.startsWith('IELTS')
                      ? s.scaledScore.toFixed(1)
                      : s.scaledScore}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
      <Button
        variant="secondary"
        size="sm"
        isDisabled={!onNextMiss}
        onPress={() => onNextMiss?.()}
        className="rounded-full"
      >
        <LuSkipForward aria-hidden className="size-4" />
        {t('review.nextMiss')}
      </Button>
    </header>
  );
}

type NavPart = {
  id: number;
  title: string | null;
  index: number;
  slots: ReviewSlot[];
};

const STEP_CLASS =
  'border-border bg-surface hover:bg-default grid size-9 flex-none place-items-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-40';

function ReviewNavigator({
  parts,
  partId,
  active,
  onSelect,
  onStep,
  canPrev,
  canNext,
}: {
  parts: NavPart[];
  partId: number | null;
  active: number | null;
  onSelect: (partId: number, questionId: number) => void;
  onStep: (dir: 1 | -1) => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  const t = useTranslations();
  const drawer = useOverlayState();
  const current = parts.find((p) => p.id === partId) ?? parts[0];
  // Writing/Speaking slots are marked by a person and can never be "correct",
  // so they stay out of the count, matching the group chip in groupView.
  const correctOf = (p: NavPart) => {
    const marked = p.slots.filter(
      (s) => s.status !== 'pending' && s.status !== 'graded',
    );
    if (marked.length === 0) return null;
    return t('taking.groupCorrect', {
      correct: marked.filter((s) => s.status === 'correct').length,
      total: marked.length,
    });
  };
  const titleOf = (p: NavPart) =>
    p.title ?? t('taking.partFallback', { n: p.index + 1 });

  const grid = (collapsed: boolean, select: typeof onSelect) => (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {parts.map((p) => {
        const isCurrent = p.id === current?.id;
        const first = p.slots[0];
        if (collapsed && !isCurrent) {
          return (
            <button
              key={p.id}
              type="button"
              disabled={!first}
              onClick={() => first && select(p.id, first.questionId)}
              className="hover:bg-default text-muted hover:text-foreground flex h-8 items-center gap-2 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50"
            >
              {titleOf(p)}
              <span className="text-xs font-normal tabular-nums">
                {correctOf(p)}
              </span>
            </button>
          );
        }
        return (
          <div key={p.id} className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                'flex items-baseline gap-2 text-sm whitespace-nowrap',
                isCurrent ? 'font-semibold' : 'text-muted font-medium',
              )}
            >
              {titleOf(p)}
              <span className="text-muted text-xs font-normal tabular-nums">
                {correctOf(p)}
              </span>
            </span>
            <ul className="flex flex-wrap gap-1.5 p-1">
              {p.slots.map((s) => (
                <li key={`${s.questionId}-${s.n}`}>
                  <button
                    type="button"
                    aria-current={
                      (isCurrent && s.questionId === active) || undefined
                    }
                    aria-label={t('results.questionAria', {
                      n: s.n,
                      status: t(`results.status.${s.status}`),
                    })}
                    onClick={() => select(p.id, s.questionId)}
                    className={cn(
                      'grid h-8 min-w-8 place-items-center rounded-lg px-1 text-[13px] font-medium tabular-nums transition-opacity hover:opacity-80',
                      BADGE_CLASSES[s.status],
                      s.status === 'blank' &&
                        'border-field-border border border-dashed',
                      isCurrent &&
                        s.questionId === active &&
                        'ring-foreground ring-offset-surface ring-2 ring-offset-2',
                    )}
                  >
                    {s.n}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );

  return (
    <nav
      aria-label={t('taking.questions')}
      className="border-separator bg-surface flex flex-none items-center gap-3 border-t px-4 py-2 md:gap-4 md:px-5"
    >
      <button
        type="button"
        aria-label={t('review.prevPart')}
        disabled={!canPrev}
        onClick={() => onStep(-1)}
        className={STEP_CLASS}
      >
        <LuChevronLeft aria-hidden className="size-4.5" />
      </button>
      <div className="hidden min-w-0 flex-1 md:block">
        {grid(true, onSelect)}
      </div>
      <Button
        variant="secondary"
        className="min-w-0 flex-1 justify-start rounded-full md:hidden"
        onPress={drawer.open}
      >
        {current &&
          [titleOf(current), correctOf(current)].filter(Boolean).join(' · ')}
      </Button>
      <button
        type="button"
        aria-label={t('review.nextPart')}
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
              <Drawer.Heading>{t('taking.questions')}</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              {grid(false, (id, questionId) => {
                drawer.close();
                onSelect(id, questionId);
              })}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </nav>
  );
}
