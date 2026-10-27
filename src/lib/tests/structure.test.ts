import { describe, expect, it } from 'vitest';

import type {
  StudentQuestion,
  StudentQuestionGroup,
  StudentTestPart,
  StudentTestSectionDetail,
} from '@/types/student-test';

import { countSectionQuestions } from './structure';

const question = (n: number, numberTo = n): StudentQuestion => ({
  id: n,
  numberFrom: n,
  numberTo,
  order: n,
  prompt: null,
  content: null,
  audioStartMs: null,
  audio: null,
  image: null,
});

const group = (
  id: number,
  questions: StudentQuestion[],
): StudentQuestionGroup => ({
  id,
  order: id,
  questionType: 'SHORT_ANSWER',
  instruction: null,
  wordLimit: null,
  content: null,
  audio: null,
  image: null,
  passages: [],
  questions,
});

const part = (
  id: number,
  questionGroups: StudentQuestionGroup[],
): StudentTestPart => ({
  id,
  order: id,
  title: `Part ${id}`,
  instruction: null,
  audio: null,
  audioStartMs: null,
  audioEndMs: null,
  passage: null,
  questionGroups,
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
        part(1, [group(1, range(1, 10))]),
        part(2, [group(2, range(11, 18)), group(3, [question(19, 20)])]),
      ]),
    );
    expect(result).toBe(20);
  });

  it('returns 0 for a section with no parts', () => {
    expect(countSectionQuestions(section([]))).toBe(0);
  });
});
