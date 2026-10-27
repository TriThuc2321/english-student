'use client';

import { Button } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { catchError, type ErrorInfo } from 'next/error';

import type { ExamType } from '@/types/student-test';

function RowErrorFallback(
  { examType }: { examType: ExamType },
  { retry }: ErrorInfo,
) {
  const t = useTranslations();

  return (
    <section
      aria-labelledby={`row-${examType}-error`}
      className="flex flex-col gap-3"
    >
      <h2 id={`row-${examType}-error`} className="text-lg font-semibold">
        {t(`exam.${examType}`)}
      </h2>
      <div className="border-separator flex flex-col items-start gap-3 rounded-3xl border border-dashed p-6">
        <p className="text-muted text-sm">{t('home.rowError')}</p>
        <Button size="sm" variant="secondary" onPress={() => retry()}>
          {t('home.retry')}
        </Button>
      </div>
    </section>
  );
}

export default catchError(RowErrorFallback);
