import { useTranslations } from 'next-intl';
import { useId } from 'react';

import type { SectionAssessment } from '@/lib/results/view';

const CRITERIA = ['TA', 'TR', 'CC', 'LR', 'GRA', 'FC', 'P'] as const;
type Criterion = (typeof CRITERIA)[number];
const isCriterion = (code: string): code is Criterion =>
  (CRITERIA as readonly string[]).includes(code);

const band = (value: number) => value.toFixed(1);

export function AssessmentPanel({
  assessment,
}: {
  assessment: SectionAssessment;
}) {
  const t = useTranslations('results');
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="bg-surface border-separator shadow-surface flex flex-col gap-5 rounded-xl border p-6"
    >
      <h2 id={headingId} className="text-xl font-semibold">
        {t('assessmentTitle', { band: band(assessment.band) })}
      </h2>
      {assessment.entries.map((entry) => (
        <div key={entry.partId ?? 'section'} className="flex flex-col gap-3">
          {entry.partId !== null && (
            <h3 className="font-semibold">
              {t('taskBand', {
                task:
                  entry.partTitle ??
                  t('partFallback', { order: entry.partOrder ?? 1 }),
                band: band(entry.band),
              })}
            </h3>
          )}
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-2">
            {entry.criteria.map((c) => (
              <div
                key={c.code}
                className="bg-surface-secondary flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm"
              >
                <dt>
                  {isCriterion(c.code) ? t(`criteria.${c.code}`) : c.code}
                </dt>
                <dd className="font-semibold tabular-nums">{band(c.band)}</dd>
              </div>
            ))}
          </dl>
          {entry.feedback && (
            <div className="border-border rounded-lg border border-dashed px-3.5 py-3">
              <p className="text-muted text-xs">{t('teacherFeedback')}</p>
              <p className="mt-0.5 text-sm whitespace-pre-line">
                {entry.feedback}
              </p>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
