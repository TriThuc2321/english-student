'use client';

import { useTranslations } from 'next-intl';

import type { StudentTestPart } from '@/types/student-test';

import { ExamAudio } from './questions/media';

export function PartBanner({
  part,
  index,
}: {
  part: StudentTestPart;
  index: number;
}) {
  const t = useTranslations('taking');
  return (
    <div className="border-border bg-surface border-b px-4 py-3">
      <h2 className="text-foreground/60 text-sm font-semibold uppercase">
        {part.title ?? t('partFallback', { n: index + 1 })}
      </h2>
      {part.instruction && (
        <p className="text-foreground/80 mt-1 text-sm whitespace-pre-line">
          {part.instruction}
        </p>
      )}
      {part.audio && (
        <div className="mt-2">
          <ExamAudio
            media={part.audio}
            startMs={part.audioStartMs}
            endMs={part.audioEndMs}
          />
        </div>
      )}
    </div>
  );
}
