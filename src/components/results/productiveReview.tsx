'use client';

import { Button, buttonVariants, Disclosure, Tabs } from '@heroui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useId, useState } from 'react';
import { LuSquareArrowOutUpRight } from 'react-icons/lu';

import type {
  AssessmentEntryView,
  ReviewItem,
  SectionResult,
} from '@/lib/results/view';

import { ZoomableImage } from '@/components/exam/questions/media';
import { ROUTES } from '@/constants/routes';
import { wordCount } from '@/lib/exam/word-count';

import { AssessmentPanel, GradeCard } from './assessmentPanel';
import { formatPart } from './explanationBlock';

type PartGroup = {
  key: string;
  partId: number | null;
  title: string | null;
  order: number;
  items: ReviewItem[];
};

function groupByPart(items: ReviewItem[]): PartGroup[] {
  const groups = new Map<string, PartGroup>();
  for (const item of items) {
    const key = item.part ? String(item.part.id) : 'none';
    const group = groups.get(key) ?? {
      key,
      partId: item.part?.id ?? null,
      title: item.part?.title ?? null,
      order: item.part?.order ?? Number.MAX_SAFE_INTEGER,
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => a.order - b.order);
}

type ProductiveReviewProps = {
  attemptId: string;
  section: SectionResult;
};

// Writing and Speaking are read as whole tasks next to their grade, not as a grid of numbers.
export function ProductiveReview({
  attemptId,
  section,
}: ProductiveReviewProps) {
  const t = useTranslations('results');
  const parts = groupByPart(section.items);
  const [selected, setSelected] = useState(parts[0]?.key);

  if (parts.length === 0) {
    return (
      <p className="bg-surface shadow-surface text-muted rounded-2xl p-6 text-sm">
        {t('emptySection')}
      </p>
    );
  }

  const entries = section.assessment?.entries ?? [];
  const sectionEntry = entries.find((e) => e.partId === null);
  const entryFor = (partId: number | null) =>
    partId === null ? undefined : entries.find((e) => e.partId === partId);
  const partName = (p: PartGroup) =>
    p.title ?? t('partFallback', { order: p.order });

  const body = (p: PartGroup) => (
    <PartPanel
      attemptId={attemptId}
      part={p}
      entry={entryFor(p.partId)}
      showGradeColumn={!sectionEntry}
      pending={section.gradingStatus === 'PENDING'}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      {sectionEntry && section.assessment && (
        <AssessmentPanel
          assessment={{
            band: section.assessment.band,
            entries: [sectionEntry],
          }}
        />
      )}
      {parts.length > 1 ? (
        <Tabs
          selectedKey={selected}
          onSelectionChange={(key) => setSelected(String(key))}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label={t('tasksLabel')}>
              {parts.map((p) => {
                const entry = entryFor(p.partId);
                return (
                  <Tabs.Tab key={p.key} id={p.key}>
                    {entry
                      ? t('taskBand', {
                          task: partName(p),
                          band: entry.band.toFixed(1),
                        })
                      : partName(p)}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </Tabs.ListContainer>
          {parts.map((p) => (
            <Tabs.Panel key={p.key} id={p.key} className="px-0 pt-4 pb-0">
              {body(p)}
            </Tabs.Panel>
          ))}
        </Tabs>
      ) : (
        body(parts[0])
      )}
    </div>
  );
}

function PartPanel({
  attemptId,
  part,
  entry,
  showGradeColumn,
  pending,
}: {
  attemptId: string;
  part: PartGroup;
  entry: AssessmentEntryView | undefined;
  showGradeColumn: boolean;
  pending: boolean;
}) {
  const t = useTranslations('results');
  const answers = (
    <div className="flex min-w-0 flex-col gap-6">
      {part.items.map((item) => (
        <TaskAnswer
          key={item.key}
          item={item}
          numbered={part.items.length > 1}
          reviewHref={ROUTES.attemptReview(attemptId, {
            questionId: item.questionId,
          })}
        />
      ))}
    </div>
  );

  if (!showGradeColumn) return answers;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {answers}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
        {entry ? (
          <GradeCard entry={entry} />
        ) : (
          <p className="bg-surface shadow-surface text-muted rounded-2xl p-6 text-sm">
            {pending ? t('gradedByTeacher') : t('notGraded')}
          </p>
        )}
      </aside>
    </div>
  );
}

function TaskAnswer({
  item,
  numbered,
  reviewHref,
}: {
  item: ReviewItem;
  numbered: boolean;
  reviewHref: string;
}) {
  const t = useTranslations();
  const headingId = useId();
  const text = item.yourAnswer.map(formatPart).join('\n');
  const words = wordCount(text);
  const title = numbered
    ? item.from === item.to
      ? t('results.questionN', { n: item.n })
      : t('results.questionsRange', { from: item.from, to: item.to })
    : item.questionType
      ? t(`taking.questionType.${item.questionType}`)
      : t('results.questionN', { n: item.n });

  return (
    <article
      aria-labelledby={headingId}
      className="bg-surface shadow-surface flex min-w-0 flex-col gap-5 rounded-2xl p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {numbered && item.questionType && (
            <p className="eyebrow mb-1">
              {t(`taking.questionType.${item.questionType}`)}
            </p>
          )}
          <h3 id={headingId} className="text-lg font-semibold">
            {title}
          </h3>
        </div>
        <Link
          href={reviewHref}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <LuSquareArrowOutUpRight aria-hidden className="size-4" />
          {t('review.viewInTest')}
        </Link>
      </header>

      {item.prompt ? (
        <p className="bg-surface-secondary rounded-xl px-4 py-3 leading-relaxed font-medium whitespace-pre-line">
          {item.prompt}
        </p>
      ) : (
        <p className="text-muted text-sm">{t('results.promptFallback')}</p>
      )}
      {item.image && (
        <ZoomableImage media={item.image} className="max-w-xl self-start" />
      )}

      {item.audioUrl ? (
        <div>
          <p className="text-muted mb-1.5 text-xs font-medium">
            {t('results.yourRecording')}
          </p>
          {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- the student's own recording has no captions to offer */}
          <audio controls src={item.audioUrl} className="w-full" />
        </div>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-muted text-xs font-medium">
              {t('results.yourAnswer')}
            </p>
            {text && (
              <span className="text-muted text-xs tabular-nums">
                {t('taking.wordCount', { count: words })}
              </span>
            )}
          </div>
          {text ? (
            <p className="max-w-[72ch] text-[15px] leading-7 whitespace-pre-line">
              {text}
            </p>
          ) : (
            <p className="text-muted text-sm">{t('results.noAnswer')}</p>
          )}
        </div>
      )}

      {(item.sample || item.explanation) && (
        <div className="border-separator flex flex-col gap-2 border-t pt-4">
          {item.sample && (
            <Disclosure>
              <Disclosure.Heading>
                <Button
                  slot="trigger"
                  variant="secondary"
                  className="w-full justify-between"
                >
                  {t('results.sampleAnswer')}
                  <Disclosure.Indicator />
                </Button>
              </Disclosure.Heading>
              <Disclosure.Content>
                <Disclosure.Body className="max-w-[72ch] pt-3 text-sm leading-6 whitespace-pre-line">
                  {item.sample}
                </Disclosure.Body>
              </Disclosure.Content>
            </Disclosure>
          )}
          {item.explanation && (
            <div className="px-1 pt-1">
              <p className="text-muted text-xs font-medium">
                {t('results.explanation')}
              </p>
              <p className="mt-0.5 text-sm leading-6">{item.explanation}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
