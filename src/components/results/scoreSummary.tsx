import { useTranslations } from 'next-intl';

import type { ResultView } from '@/lib/results/view';

import { SKILL_ICONS } from '@/components/tests/skillBadges';

type ScoreSummaryProps = {
  view: ResultView;
};

export function ScoreSummary({ view }: ScoreSummaryProps) {
  const t = useTranslations();
  const { total, skills } = view;

  return (
    <section
      aria-label={t('results.scoreLabel')}
      className="bg-surface border-separator shadow-surface flex flex-wrap gap-4 rounded-2xl border p-6"
    >
      {total && (
        <div className="flex flex-[1_1_240px] flex-col justify-center gap-1 py-2 pr-6 pl-2">
          <p className="text-brand-navy text-xs font-semibold tracking-[0.08em] uppercase">
            {total.kind === 'toeic'
              ? t('results.totalToeic')
              : t('results.totalIelts')}
          </p>
          <p className="flex items-baseline gap-2">
            <span className="text-6xl leading-none font-extrabold tracking-tight">
              {total.kind === 'toeic' ? total.score : total.band.toFixed(1)}
            </span>
            <span className="text-muted text-lg">
              {t('results.outOf', { max: total.max })}
            </span>
          </p>
          <p className="text-muted mt-1 text-sm">
            {total.kind === 'toeic'
              ? total.parts
                  .map(
                    (p) =>
                      `${t(`exam.skill.${p.skill}`)} ${p.scaledScore ?? t('results.noScore')}`,
                  )
                  .join(' + ')
              : t('results.totalIeltsNote')}
          </p>
        </div>
      )}
      <ul className="grid flex-[999_1_520px] grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-3">
        {skills.map((s) => {
          const Icon = SKILL_ICONS[s.skill];
          const score =
            s.scaledScore === null
              ? t('results.noScore')
              : view.examType.startsWith('IELTS')
                ? s.scaledScore.toFixed(1)
                : String(s.scaledScore);
          return (
            <li
              key={s.sectionId}
              className="bg-surface-secondary flex flex-col gap-1 rounded-xl p-4"
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Icon aria-hidden className="text-brand-navy size-4" />
                {t(`exam.skill.${s.skill}`)}
              </span>
              <span className="text-[32px] leading-10 font-bold">{score}</span>
              <span className="text-muted text-[13px] leading-[18px]">
                {s.pending || s.rawScore === null || s.maxScore === null
                  ? t('results.gradingPending')
                  : t('results.rawCorrect', {
                      correct: s.rawScore,
                      total: s.maxScore,
                    })}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
