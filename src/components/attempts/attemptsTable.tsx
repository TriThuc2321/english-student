'use client';

import { buttonVariants, Chip, Table } from '@heroui/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { LuCheck } from 'react-icons/lu';

import type { Locale } from '@/i18n';
import type { AttemptListItem, AttemptStatus } from '@/types/attempt';

import { EXAM_CLASSES } from '@/constants/exam';
import {
  type AttemptScore,
  attemptAction,
  attemptScore,
} from '@/lib/attempts/history';
import { formatDateTime } from '@/lib/date';

type AttemptsTableProps = { attempts: AttemptListItem[] };

const STATUS_COLORS: Record<
  AttemptStatus,
  'warning' | 'accent' | 'success' | 'default'
> = {
  IN_PROGRESS: 'warning',
  SUBMITTED: 'accent',
  GRADED: 'success',
  EXPIRED: 'default',
};

export function AttemptsTable({ attempts }: AttemptsTableProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  const scoreText = (score: AttemptScore) => {
    switch (score.kind) {
      case 'none':
        return t('attempts.score.none');
      case 'pending':
        return t('attempts.score.pending');
      case 'overall':
        return score.max === null
          ? score.value
          : t('attempts.score.outOf', { score: score.value, max: score.max });
      case 'sections':
        return score.items
          .map((i) => `${t(`attempts.skillShort.${i.skill}`)} ${i.value}`)
          .join(' · ');
    }
  };

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label={t('attempts.tableTitle')}
          className="min-w-[820px]"
        >
          <Table.Header>
            <Table.Column isRowHeader>
              {t('attempts.columns.test')}
            </Table.Column>
            <Table.Column>{t('attempts.columns.mode')}</Table.Column>
            <Table.Column>{t('attempts.columns.started')}</Table.Column>
            <Table.Column>{t('attempts.columns.status')}</Table.Column>
            <Table.Column>{t('attempts.columns.score')}</Table.Column>
            <Table.Column className="text-end">
              {t('attempts.columns.action')}
            </Table.Column>
          </Table.Header>
          <Table.Body>
            {attempts.map((attempt) => {
              const { test } = attempt;
              const action = attemptAction(attempt);
              const score = attemptScore(attempt);
              return (
                <Table.Row key={attempt.id} id={attempt.id}>
                  <Table.Cell>
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-semibold">{test.title}</span>
                      <Chip
                        size="sm"
                        variant="soft"
                        className={EXAM_CLASSES[test.examType].soft}
                      >
                        {t(`exam.${test.examType}`)}
                      </Chip>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{t(`attempts.mode.${attempt.mode}`)}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    {formatDateTime(attempt.startedAt, locale)}
                  </Table.Cell>
                  <Table.Cell>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={STATUS_COLORS[attempt.status]}
                    >
                      {attempt.status === 'GRADED' && (
                        <LuCheck aria-hidden className="size-3" />
                      )}
                      {t(`attempts.status.${attempt.status}`)}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell
                    className={
                      score.kind === 'pending' || score.kind === 'none'
                        ? 'text-muted'
                        : 'font-semibold'
                    }
                  >
                    {scoreText(score)}
                  </Table.Cell>
                  <Table.Cell className="text-end">
                    {action.kind !== 'none' && (
                      <Link
                        href={action.href}
                        className={buttonVariants({
                          size: 'sm',
                          variant:
                            action.kind === 'resume' ? 'primary' : 'secondary',
                        })}
                      >
                        {action.kind === 'resume'
                          ? t('attempts.resume')
                          : t('attempts.viewResults')}
                      </Link>
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
