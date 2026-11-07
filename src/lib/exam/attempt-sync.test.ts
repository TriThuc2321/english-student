import { describe, expect, it } from 'vitest';

import type { StudentQuestionGroup } from '@/types/student-test';

import { attemptSection, makeAttempt } from '@/test/fixtures/attempt';
import { makeTest } from '@/test/fixtures/student-test';

import {
  chunk,
  diffAnswers,
  MAX_ESSAY_LENGTH,
  remainingFromAttempt,
  responseFor,
  stateFromAttempt,
} from './attempt-sync';

const group = (
  questionType: StudentQuestionGroup['questionType'],
  content: StudentQuestionGroup['content'] = null,
): StudentQuestionGroup => ({
  id: 1,
  order: 1,
  questionType,
  instruction: null,
  wordLimit: null,
  content,
  audio: null,
  image: null,
  passages: [],
  questions: [],
});

describe('responseFor', () => {
  it.each([
    ['MULTIPLE_CHOICE', 'B', { key: 'B' }],
    ['MATCHING_HEADINGS', ' iv ', { key: 'iv' }],
    ['MULTIPLE_CHOICE_MULTI', ['A', 'D', 'A'], { keys: ['A', 'D'] }],
    ['FORM_COMPLETION', ' Smith ', { text: 'Smith' }],
    ['MULTIPLE_CHOICE', '', null],
    ['MULTIPLE_CHOICE_MULTI', [], null],
    ['OPINION_ESSAY', 'An essay', null],
    ['IELTS_WRITING_TASK_2', ' An essay ', { text: 'An essay' }],
    ['IELTS_SPEAKING_PART_1', '42', null],
  ] as const)('maps a %s answer %j', (type, value, expected) => {
    expect(responseFor(group(type), value as string | string[])).toEqual(
      expected,
    );
  });

  it('answers a word-bank summary with a key and a free one with text', () => {
    expect(
      responseFor(
        group('SUMMARY_COMPLETION', { options: [{ key: 'A', text: 'x' }] }),
        'A',
      ),
    ).toEqual({ key: 'A' });
    expect(responseFor(group('SUMMARY_COMPLETION'), 'tea')).toEqual({
      text: 'tea',
    });
  });

  it('cuts text to the length the API accepts', () => {
    const response = responseFor(group('SHORT_ANSWER'), 'x'.repeat(300));
    expect(response).toEqual({ text: 'x'.repeat(255) });
  });
});

describe('essays', () => {
  it('saves an essay as text up to 20,000 characters', () => {
    expect(MAX_ESSAY_LENGTH).toBe(20_000);
    expect(
      responseFor(group('IELTS_WRITING_TASK_1'), 'a'.repeat(25_000)),
    ).toEqual({ text: 'a'.repeat(20_000) });
    const essay = 'word '.repeat(60).trim();
    expect(responseFor(group('IELTS_WRITING_TASK_2'), essay)).toEqual({
      text: essay,
    });
  });

  it('still clips short answers at 255', () => {
    expect(responseFor(group('SHORT_ANSWER'), 'x'.repeat(300))).toEqual({
      text: 'x'.repeat(255),
    });
  });
});

// One IELTS Speaking question (id 50, number 1) in section 40.
const speakingTest = () => {
  const base = makeTest();
  const [listening] = base.testSections;
  const [part] = listening.testParts;
  const [g] = part.questionGroups;
  return makeTest({
    testSections: [
      {
        ...listening,
        id: 40,
        skill: 'SPEAKING',
        testParts: [
          {
            ...part,
            id: 400,
            questionGroups: [
              {
                ...g,
                id: 4000,
                questionType: 'IELTS_SPEAKING_PART_1',
                questions: [
                  { ...g.questions[0], id: 50, numberFrom: 1, numberTo: 1 },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
};

describe('recordings', () => {
  const empty = { answers: {}, flagged: {} };

  it('skips Speaking questions even when only the flag changed', () => {
    const next = { answers: {}, flagged: { 40: [1] }, submitted: [] };
    expect(diffAnswers(speakingTest(), empty, next)).toEqual([]);
  });

  it('never sends a Speaking answer', () => {
    const next = { answers: { 40: { 1: '42' } }, flagged: {}, submitted: [] };
    expect(diffAnswers(speakingTest(), empty, next)).toEqual([]);
  });

  it('restores a recording as an answered value', () => {
    const attempt = makeAttempt({
      sections: [
        attemptSection(40, { skill: 'SPEAKING', status: 'IN_PROGRESS' }),
      ],
      answers: [
        {
          questionId: 50,
          response: { mediaId: 42 },
          flagged: false,
          answeredAt: '2026-10-27T19:05:00.000Z',
        },
      ],
    });
    expect(stateFromAttempt(speakingTest(), attempt).answers).toEqual({
      40: { 50: '42' },
    });
  });
});

describe('stateFromAttempt', () => {
  it('maps saved answers and flags to question ids', () => {
    const attempt = makeAttempt({
      answers: [
        {
          questionId: 1,
          response: { text: 'Smith' },
          flagged: false,
          answeredAt: null,
        },
        {
          questionId: 3,
          response: { keys: ['A', 'C'] },
          flagged: true,
          answeredAt: null,
        },
        {
          questionId: 10,
          response: { key: 'i' },
          flagged: false,
          answeredAt: null,
        },
        {
          questionId: 999,
          response: { key: 'A' },
          flagged: true,
          answeredAt: null,
        },
      ],
    });

    expect(stateFromAttempt(makeTest(), attempt)).toEqual({
      answers: { 30: { 1: 'Smith', 3: ['A', 'C'] }, 31: { 10: 'i' } },
      flagged: { 30: [3] },
      remaining: { 30: 1800 },
      submitted: [],
    });
  });
});

describe('remainingFromAttempt', () => {
  it('counts down open sections from the server clock', () => {
    const attempt = makeAttempt({
      serverNow: '2026-10-27T19:20:00.000Z',
      sections: [
        attemptSection(30, { status: 'SUBMITTED' }),
        attemptSection(31, {
          status: 'IN_PROGRESS',
          deadlineAt: '2026-10-27T19:25:30.000Z',
        }),
      ],
    });

    expect(remainingFromAttempt(attempt)).toEqual({ 30: 0, 31: 330 });
  });

  it('falls back to the attempt deadline and never goes negative', () => {
    const attempt = makeAttempt({
      serverNow: '2026-10-27T21:00:00.000Z',
      deadlineAt: '2026-10-27T20:00:00.000Z',
      sections: [attemptSection(30, { status: 'IN_PROGRESS' })],
    });

    expect(remainingFromAttempt(attempt)).toEqual({ 30: 0 });
  });
});

describe('diffAnswers', () => {
  const test = makeTest();
  const empty = { answers: {}, flagged: {} };

  it('sends changed answers and flags only', () => {
    const saved = { answers: { 30: { 1: 'Smith' } }, flagged: {} };
    const next = {
      answers: { 30: { 1: 'Smith', 2: 'CB2' }, 31: { 10: '' } },
      flagged: { 30: [4] },
      submitted: [],
    };

    expect(diffAnswers(test, saved, next)).toEqual([
      { questionId: 2, response: { text: 'CB2' }, flagged: false },
      { questionId: 4, response: null, flagged: true },
    ]);
  });

  it('keeps questions that share a number apart', () => {
    const shared = makeTest();
    const [q4] =
      shared.testSections[0].testParts[1].questionGroups[0].questions;
    q4.numberFrom = 1;
    q4.numberTo = 1;
    const next = {
      answers: { 30: { 1: 'first', 4: 'second' } },
      flagged: {},
      submitted: [],
    };

    expect(diffAnswers(shared, empty, next)).toEqual([
      { questionId: 1, response: { text: 'first' }, flagged: false },
      { questionId: 4, response: { key: 'second' }, flagged: false },
    ]);
  });

  it('clears an answer that was erased', () => {
    const saved = { answers: { 30: { 1: 'Smith' } }, flagged: {} };
    const next = { answers: { 30: { 1: ' ' } }, flagged: {}, submitted: [] };

    expect(diffAnswers(test, saved, next)).toEqual([
      { questionId: 1, response: null, flagged: false },
    ]);
  });

  it('skips sections that are already submitted', () => {
    const next = {
      answers: { 30: { 1: 'Smith' } },
      flagged: {},
      submitted: [30],
    };

    expect(diffAnswers(test, empty, next)).toEqual([]);
  });
});

describe('chunk', () => {
  it('splits items into batches', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
