'use client';

import { useTranslations } from 'next-intl';
import { LuHeadphones } from 'react-icons/lu';

import type { StudentTestPart } from '@/types/student-test';

import { ExamAudio } from './questions/media';

type PartHeadingProps = {
  part: StudentTestPart;
  index: number;
};

export function PartHeading({ part, index }: PartHeadingProps) {
  const t = useTranslations('taking');
  const fallback = t('partFallback', { n: index + 1 });
  return (
    <div>
      <p className="text-brand-navy mb-1 text-xs font-semibold tracking-[.08em] uppercase">
        {fallback}
      </p>
      {part.title && part.title !== fallback && (
        <h2 className="text-2xl font-semibold">{part.title}</h2>
      )}
      {part.instruction && (
        <p className="text-muted mt-2 whitespace-pre-line">
          {part.instruction}
        </p>
      )}
    </div>
  );
}

export function PartAudioCard({ part, index }: PartHeadingProps) {
  const t = useTranslations('taking');
  if (!part.audio) return null;
  const name = part.title ?? t('partFallback', { n: index + 1 });
  return (
    // Sticky inside the scrolling column so the player stays reachable while answering.
    <div className="bg-background sticky top-0 z-10 px-4 pt-5 pb-3 sm:px-6">
      <section
        aria-label={t('partAudio', { part: name })}
        className="border-border bg-surface shadow-surface mx-auto flex max-w-[920px] flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border px-5 py-3.5"
      >
        <span
          aria-hidden
          className="bg-brand-navy-soft text-brand-navy grid size-10 flex-none place-items-center rounded-full"
        >
          <LuHeadphones className="size-5" />
        </span>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
          <span className="text-sm font-semibold">
            {t('partAudio', { part: name })}
          </span>
          <ExamAudio
            media={part.audio}
            startMs={part.audioStartMs}
            endMs={part.audioEndMs}
            className="mb-0"
          />
        </div>
      </section>
    </div>
  );
}
