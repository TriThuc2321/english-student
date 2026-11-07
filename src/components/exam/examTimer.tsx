'use client';

import { cn } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { LuClock } from 'react-icons/lu';

export const WARNING_SECONDS = 600;
export const DANGER_SECONDS = 300;

const pad = (n: number) => String(n).padStart(2, '0');

export const formatClock = (seconds: number) =>
  `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

export type TimerLevel = 'normal' | 'warning' | 'danger';

// Short sections scale the thresholds down, or a 1-minute section would start in the danger state.
export function timerLevel(seconds: number, total: number | null): TimerLevel {
  const warning = total
    ? Math.min(WARNING_SECONDS, total * 0.25)
    : WARNING_SECONDS;
  const danger = total ? Math.min(DANGER_SECONDS, total * 0.1) : DANGER_SECONDS;
  if (seconds < danger) return 'danger';
  if (seconds < warning) return 'warning';
  return 'normal';
}

export function ExamTimer({
  seconds,
  total = null,
}: {
  seconds: number;
  total?: number | null;
}) {
  const t = useTranslations('taking');
  const level = timerLevel(seconds, total);

  return (
    <div
      role="timer"
      data-level={level}
      aria-label={t('timerLabel', {
        minutes: Math.floor(seconds / 60),
        seconds: seconds % 60,
      })}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full px-3 text-base font-semibold tabular-nums transition-colors',
        level === 'normal' && 'bg-default text-foreground',
        level === 'warning' && 'bg-warning/20 text-foreground',
        level === 'danger' && 'bg-danger text-danger-foreground',
        level === 'danger' && seconds < 60 && 'animate-pulse',
      )}
    >
      <LuClock aria-hidden className="size-4" />
      {formatClock(seconds)}
    </div>
  );
}
