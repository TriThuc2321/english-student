import type {
  StudentTestDetail,
  StudentTestSectionDetail,
} from '@/types/student-test';

export type Answer = string | string[];

export type PartRef = { sectionId: number; partId: number | null };

export type QuestionSlot = {
  n: number;
  from: number;
  questionId: number;
  partId: number;
};

const byOrder = <T extends { order: number }>(items: T[]) =>
  [...items].sort((a, b) => a.order - b.order);

export function partSequence(test: StudentTestDetail): PartRef[] {
  return byOrder(test.testSections).flatMap((section): PartRef[] =>
    section.testParts.length === 0
      ? [{ sectionId: section.id, partId: null }]
      : byOrder(section.testParts).map((part) => ({
          sectionId: section.id,
          partId: part.id,
        })),
  );
}

export function questionSlots(
  section: StudentTestSectionDetail,
): QuestionSlot[] {
  const slots: QuestionSlot[] = [];
  for (const part of byOrder(section.testParts)) {
    for (const group of byOrder(part.questionGroups)) {
      for (const q of byOrder(group.questions)) {
        for (let n = q.numberFrom; n <= q.numberTo; n++) {
          slots.push({
            n,
            from: q.numberFrom,
            questionId: q.id,
            partId: part.id,
          });
        }
      }
    }
  }
  return slots;
}

export function sectionDurationSeconds(
  test: StudentTestDetail,
  section: StudentTestSectionDetail,
): number | null {
  const minutes = section.durationMinutes ?? test.durationMinutes;
  return minutes === null ? null : minutes * 60;
}

// A section without its own duration inherits the test's, so the total is a sum, not the test field.
export function totalDurationMinutes(test: {
  durationMinutes: number | null;
  testSections: { durationMinutes: number | null }[];
}): number | null {
  let total: number | null = null;
  for (const section of test.testSections) {
    const minutes = section.durationMinutes ?? test.durationMinutes;
    if (minutes !== null) total = (total ?? 0) + minutes;
  }
  return total ?? test.durationMinutes;
}

export function isAnswered(value: Answer | undefined, count: number): boolean {
  if (value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return value.length === count;
}

export function parseSectionIds(
  param: string | string[] | undefined,
): number[] | null {
  const raw = Array.isArray(param) ? param.join(',') : param;
  if (!raw) return null;
  const ids = raw
    .split(',')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
  return ids.length > 0 ? [...new Set(ids)] : null;
}

// Unknown ids are dropped; a selection with nothing left (or covering everything) runs the full test.
export function pickSections(
  test: StudentTestDetail,
  ids: number[] | null,
): { test: StudentTestDetail; sectionIds: number[] | null } {
  if (!ids) return { test, sectionIds: null };
  const testSections = test.testSections.filter((s) => ids.includes(s.id));
  if (
    testSections.length === 0 ||
    testSections.length === test.testSections.length
  ) {
    return { test, sectionIds: null };
  }
  return {
    test: { ...test, testSections },
    sectionIds: byOrder(testSections).map((s) => s.id),
  };
}
