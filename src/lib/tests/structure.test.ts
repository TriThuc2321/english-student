import { describe, expect, it } from 'vitest';

import type { StudentTestSectionDetail } from '@/types/student-test';

import { countSectionQuestions } from './structure';

const question = (n: number, numberTo = n) => ({
  id: n,
  numberFrom: n,
  numberTo,
  order: n,
});

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => question(from + i));

const section = (
  testParts: StudentTestSectionDetail['testParts'],
): StudentTestSectionDetail => ({
  id: 1,
  skill: 'LISTENING',
  order: 1,
  durationMinutes: 30,
  testParts,
});

describe('countSectionQuestions', () => {
  it('sums question number ranges across parts', () => {
    const result = countSectionQuestions(
      section([
        {
          id: 1,
          order: 1,
          title: 'Part 1',
          questionGroups: [{ id: 1, order: 1, questions: range(1, 10) }],
        },
        {
          id: 2,
          order: 2,
          title: 'Part 2',
          questionGroups: [
            { id: 2, order: 1, questions: range(11, 18) },
            { id: 3, order: 2, questions: [question(19, 20)] },
          ],
        },
      ]),
    );
    expect(result).toBe(20);
  });

  it('returns 0 for a section with no parts', () => {
    expect(countSectionQuestions(section([]))).toBe(0);
  });
});
