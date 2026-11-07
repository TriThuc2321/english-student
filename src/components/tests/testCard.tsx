import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { LuArrowUpRight, LuClock } from 'react-icons/lu';

import type { Locale } from '@/i18n';
import type { StudentTestListItem } from '@/types/student-test';

import { EXAM_CLASSES } from '@/constants/exam';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';
import { totalDurationMinutes } from '@/lib/exam/structure';

import DraftStatus from './draftStatus';
import SkillBadges from './skillBadges';
import { useFormatDuration } from './useFormatDuration';

type TestCardProps = {
  test: StudentTestListItem;
};

// Sources are often pasted from an uploaded file name; the extension is noise to students.
const displaySource = (source: string) =>
  source.replace(/\.(pdf|docx?|txt)$/i, '').trim();

export default function TestCard({ test }: TestCardProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const formatDuration = useFormatDuration();
  const minutes = totalDurationMinutes(test);

  return (
    <Link
      href={ROUTES.test(test.slug)}
      className="group bg-surface shadow-surface hover:shadow-card-hover focus-visible:ring-focus flex h-full flex-col gap-4 rounded-2xl p-5 transition-[box-shadow,translate] outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${EXAM_CLASSES[test.examType].soft}`}
        >
          {t(`exam.${test.examType}`)}
        </span>
        <DraftStatus slug={test.slug} />
        <LuArrowUpRight
          aria-hidden
          className="text-muted ml-auto size-4 opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="line-clamp-2 text-base leading-snug font-semibold tracking-tight">
          {test.title}
        </h2>
        {test.source && (
          <p className="text-muted line-clamp-1 text-sm">
            {displaySource(test.source)}
          </p>
        )}
      </div>
      <SkillBadges
        sections={test.testSections}
        fallbackMinutes={test.durationMinutes}
      />
      {(minutes !== null || test.publishedAt) && (
        <div className="border-separator text-muted mt-auto flex justify-between gap-2 border-t pt-3.5 text-xs">
          {minutes !== null && (
            <span className="text-foreground flex items-center gap-1.5 font-medium tabular-nums">
              <LuClock size={14} aria-hidden className="text-muted" />
              {formatDuration(minutes)}
            </span>
          )}
          {test.publishedAt && (
            <span className="ml-auto">
              {t('tests.publishedOn', {
                date: formatDate(test.publishedAt, locale),
              })}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
