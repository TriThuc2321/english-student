'use client';

import { cn, Tabs } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import type { Answer } from '@/lib/exam/structure';
import type { StudentTestPart } from '@/types/student-test';

import { toPassageView } from '@/lib/exam/group-view';

import { PartAudioCard, PartHeading } from './partHeading';
import { GroupView } from './questions/groupView';
import { PassagePane } from './questions/parts';
import { TEXT_ZOOM, type TextSize } from './useExamTextSize';

type PartViewProps = {
  part: StudentTestPart | null;
  index: number;
  answers: Record<number, Answer>;
  onAnswer: (n: number, value: Answer) => void;
  readOnly: boolean;
  flagged: number[];
  onToggleFlag: (n: number) => void;
  focusRequest?: FocusRequest | null;
  onActiveQuestion?: (n: number) => void;
  textSize?: TextSize;
};

export type FocusRequest = { n: number; seq: number };

const FOCUSABLE = 'input, select, textarea, button, [tabindex]';

export function PartView({
  part,
  index,
  answers,
  onAnswer,
  readOnly,
  flagged,
  onToggleFlag,
  focusRequest = null,
  onActiveQuestion,
  textSize = 'md',
}: PartViewProps) {
  const t = useTranslations('taking');
  const [tab, setTab] = useState<'passage' | 'questions'>('questions');

  const [seenSeq, setSeenSeq] = useState(focusRequest?.seq);
  if (focusRequest && focusRequest.seq !== seenSeq) {
    setSeenSeq(focusRequest.seq);
    setTab('questions');
  }

  const seq = focusRequest?.seq;
  const target = focusRequest?.n;
  useEffect(() => {
    if (seq === undefined || target === undefined) return;
    // The questions column is hidden while the passage tab is active; wait for it to show
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(`q-${target}`);
      if (!el) return;
      el.scrollIntoView({ block: 'center' });
      const focusable = el.matches(FOCUSABLE)
        ? el
        : el.querySelector<HTMLElement>(FOCUSABLE);
      focusable?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [seq, target]);

  const sectionRef = useRef<HTMLElement>(null);
  const onActiveRef = useRef(onActiveQuestion);
  useEffect(() => {
    onActiveRef.current = onActiveQuestion;
  });
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onFocusIn = (e: FocusEvent) => {
      const anchor = (e.target as Element).closest('[id^="q-"]');
      const n = anchor ? Number(anchor.id.slice(2)) : NaN;
      if (Number.isInteger(n)) onActiveRef.current?.(n);
    };
    el.addEventListener('focusin', onFocusIn);
    return () => el.removeEventListener('focusin', onFocusIn);
  }, []);

  const groups = part
    ? [...part.questionGroups].sort((a, b) => a.order - b.order)
    : [];

  if (!part) {
    return (
      <p className="text-muted py-16 text-center text-sm">{t('emptyPart')}</p>
    );
  }

  const sharedPassage =
    part.passage && groups.some((g) => g.passages.length === 0)
      ? toPassageView(part.passage)
      : null;

  const questions = (
    <>
      <PartAudioCard part={part} index={index} />
      <div
        className={cn(
          'mx-auto flex w-full max-w-[920px] flex-col gap-7 px-4 pt-5 pb-16 sm:px-6',
          TEXT_ZOOM[textSize],
        )}
      >
        <PartHeading part={part} index={index} />
        {groups.length === 0 && (
          <p className="text-muted py-16 text-center text-sm">
            {t('emptyPart')}
          </p>
        )}
        {groups.map((group) => (
          <GroupView
            key={group.id}
            group={group}
            answers={answers}
            setAnswer={onAnswer}
            readOnly={readOnly}
            flagged={flagged}
            toggleFlag={onToggleFlag}
          />
        ))}
      </div>
    </>
  );

  if (!sharedPassage) {
    return (
      <section
        aria-label={part.title ?? t('partFallback', { n: index + 1 })}
        ref={sectionRef}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {questions}
      </section>
    );
  }

  return (
    <section
      aria-label={part.title ?? t('partFallback', { n: index + 1 })}
      ref={sectionRef}
      className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-2"
    >
      <Tabs
        className="lg:hidden"
        selectedKey={tab}
        onSelectionChange={(key) => setTab(key as typeof tab)}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label={t('passage')}>
            <Tabs.Tab id="passage">
              {t('passage')}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="questions">
              {t('questions')}
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <div
        className={cn(
          'bg-surface-secondary border-border min-h-0 overflow-y-auto lg:block lg:border-r',
          tab === 'passage' ? 'block' : 'hidden',
        )}
      >
        <div
          className={cn('mx-auto px-4 pt-7 pb-14 sm:px-8', TEXT_ZOOM[textSize])}
        >
          <PassagePane
            passage={sharedPassage}
            className="bg-surface shadow-surface max-h-none rounded-xl border px-6 py-5 md:border-r md:border-b"
          />
        </div>
      </div>
      <div
        className={cn(
          'min-h-0 overflow-y-auto lg:block',
          tab === 'questions' ? 'block' : 'hidden',
        )}
      >
        {questions}
      </div>
    </section>
  );
}
