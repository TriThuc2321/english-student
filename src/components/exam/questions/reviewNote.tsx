'use client';

import { Button, cn, Disclosure } from '@heroui/react';
import { useTranslations } from 'next-intl';

import type { NumberStatus, ReviewItem } from '@/lib/results/view';

import {
  ExplanationBlock,
  formatParts,
} from '@/components/results/explanationBlock';
import { BADGE_CLASSES, GLYPHS, isMiss } from '@/components/results/status';

import { useExamGroup } from './context';
import { QNum } from './parts';

// One status for a question that spans several numbers: any miss makes it a miss.
export function questionStatus(items: ReviewItem[]): NumberStatus {
  const statuses = items.map((item) => item.status);
  if (statuses.includes('incorrect')) return 'incorrect';
  if (statuses.includes('blank')) {
    return statuses.includes('correct') ? 'incorrect' : 'blank';
  }
  return statuses[0] ?? 'blank';
}

export function StatusBadge({ items }: { items: ReviewItem[] }) {
  const t = useTranslations();
  const status = questionStatus(items);
  const correct = items.filter((item) => item.status === 'correct').length;
  return (
    <span
      className={cn(
        'inline-flex flex-none items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold',
        BADGE_CLASSES[status],
      )}
    >
      <span aria-hidden>{GLYPHS[status]}</span>
      {items.length > 1 && status !== 'pending' && status !== 'graded'
        ? t('taking.groupCorrect', { correct, total: items.length })
        : t(`results.status.${status}`)}
    </span>
  );
}

type ReviewNoteProps = {
  n: number;
  // Inline blanks have no row of their own, so their notes are listed under the group with the number.
  numbered?: boolean;
};

export function ReviewNote({ n, numbered = false }: ReviewNoteProps) {
  const t = useTranslations();
  const { review } = useExamGroup();
  const items = review?.question(n) ?? [];
  const item = items[0];
  if (!item) return null;

  const status = questionStatus(items);
  const hasExplanation = !!item.explanation || !!item.evidence;

  return (
    <div className="mt-3 flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {numbered && (
          <QNum>{item.from === item.to ? n : `${item.from}–${item.to}`}</QNum>
        )}
        <StatusBadge items={items} />
        {item.sample === null &&
          status !== 'correct' &&
          (item.correctAnswer ? (
            <span>
              <span className="text-muted">{t('results.correctAnswer')}: </span>
              <b>{formatParts(item.correctAnswer)}</b>
              {item.alsoAccepted.length > 0 && (
                <span className="text-muted">
                  {' · '}
                  {t('results.alsoAccepted', {
                    list: item.alsoAccepted.join(', '),
                  })}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted">{t('results.gradedByTeacher')}</span>
          ))}
      </div>
      {item.audioUrl && (
        <div className="bg-surface-secondary rounded-lg px-3.5 py-3">
          <p className="text-muted text-xs">{t('results.yourRecording')}</p>
          {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- the student's own recording has no captions to offer */}
          <audio controls src={item.audioUrl} className="mt-1.5 w-full" />
        </div>
      )}
      {item.sample !== null && (
        <div className="border-border rounded-lg border border-dashed px-3.5 py-3">
          <p className="text-muted text-xs">{t('results.sampleAnswer')}</p>
          <p className="mt-0.5 max-h-96 overflow-y-auto text-sm leading-6 whitespace-pre-line">
            {item.sample}
          </p>
        </div>
      )}
      {hasExplanation && (
        <Disclosure defaultExpanded={isMiss(status)}>
          <Disclosure.Heading>
            <Button
              slot="trigger"
              size="sm"
              variant="ghost"
              className="text-brand-navy -ml-2 gap-1"
            >
              {t('results.explanation')}
              <Disclosure.Indicator />
            </Button>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body className="border-brand-navy/30 bg-brand-navy-soft/40 mt-1 rounded-lg px-3.5 py-3">
              <ExplanationBlock item={item} />
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      )}
    </div>
  );
}
