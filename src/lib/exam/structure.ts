import type {
  StudentTestDetail,
  StudentTestSectionDetail,
} from '@/types/student-test';

export type Answer = string | string[];

export type PartRef = { sectionId: number; partId: number | null };

export type QuestionSlot = { n: number; from: number; partId: number };

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
          slots.push({ n, from: q.numberFrom, partId: part.id });
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

export function isAnswered(value: Answer | undefined, count: number): boolean {
  if (value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return value.length === count;
}
