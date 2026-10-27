import { Card, Chip } from '@heroui/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

import type { Locale } from '@/i18n';
import type { StudentTestListItem } from '@/types/student-test';

import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';

import SkillBadges from './skillBadges';

type TestCardProps = {
  test: StudentTestListItem;
};

export default function TestCard({ test }: TestCardProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  return (
    <Link
      href={ROUTES.test(test.id)}
      className="focus-visible:ring-focus block h-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <Card className="hover:bg-surface-tertiary h-full transition-colors">
        <Card.Header className="gap-2">
          <Chip size="sm" color="accent" variant="soft" className="self-start">
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
