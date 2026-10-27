import { Card, Chip } from '@heroui/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

import type { Locale } from '@/i18n';
import type { StudentTestListItem } from '@/types/student-test';

import { EXAM_CLASSES } from '@/constants/exam';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';

import SkillBadges from './skillBadges';

type TestCardProps = {
  test: StudentTestListItem;
};

export default function TestCard({ test }: TestCardProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const examClasses = EXAM_CLASSES[test.examType];

  return (
    <Link
      href={ROUTES.test(test.slug)}
      className="focus-visible:ring-focus block h-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <Card className="relative h-full overflow-hidden transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-lg">
        <span
          aria-hidden
          className={`absolute inset-x-0 top-0 h-1 ${examClasses.bar}`}
        />
        <Card.Header className="gap-2">
          <Chip
            size="sm"
            variant="soft"
            className={`self-start ${examClasses.soft}`}
          >
            {t(`exam.${test.examType}`)}
          </Chip>
          <Card.Title className="line-clamp-2">{test.title}</Card.Title>
          {test.source && <Card.Description>{test.source}</Card.Description>}
        </Card.Header>
        <Card.Content>
          <SkillBadges sections={test.testSections} />
        </Card.Content>
        {(test.durationMinutes !== null || test.publishedAt) && (
          <Card.Footer className="text-muted mt-auto justify-between gap-2 text-xs">
            {test.durationMinutes !== null && (
              <span>{t('tests.minutes', { count: test.durationMinutes })}</span>
            )}
            {test.publishedAt && (
              <span>
                {t('tests.publishedOn', {
                  date: formatDate(test.publishedAt, locale),
                })}
              </span>
            )}
          </Card.Footer>
        )}
      </Card>
    </Link>
  );
}
