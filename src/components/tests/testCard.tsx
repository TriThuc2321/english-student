import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { IoTimeOutline } from 'react-icons/io5';

import type { Locale } from '@/i18n';
import type { StudentTestListItem } from '@/types/student-test';

import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';

import SkillBadges from './skillBadges';
import { useFormatDuration } from './useFormatDuration';

type TestCardProps = {
  test: StudentTestListItem;
};

export default function TestCard({ test }: TestCardProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const formatDuration = useFormatDuration();

  return (
    <Link
      href={ROUTES.test(test.slug)}
      className="bg-surface border-border shadow-surface hover:border-field-border focus-visible:ring-focus flex h-full flex-col gap-3.5 rounded-xl border p-5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <span className="bg-brand-navy-soft text-brand-navy self-start rounded px-2 py-0.5 text-xs font-semibold">
        {t(`exam.${test.examType}`)}
      </span>
      <div>
        <h2 className="line-clamp-2 text-lg leading-[26px] font-semibold">
          {test.title}
        </h2>
        {test.source && (
          <p className="text-muted mt-0.5 text-sm">{test.source}</p>
        )}
      </div>
      <SkillBadges sections={test.testSections} />
      {(test.durationMinutes !== null || test.publishedAt) && (
        <div className="border-separator text-muted mt-auto flex justify-between gap-2 border-t pt-3 text-[13px] leading-[18px]">
          {test.durationMinutes !== null && (
            <span className="flex items-center gap-1.5">
              <IoTimeOutline size={14} aria-hidden />
              {formatDuration(test.durationMinutes)}
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
