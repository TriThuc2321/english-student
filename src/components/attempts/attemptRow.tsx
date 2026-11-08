import { buttonVariants, Chip } from '@heroui/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

import type { Locale } from '@/i18n';
import type {
  AttemptListItem,
  AttemptSection,
  AttemptStatus,
} from '@/types/attempt';

import { SKILL_ICONS } from '@/components/tests/skillBadges';
import { EXAM_CLASSES, SKILL_CLASSES } from '@/constants/exam';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';

const STATUS_COLOR = {
  IN_PROGRESS: 'accent',
  SUBMITTED: 'warning',
  GRADED: 'success',
  EXPIRED: 'default',
} as const satisfies Record<AttemptStatus, string>;

const sectionScore = ({ scaledScore, rawScore, maxScore }: AttemptSection) => {
  if (scaledScore !== null) return String(scaledScore);
  if (rawScore !== null && maxScore !== null) return `${rawScore}/${maxScore}`;
  return null;
};

type AttemptRowProps = {
  attempt: AttemptListItem;
};

export default function AttemptRow({ attempt }: AttemptRowProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { test } = attempt;
  const sections = [...attempt.sections].sort((a, b) => a.order - b.order);
  const inProgress = attempt.status === 'IN_PROGRESS';

  return (
    <article className="bg-surface shadow-surface border-border flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:gap-6 md:p-5">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip
            size="sm"
            variant="soft"
            className={`rounded-full ${EXAM_CLASSES[test.examType].soft}`}
          >
            {t(`exam.${test.examType}`)}
          </Chip>
          <Chip size="sm" variant="soft" className="rounded-full">
            {attempt.mode === 'FULL'
              ? t('results.fullTest')
              : t('results.practice')}
          </Chip>
          <Chip
            size="sm"
            variant="soft"
            color={STATUS_COLOR[attempt.status]}
            className="rounded-full"
          >
            {t(`attempts.status.${attempt.status}`)}
          </Chip>
        </div>
        <h2 className="truncate text-lg font-semibold">{test.title}</h2>
        <div className="text-muted flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span>
            {t('attempts.startedOn', {
              date: formatDate(attempt.startedAt, locale),
            })}
          </span>
          <ul
            aria-label={t('tests.sections')}
            className="flex flex-wrap gap-1.5"
          >
            {sections.map((section) => {
              const Icon = SKILL_ICONS[section.skill];
              return (
                <li
                  key={section.id}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${SKILL_CLASSES[section.skill]}`}
                >
                  <Icon size={12} aria-hidden />
                  {t(`exam.skill.${section.skill}`)}
                  {sectionScore(section) && (
                    <span className="font-semibold tabular-nums">
                      {sectionScore(section)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-end gap-4 md:justify-end">
        {attempt.overallScore !== null && (
          <div className="flex flex-col md:items-end">
            <span className="text-muted text-xs">{t('attempts.overall')}</span>
            <span className="text-xl font-semibold tabular-nums">
              {attempt.overallScore}
            </span>
          </div>
        )}
        <Link
          href={ROUTES.attemptResult(attempt.id)}
          className={buttonVariants({
            variant: inProgress ? 'primary' : 'secondary',
            size: 'sm',
          })}
        >
          {inProgress ? t('attempts.continue') : t('attempts.viewResult')}
        </Link>
      </div>
    </article>
  );
}
