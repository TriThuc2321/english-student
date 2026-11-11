'use client';

import { Button, cn, Disclosure, Tabs } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import type { Answer } from '@/lib/exam/structure';
import type {
  ReviewItem,
  SectionAssessment,
  SectionTranscript,
} from '@/lib/results/view';
import type { StudentTestPart } from '@/types/student-test';

import { AssessmentPanel } from '@/components/results/assessmentPanel';
import { toGroupView, toPassageView } from '@/lib/exam/group-view';

import { PartAudioCard, PartHeading } from './partHeading';
import { questionAnchorId } from './questions/context';
import { GroupView } from './questions/groupView';
import { PassagePane } from './questions/parts';
import { SplitHandle } from './splitHandle';
import { TEXT_ZOOM, type TextSize } from './useExamTextSize';
import { useSplitRatio } from './useSplitRatio';

type PartViewProps = {
  part: StudentTestPart | null;
  index: number;
  // Keyed by question id.
  answers: Record<number, Answer>;
  onAnswer: (questionId: number, value: Answer) => void;
  readOnly: boolean;
  flagged: number[];
  onToggleFlag: (questionId: number) => void;
  focusRequest?: FocusRequest | null;
  onActiveQuestion?: (questionId: number) => void;
  textSize?: TextSize;
  review?: PartReview;
};

export type PartReview = {
  // Keyed by question id.
  items: Record<number, ReviewItem[]>;
  transcripts: SectionTranscript[];
  assessment: SectionAssessment | null;
};

export type FocusRequest = { questionId: number; seq: number };

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
  review,
}: PartViewProps) {
  const t = useTranslations('taking');
  const [tab, setTab] = useState<'passage' | 'questions'>('questions');
  const [ratio, setRatio] = useSplitRatio();

  const [seenSeq, setSeenSeq] = useState(focusRequest?.seq);
  if (focusRequest && focusRequest.seq !== seenSeq) {
    setSeenSeq(focusRequest.seq);
    setTab('questions');
  }

  const seq = focusRequest?.seq;
  const target = focusRequest?.questionId;
  useEffect(() => {
    if (seq === undefined || target === undefined) return;
    // The questions column is hidden while the passage tab is active; wait for it to show
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(questionAnchorId(target));
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
      const id = anchor ? Number(anchor.id.slice(2)) : NaN;
      if (Number.isInteger(id)) onActiveRef.current?.(id);
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

  const writing =
    groups.length > 0 && groups.every((g) => toGroupView(g).view === 'write');
  const illustrated = groups.some(
    (g) => g.image !== null || g.questions.some((q) => q.image !== null),
  );
  // A lone writing task is already titled and briefed by the part heading.
  const headless = (group: (typeof groups)[number]) =>
    writing &&
    groups.length === 1 &&
    (!group.instruction?.trim() ||
      (part.instruction ?? '').includes(group.instruction.trim()));

  const sharedPassage =
    part.passage && groups.some((g) => g.passages.length === 0)
      ? toPassageView(part.passage)
      : null;

  const questions = (
    <>
      <PartAudioCard part={part} index={index} />
      <div
        className={cn(
          'mx-auto flex w-full flex-col gap-6 px-4 pt-6 pb-20 sm:px-6',
          writing && illustrated ? 'max-w-[1280px]' : 'max-w-[920px]',
          TEXT_ZOOM[textSize],
        )}
      >
        <PartHeading part={part} index={index} />
        {review && review.transcripts.length > 0 && (
          <div className="bg-surface shadow-surface flex flex-col gap-2 rounded-2xl p-4">
            {review.transcripts.map((tr, i) => (
              <Disclosure key={tr.mediaId}>
                <Disclosure.Heading>
                  <Button
                    slot="trigger"
                    variant="secondary"
                    className="w-full justify-between"
                  >
                    {review.transcripts.length > 1
                      ? t('transcriptN', { n: i + 1 })
                      : t('transcript')}
                    <Disclosure.Indicator />
                  </Button>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <Disclosure.Body className="max-h-96 overflow-y-auto pt-3 text-sm leading-6 whitespace-pre-line">
                    {tr.transcript}
                  </Disclosure.Body>
                </Disclosure.Content>
              </Disclosure>
            ))}
          </div>
        )}
        {review?.assessment && (
          <AssessmentPanel assessment={review.assessment} />
        )}
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
            review={review?.items}
            headless={headless(group)}
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
      style={{ '--split': `${ratio}%` } as CSSProperties}
      className="flex min-h-0 flex-1 flex-col lg:flex-row"
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
          'bg-surface min-h-0 overflow-y-auto lg:block lg:w-(--split) lg:flex-none',
          tab === 'passage' ? 'block' : 'hidden',
        )}
      >
        <div
          className={cn(
            'mx-auto px-5 pt-8 pb-16 sm:px-10',
            TEXT_ZOOM[textSize],
          )}
        >
          <PassagePane
            passage={sharedPassage}
            className="max-h-none overflow-visible border-0 p-0 md:border-0"
          />
        </div>
      </div>
      <SplitHandle
        containerRef={sectionRef}
        ratio={ratio}
        onChange={setRatio}
      />
      <div
        className={cn(
          'min-h-0 min-w-0 flex-1 overflow-y-auto lg:block',
          tab === 'questions' ? 'block' : 'hidden',
        )}
      >
        {questions}
      </div>
    </section>
  );
}
