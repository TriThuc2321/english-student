import type {
  Attempt,
  AttemptListItem,
  AttemptResult,
  AttemptResultQuestion,
  AttemptSection,
} from '@/types/attempt';

export const ATTEMPT_ID = '6f1c2b8e-2a4d-4a8e-9b7a-2f8f3c1d5e01';

export const attemptSection = (
  sectionId: number,
  overrides: Partial<AttemptSection> = {},
): AttemptSection => ({
  id: `as-${sectionId}`,
  sectionId,
  skill: 'LISTENING',
  order: 1,
  status: 'SUBMITTED',
  startedAt: '2026-10-27T19:00:00.000Z',
  deadlineAt: null,
  submittedAt: '2026-10-27T19:30:00.000Z',
  rawScore: null,
  maxScore: null,
  scaledScore: null,
  ...overrides,
});

export const resultQuestion = (
  questionId: number,
  sectionId: number,
  numberFrom: number,
  overrides: Partial<AttemptResultQuestion> = {},
): AttemptResultQuestion => ({
  questionId,
  sectionId,
  numberFrom,
  numberTo: numberFrom,
  response: null,
  isCorrect: null,
  score: 0,
  maxScore: 1,
  flagged: false,
  answer: { key: 'A' },
  explanation: null,
  evidence: null,
  ...overrides,
});

export function makeAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: ATTEMPT_ID,
    testId: 1,
    testSlug: 'practice-test-1',
    mode: 'FULL',
    status: 'IN_PROGRESS',
    startedAt: '2026-10-27T19:00:00.000Z',
    deadlineAt: null,
    submittedAt: null,
    overallScore: null,
    serverNow: '2026-10-27T19:00:00.000Z',
    sections: [
      attemptSection(30, {
        status: 'IN_PROGRESS',
        submittedAt: null,
        deadlineAt: '2026-10-27T19:30:00.000Z',
      }),
      attemptSection(31, {
        skill: 'READING',
        order: 2,
        status: 'NOT_STARTED',
        startedAt: null,
        submittedAt: null,
      }),
    ],
    answers: [],
    ...overrides,
  };
}

// Matches the questions of makeTest() in ./student-test.
export function makeAttemptResult(
  overrides: Partial<AttemptResult> = {},
  attempt: Partial<AttemptListItem> = {},
): AttemptResult {
  return {
    attempt: {
      id: ATTEMPT_ID,
      testId: 1,
      testSlug: 'practice-test-1',
      mode: 'FULL',
      status: 'GRADED',
      startedAt: '2026-10-27T19:00:00.000Z',
      deadlineAt: null,
      submittedAt: '2026-10-27T20:12:00.000Z',
      overallScore: null,
      sections: [
        attemptSection(30, { rawScore: 3, maxScore: 5, scaledScore: 6.5 }),
        attemptSection(31, {
          skill: 'READING',
          order: 2,
          rawScore: 1,
          maxScore: 2,
          scaledScore: 7,
        }),
      ],
      test: {
        id: 1,
        slug: 'practice-test-1',
        title: 'Practice Test 1',
        examType: 'IELTS_ACADEMIC',
      },
      ...attempt,
    },
    questions: [
      resultQuestion(1, 30, 1, {
        response: { text: 'Smith' },
        isCorrect: true,
        score: 1,
        answer: { accepted: ['Smith', 'Mr Smith'] },
      }),
      resultQuestion(2, 30, 2, { answer: { accepted: ['CB2 1TN'] } }),
      resultQuestion(3, 30, 3, {
        numberTo: 4,
        response: { keys: ['A', 'C'] },
        isCorrect: false,
        score: 1,
        maxScore: 2,
        answer: { keys: ['A', 'D'] },
      }),
      resultQuestion(4, 30, 5, {
        response: { key: 'B' },
        isCorrect: true,
        score: 1,
        answer: { key: 'B' },
        explanation: 'The speaker says the tour begins in the office.',
      }),
      resultQuestion(10, 31, 1, {
        response: { key: 'i' },
        isCorrect: true,
        score: 1,
        answer: { key: 'i' },
        evidence: { paragraphId: 1, quote: 'first cultivated' },
      }),
      resultQuestion(11, 31, 2, {
        response: { key: 'iii' },
        isCorrect: false,
        answer: { key: 'ii' },
      }),
    ],
    transcripts: [{ mediaId: 1, transcript: 'Good morning, how can I help?' }],
    ...overrides,
  };
}
