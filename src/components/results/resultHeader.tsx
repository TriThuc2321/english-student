import { buttonVariants, Chip } from '@heroui/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { LuClock, LuRotateCcw } from 'react-icons/lu';

import type { Locale } from '@/i18n';
import type { AttemptListItem } from '@/types/attempt';

import { useFormatDuration } from '@/components/tests/useFormatDuration';
import { EXAM_CLASSES } from '@/constants/exam';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';

type ResultHeaderProps = {
  attempt: AttemptListItem;
};

export function ResultHeader({ attempt }: ResultHeaderProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const formatDuration = useFormatDuration();
  const { test } = attempt;
  const minutes = attempt.submittedAt
    ? Math.max(
        1,
        Math.round(
          (Date.parse(attempt.submittedAt) - Date.parse(attempt.startedAt)) /
            60_000,
        ),
      )
    : null;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Chip
            size="sm"
            variant="soft"
            className={EXAM_CLASSES[test.examType].soft}
          >
            {t(`exam.${test.examType}`)}
          </Chip>
          <Chip size="sm" variant="soft">
            {attempt.mode === 'FULL'
              ? t('results.fullTest')
              : t('results.practice')}
          </Chip>
          {attempt.status === 'EXPIRED' && (
            <Chip
              size="sm"
              variant="soft"
              className="bg-warning text-warning-foreground"
            >
              <LuClock aria-hidden className="size-3" />
              {t('results.expired')}
            </Chip>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{test.title}</h1>
        {attempt.submittedAt && minutes !== null && (
          <p className="text-muted text-sm">
            {t('results.submittedMeta', {
              date: formatDate(attempt.submittedAt, locale),
              duration: formatDuration(minutes),
            })}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={ROUTES.TESTS}
          className={buttonVariants({ variant: 'secondary' })}
        >
          {t('results.backToLibrary')}
        </Link>
        <Link
          href={ROUTES.test(test.slug)}
          className={buttonVariants({ variant: 'primary' })}
        >
          <LuRotateCcw aria-hidden className="size-4" />
          {t('results.retake')}
        </Link>
      </div>
    </div>
  );
}
