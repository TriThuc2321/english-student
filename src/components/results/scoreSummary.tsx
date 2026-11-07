import { useTranslations } from 'next-intl';

import type { ResultView } from '@/lib/results/view';

import { SKILL_ICONS } from '@/components/tests/skillBadges';
import { SKILL_CLASSES } from '@/constants/exam';

type ScoreSummaryProps = {
  view: ResultView;
};

export function ScoreSummary({ view }: ScoreSummaryProps) {
  const t = useTranslations();
  const { total, skills } = view;

  return (
    <section
      aria-label={t('results.scoreLabel')}
      className="bg-surface shadow-surface flex flex-wrap gap-4 rounded-2xl p-6"
    >
      {total && (
        <div className="flex flex-[1_1_240px] flex-col justify-center gap-1 py-2 pr-6 pl-2">
          <p className="eyebrow">
            {total.kind === 'toeic'
              ? t('results.totalToeic')
              : total.estimate
                ? t('results.totalIelts')
                : t('results.totalIeltsFinal')}
          </p>
          <p className="flex items-baseline gap-2">
            <span className="text-6xl leading-none font-semibold tracking-tighter tabular-nums">
              {total.kind === 'toeic' ? total.score : total.band.toFixed(1)}
            </span>
            <span className="text-muted text-lg">
              {t('results.outOf', { max: total.max })}
            </span>
          </p>
          {(total.kind === 'toeic' || total.estimate) && (
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
          )}
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
              <span className="flex items-center gap-2 text-sm font-medium">
                <span
                  aria-hidden
                  className={`grid size-7 place-items-center rounded-lg ${SKILL_CLASSES[s.skill]}`}
                >
                  <Icon className="size-3.5" />
                </span>
                {t(`exam.skill.${s.skill}`)}
              </span>
              <span className="mt-1 text-3xl leading-10 font-semibold tracking-tight tabular-nums">
                {score}
              </span>
              <span className="text-muted text-[13px] leading-[18px]">
                {s.pending
                  ? t('results.gradingPending')
                  : s.rawScore === null || s.maxScore === null
                    ? s.scaledScore === null
                      ? t('results.gradingPending')
                      : t('results.status.graded')
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
