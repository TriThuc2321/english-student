import { useTranslations } from 'next-intl';
import { useId } from 'react';

import type {
  AssessmentEntryView,
  SectionAssessment,
} from '@/lib/results/view';

const CRITERIA = ['TA', 'TR', 'CC', 'LR', 'GRA', 'FC', 'P'] as const;
type Criterion = (typeof CRITERIA)[number];
const isCriterion = (code: string): code is Criterion =>
  (CRITERIA as readonly string[]).includes(code);

const band = (value: number) => value.toFixed(1);
const MAX_BAND = 9;

function Feedback({ text }: { text: string }) {
  const t = useTranslations('results');
  return (
    <div className="border-border rounded-lg border border-dashed px-3.5 py-3">
      <p className="text-muted text-xs">{t('teacherFeedback')}</p>
      <p className="mt-0.5 text-sm leading-6 whitespace-pre-line">{text}</p>
    </div>
  );
}

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
          <dl className="grid gap-2 sm:grid-cols-2">
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
          {entry.feedback && <Feedback text={entry.feedback} />}
        </div>
      ))}
    </section>
  );
}

// One task's grade, sized for a side column next to the answer it scores.
export function GradeCard({ entry }: { entry: AssessmentEntryView }) {
  const t = useTranslations('results');
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="bg-surface shadow-surface flex flex-col gap-5 rounded-2xl p-6"
    >
      <div>
        <h3 id={headingId} className="eyebrow">
          {t('teacherGrade')}
        </h3>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">
            {band(entry.band)}
          </span>
          <span className="text-muted text-sm">{t('bandLabel')}</span>
        </p>
      </div>
      <dl className="flex flex-col gap-3.5">
        {entry.criteria.map((c) => (
          <div key={c.code} className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-3 text-sm">
              <dt>{isCriterion(c.code) ? t(`criteria.${c.code}`) : c.code}</dt>
              <dd className="font-semibold tabular-nums">{band(c.band)}</dd>
            </div>
            <div
              aria-hidden
              className="bg-surface-tertiary h-1.5 overflow-hidden rounded-full"
            >
              <div
                className="bg-brand-navy h-full rounded-full"
                style={{ width: `${(c.band / MAX_BAND) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </dl>
      {entry.feedback && <Feedback text={entry.feedback} />}
    </section>
  );
}
