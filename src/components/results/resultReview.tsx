'use client';

import { Button, buttonVariants, Disclosure, Tabs } from '@heroui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useId, useState } from 'react';
import {
  LuChevronLeft,
  LuChevronRight,
  LuSquareArrowOutUpRight,
} from 'react-icons/lu';

import type {
  Breakdown,
  NumberStatus,
  ReviewItem,
  SectionResult,
} from '@/lib/results/view';

import { ROUTES } from '@/constants/routes';

import { AssessmentPanel } from './assessmentPanel';
import { ExplanationBlock, formatPart } from './explanationBlock';
import { ProductiveReview } from './productiveReview';
import { BADGE_CLASSES, CELL_CLASSES, GLYPHS, LEGEND_SWATCHES } from './status';

const card = 'bg-surface shadow-surface flex flex-col rounded-2xl p-6';

type ResultReviewProps = {
  attemptId: string;
  sections: SectionResult[];
};

export function ResultReview({ attemptId, sections }: ResultReviewProps) {
  const t = useTranslations();
  const [sectionId, setSectionId] = useState(sections[0]?.sectionId);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const transcriptsHeading = useId();

  const section =
    sections.find((s) => s.sectionId === sectionId) ?? sections[0];
  if (!section) return null;

  const items = section.items;
  const current =
    items.find((item) => item.key === selected[section.sectionId]) ?? items[0];
  const index = current ? items.indexOf(current) : -1;
  const select = (key: string) =>
    setSelected((prev) => ({ ...prev, [section.sectionId]: key }));

  const sectionName = (s: SectionResult) => t(`exam.skill.${s.skill}`);
  const productive = isProductive(section);

  const content = productive ? (
    <ProductiveReview
      key={section.sectionId}
      attemptId={attemptId}
      section={section}
    />
  ) : (
    <>
      {section.assessment && (
        <AssessmentPanel assessment={section.assessment} />
      )}
      <AnswerGrid
        title={t('results.answersTitle', { section: sectionName(section) })}
        section={section}
        selectedKey={current?.key ?? null}
        onSelect={select}
      />
      <FocusBreakdown section={section} />
      {section.transcripts.length > 0 && (
        <section
          aria-labelledby={transcriptsHeading}
          className={`${card} gap-3`}
        >
          <h2 id={transcriptsHeading} className="text-xl font-semibold">
            {t('results.transcripts')}
          </h2>
          {section.transcripts.map((tr, i) => (
            <Disclosure key={tr.mediaId}>
              <Disclosure.Heading>
                <Button
                  slot="trigger"
                  variant="secondary"
                  className="w-full justify-between"
                >
                  {tr.partTitle ?? t('results.transcriptN', { n: i + 1 })}
                  <Disclosure.Indicator />
                </Button>
              </Disclosure.Heading>
              <Disclosure.Content>
                <Disclosure.Body className="pt-3 text-sm leading-6 whitespace-pre-line">
                  {tr.transcript}
                </Disclosure.Body>
              </Disclosure.Content>
            </Disclosure>
          ))}
        </section>
      )}
    </>
  );

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
        {sections.length > 1 ? (
          <Tabs
            variant="secondary"
            selectedKey={String(section.sectionId)}
            onSelectionChange={(key) => setSectionId(Number(key))}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label={t('results.sectionsLabel')}>
                {sections.map((s) => (
                  <Tabs.Tab key={s.sectionId} id={String(s.sectionId)}>
                    {sectionName(s)}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
            {sections.map((s) => (
              <Tabs.Panel
                key={s.sectionId}
                id={String(s.sectionId)}
                className="flex flex-col gap-6 px-0 pt-6 pb-0"
              >
                {content}
              </Tabs.Panel>
            ))}
          </Tabs>
        ) : (
          content
        )}
      </div>
      {current && !productive && (
        <ReviewPanel
          item={current}
          reviewHref={ROUTES.attemptReview(attemptId, {
            questionId: current.questionId,
          })}
          onPrev={index > 0 ? () => select(items[index - 1].key) : null}
          onNext={
            index < items.length - 1 ? () => select(items[index + 1].key) : null
          }
        />
      )}
    </div>
  );
}

const isProductive = (section: SectionResult) =>
  section.skill === 'WRITING' || section.skill === 'SPEAKING';

function AnswerGrid({
  title,
  section,
  selectedKey,
  onSelect,
}: {
  title: string;
  section: SectionResult;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const t = useTranslations('results');
  const headingId = useId();
  const legend = (Object.keys(section.counts) as NumberStatus[]).filter(
    (status) =>
      (status !== 'pending' && status !== 'graded') ||
      section.counts[status] > 0,
  );

  return (
    <section aria-labelledby={headingId} className={`${card} gap-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-xl font-semibold">
          {title}
        </h2>
        <ul className="text-muted flex flex-wrap gap-3 text-[13px]">
          {legend.map((status) => (
            <li key={status} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={`size-3.5 rounded ${LEGEND_SWATCHES[status]}`}
              />
              {t(`legend.${status}`, { count: section.counts[status] })}
            </li>
          ))}
        </ul>
      </div>
      {section.items.length === 0 ? (
        <p className="text-muted text-sm">{t('emptySection')}</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-1.5">
          {section.items.map((item) => {
            const on = item.key === selectedKey;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={t('questionAria', {
                    n: item.n,
                    status: t(`status.${item.status}`),
                  })}
                  onClick={() => onSelect(item.key)}
                  className={`flex h-11 w-full cursor-pointer flex-col items-center justify-center gap-px rounded-lg text-sm font-semibold tabular-nums ${CELL_CLASSES[item.status]} ${on ? 'ring-foreground ring-offset-surface ring-2 ring-offset-2' : ''}`}
                >
                  {item.n}
                  <span aria-hidden className="text-[11px] leading-none">
                    {GLYPHS[item.status]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function FocusBreakdown({ section }: { section: SectionResult }) {
  const t = useTranslations();
  const headingId = useId();

  if (section.byPart.length === 0 && section.byType.length === 0) {
    return null;
  }

  const label = (b: Breakdown) =>
    typeof b.label === 'string'
      ? t(`taking.questionType.${b.label}`)
      : (b.label.partTitle ??
        t('results.partFallback', { order: b.label.partOrder }));

  const column = (heading: string, rows: Breakdown[], showWeak: boolean) => (
    <div className="flex flex-col gap-3">
      <h3 className="text-muted text-sm font-semibold">{heading}</h3>
      {rows.map((b) => (
        <div key={b.id} className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-2 text-sm">
            <span>
              {label(b)}
              {showWeak && b.weak && (
                <span className="bg-warning text-warning-foreground ml-2 rounded px-1.5 py-px text-[11px] font-semibold whitespace-nowrap">
                  {t('results.needsWork')}
                </span>
              )}
            </span>
            <span className="whitespace-nowrap tabular-nums">
              <b>{b.pct}%</b>{' '}
              <span className="text-muted">
                {b.correct}/{b.total}
              </span>
            </span>
          </div>
          <div
            aria-hidden
            className="bg-surface-tertiary h-2 overflow-hidden rounded-full"
          >
            <div
              className="bg-brand-navy h-full rounded-full"
              style={{ width: `${b.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section aria-labelledby={headingId} className={`${card} gap-5`}>
      <h2 id={headingId} className="text-xl font-semibold">
        {t('results.focusTitle')}
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-x-8 gap-y-6">
        {column(t('results.byPart'), section.byPart, false)}
        {column(t('results.byType'), section.byType, true)}
      </div>
    </section>
  );
}

function ReviewPanel({
  item,
  reviewHref,
  onPrev,
  onNext,
}: {
  item: ReviewItem;
  reviewHref: string;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}) {
  const t = useTranslations();
  const headingId = useId();

  return (
    <aside
      aria-labelledby={headingId}
      className={`${card} sticky top-4 min-w-0 flex-[1_1_340px] gap-4`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          {item.questionType && (
            <p className="text-brand-navy text-xs font-semibold tracking-[0.08em] uppercase">
              {t(`taking.questionType.${item.questionType}`)}
            </p>
          )}
          <h2 id={headingId} className="mt-0.5 text-xl font-semibold">
            {item.from === item.to
              ? t('results.questionN', { n: item.n })
              : t('results.questionsRange', { from: item.from, to: item.to })}
          </h2>
        </div>
        <span
          className={`flex-none rounded px-2.5 py-1 text-[13px] font-semibold ${BADGE_CLASSES[item.status]}`}
        >
          {GLYPHS[item.status]} {t(`results.status.${item.status}`)}
        </span>
      </div>
      <p className={item.prompt ? '' : 'text-muted text-sm'}>
        {item.prompt ?? t('results.promptFallback')}
      </p>
      <div className="bg-surface-secondary rounded-lg px-3.5 py-3">
        {item.audioUrl ? (
          <>
            <p className="text-muted text-xs">{t('results.yourRecording')}</p>
            {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- the student's own recording has no captions to offer */}
            <audio controls src={item.audioUrl} className="mt-1.5 w-full" />
          </>
        ) : (
          <>
            <p className="text-muted text-xs">{t('results.yourAnswer')}</p>
            <p
              className={`mt-0.5 ${item.sample === null ? 'font-semibold' : 'max-h-96 overflow-y-auto text-sm leading-6 whitespace-pre-line'}`}
            >
              {item.yourAnswer.length > 0
                ? item.yourAnswer.map(formatPart).join(', ')
                : t('results.noAnswer')}
            </p>
          </>
        )}
      </div>
      <div className="border-border rounded-lg border border-dashed px-3.5 py-3">
        <p className="text-muted text-xs">
          {item.sample === null
            ? t('results.correctAnswer')
            : t('results.sampleAnswer')}
        </p>
        {item.sample !== null ? (
          <p className="mt-0.5 max-h-96 overflow-y-auto text-sm leading-6 whitespace-pre-line">
            {item.sample}
          </p>
        ) : item.correctAnswer ? (
          <>
            <p className="mt-0.5 font-semibold">
              {item.correctAnswer.map(formatPart).join(', ')}
            </p>
            {item.alsoAccepted.length > 0 && (
              <p className="text-muted mt-0.5 text-sm">
                {t('results.alsoAccepted', {
                  list: item.alsoAccepted.join(', '),
                })}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted mt-0.5 text-sm">
            {t('results.gradedByTeacher')}
          </p>
        )}
      </div>
      <div className="border-border min-h-24 rounded-lg border border-dashed px-3.5 py-3">
        <p className="text-muted mb-0.5 text-xs">{t('results.explanation')}</p>
        <ExplanationBlock item={item} />
      </div>
      <Link
        href={reviewHref}
        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
      >
        <LuSquareArrowOutUpRight aria-hidden className="size-4" />
        {t('review.viewInTest')}
      </Link>
      <div className="flex justify-between gap-2">
        <Button
          variant="secondary"
          isDisabled={!onPrev}
          onPress={() => onPrev?.()}
        >
          <LuChevronLeft aria-hidden className="size-4" />
          {t('results.previous')}
        </Button>
        <Button
          variant="secondary"
          isDisabled={!onNext}
          onPress={() => onNext?.()}
        >
          {t('results.next')}
          <LuChevronRight aria-hidden className="size-4" />
        </Button>
      </div>
    </aside>
  );
}
