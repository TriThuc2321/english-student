'use client';

import { cn } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { LuClock } from 'react-icons/lu';

export const WARNING_SECONDS = 600;
export const DANGER_SECONDS = 300;

const pad = (n: number) => String(n).padStart(2, '0');

export const formatClock = (seconds: number) =>
  `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

export function ExamTimer({ seconds }: { seconds: number }) {
  const t = useTranslations('taking');
  const level =
    seconds < DANGER_SECONDS
      ? 'danger'
      : seconds < WARNING_SECONDS
        ? 'warning'
        : 'normal';

  return (
    <div
      role="timer"
      data-level={level}
      aria-label={t('timerLabel', {
        minutes: Math.floor(seconds / 60),
        seconds: seconds % 60,
      })}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-lg font-bold tabular-nums transition-colors',
        level === 'normal' && 'bg-surface-secondary text-foreground',
        level === 'warning' && 'bg-warning text-warning-foreground',
        level === 'danger' && 'bg-danger text-danger-foreground',
      )}
    >
      <LuClock aria-hidden className="size-[18px]" />
      {formatClock(seconds)}
    </div>
  );
}
