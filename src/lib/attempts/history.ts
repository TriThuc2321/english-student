import type { AttemptListItem } from '@/types/attempt';
import type { ExamType, SkillType } from '@/types/student-test';

import { ROUTES } from '@/constants/routes';
import { overallScore } from '@/lib/results/view';

export type AttemptScore =
  | { kind: 'none' }
  | { kind: 'pending' }
  | { kind: 'overall'; value: string; max: number | null }
  | { kind: 'sections'; items: { skill: SkillType; value: string }[] };

export type AttemptAction =
  | { kind: 'resume'; href: string }
  | { kind: 'results'; href: string }
  | { kind: 'none' };

const formatScore = (value: number, examType: ExamType) =>
  examType.startsWith('IELTS') ? value.toFixed(1) : String(Math.round(value));

export function attemptScore(attempt: AttemptListItem): AttemptScore {
  if (attempt.status === 'IN_PROGRESS') return { kind: 'none' };
  const { examType } = attempt.test;
  const overall = overallScore(attempt);
  if (overall !== null) {
    return {
      kind: 'overall',
      value: formatScore(overall, examType),
      max: examType === 'TOEIC_LR' ? 990 : null,
    };
  }
  const items = [...attempt.sections]
    .sort((a, b) => a.order - b.order)
    .flatMap((s) =>
      s.scaledScore === null
        ? []
        : [{ skill: s.skill, value: formatScore(s.scaledScore, examType) }],
    );
  if (items.length > 0) return { kind: 'sections', items };
  return attempt.status === 'SUBMITTED'
    ? { kind: 'pending' }
    : { kind: 'none' };
}

export function attemptAction(attempt: AttemptListItem): AttemptAction {
  if (attempt.status === 'IN_PROGRESS') {
    return {
      kind: 'resume',
      href: ROUTES.takeTest(
        attempt.testSlug,
        attempt.mode === 'SECTION'
          ? attempt.sections.map((s) => s.sectionId)
          : null,
      ),
    };
  }
  // The result endpoint refuses attempts that still wait for a teacher's grade.
  if (attempt.status === 'SUBMITTED') return { kind: 'none' };
  return { kind: 'results', href: ROUTES.attemptResult(attempt.id) };
}
