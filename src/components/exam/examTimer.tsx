import { cn } from '@heroui/react';

const WARNING_SECONDS = 300;

const pad = (n: number) => String(n).padStart(2, '0');

export function ExamTimer({ seconds }: { seconds: number }) {
  return (
    <span
      role="timer"
      className={cn(
        'font-mono text-lg font-semibold tabular-nums',
        seconds < WARNING_SECONDS ? 'text-warning' : 'text-foreground',
      )}
    >
      {pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}
    </span>
  );
}
