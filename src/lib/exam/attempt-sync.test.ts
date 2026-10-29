import { describe, expect, it } from 'vitest';

import type { StudentQuestionGroup } from '@/types/student-test';

import { attemptSection, makeAttempt } from '@/test/fixtures/attempt';
import { makeTest } from '@/test/fixtures/student-test';

import {
  chunk,
  diffAnswers,
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

describe('stateFromAttempt', () => {
  it('maps saved answers and flags to question numbers', () => {
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
      answers: { 30: { 1: 'Smith', 3: ['A', 'C'] }, 31: { 1: 'i' } },
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
      answers: { 30: { 1: 'Smith', 2: 'CB2' }, 31: { 1: '' } },
      flagged: { 30: [5] },
      submitted: [],
    };

    expect(diffAnswers(test, saved, next)).toEqual([
      { questionId: 2, response: { text: 'CB2' }, flagged: false },
      { questionId: 4, response: null, flagged: true },
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
