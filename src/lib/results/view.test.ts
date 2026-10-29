import { describe, expect, it } from 'vitest';

import {
  attemptSection,
  makeAttemptResult,
  resultQuestion,
} from '@/test/fixtures/attempt';
import { makeTest } from '@/test/fixtures/student-test';

import { buildResultView, ieltsBand } from './view';

const statuses = (view: ReturnType<typeof buildResultView>, i: number) =>
  view.sections[i].items.map((item) => [item.n, item.status]);

describe('buildResultView', () => {
  it('gives every question number a status', () => {
    const view = buildResultView(makeAttemptResult(), makeTest());

    expect(statuses(view, 0)).toEqual([
      [1, 'correct'],
      [2, 'blank'],
      [3, 'correct'],
      [4, 'incorrect'],
      [5, 'correct'],
    ]);
    expect(view.sections[0].counts).toEqual({
      correct: 3,
      incorrect: 1,
      blank: 1,
      pending: 0,
    });
    expect(statuses(view, 1)).toEqual([
      [1, 'correct'],
      [2, 'incorrect'],
    ]);
  });

  it('leaves the unanswered slot of a multi-answer question blank', () => {
    const result = makeAttemptResult({
      questions: [
        resultQuestion(3, 30, 3, {
          numberTo: 4,
          response: { keys: ['A'] },
          isCorrect: false,
          score: 1,
          maxScore: 2,
          answer: { keys: ['A', 'D'] },
        }),
      ],
    });

    expect(statuses(buildResultView(result, makeTest()), 0)).toEqual([
      [3, 'correct'],
      [4, 'blank'],
    ]);
  });

  it('formats answers with their option text', () => {
    const view = buildResultView(makeAttemptResult(), makeTest());
    const [, , q3, , q5] = view.sections[0].items;

    expect(q3.yourAnswer).toEqual([
      { key: 'A', text: 'A swimming pool' },
      { key: 'C', text: 'A cafe' },
    ]);
    expect(q3.correctAnswer).toEqual([
      { key: 'A', text: 'A swimming pool' },
      { key: 'D', text: 'A gym' },
    ]);
    expect(q5).toMatchObject({
      questionType: 'MULTIPLE_CHOICE',
      prompt: 'Where will the tour start?',
      yourAnswer: [{ key: 'B', text: 'In the office' }],
      explanation: 'The speaker says the tour begins in the office.',
    });
    // Matching options live on the group, not the question.
    expect(view.sections[1].items[1].correctAnswer).toEqual([
      { key: 'ii', text: 'A journey across continents' },
    ]);
  });

  it('lists the other accepted spellings of a text answer', () => {
    const view = buildResultView(makeAttemptResult(), makeTest());

    expect(view.sections[0].items[0]).toMatchObject({
      yourAnswer: [{ key: null, text: 'Smith' }],
      correctAnswer: [{ key: null, text: 'Smith' }],
      alsoAccepted: ['Mr Smith'],
    });
  });

  it('labels evidence with the paragraph letter', () => {
    const view = buildResultView(makeAttemptResult(), makeTest());

    expect(view.sections[1].items[0].evidence).toEqual({
      quote: 'first cultivated',
      paragraph: 'A',
    });
  });

  it('breaks scores down by part and by question type', () => {
    const view = buildResultView(makeAttemptResult(), makeTest());

    expect(view.sections[0].byPart).toEqual([
      expect.objectContaining({ correct: 2, total: 4, pct: 50, weak: true }),
      expect.objectContaining({ correct: 1, total: 1, pct: 100, weak: false }),
    ]);
    expect(
      view.sections[0].byType.map((b) => [b.label, b.correct, b.total]),
    ).toEqual([
      ['FORM_COMPLETION', 1, 2],
      ['MULTIPLE_CHOICE', 2, 3],
    ]);
  });

  it('marks human-graded sections as pending', () => {
    const result = makeAttemptResult(
      {
        questions: [
          resultQuestion(1, 30, 1, {
            response: { text: 'An essay' },
            answer: { sample: 'A model essay' },
          }),
        ],
      },
      { sections: [attemptSection(30, { skill: 'WRITING' })] },
    );
    const view = buildResultView(result, makeTest());

    expect(view.skills[0].pending).toBe(true);
    expect(view.sections[0].items[0]).toMatchObject({
      status: 'pending',
      correctAnswer: null,
    });
    expect(view.sections[0].byType).toEqual([]);
  });

  it('estimates the IELTS band from listening and reading', () => {
    const view = buildResultView(makeAttemptResult(), makeTest());

    expect(view.total).toEqual({ kind: 'ielts', band: 7, max: 9 });
  });

  it('shows no IELTS total for practice sections', () => {
    const result = makeAttemptResult({}, { mode: 'SECTION' });

    expect(buildResultView(result, makeTest()).total).toBeNull();
  });

  it('uses the TOEIC overall score', () => {
    const result = makeAttemptResult(
      {},
      {
        overallScore: 755,
        test: {
          id: 1,
          slug: 'practice-test-1',
          title: 'Practice Test 1',
          examType: 'TOEIC_LR',
        },
      },
    );

    expect(buildResultView(result, makeTest()).total).toMatchObject({
      kind: 'toeic',
      score: 755,
      max: 990,
    });
  });
});

describe('ieltsBand', () => {
  it.each([
    [[6, 6.5], 6.5],
    [[6.5, 7], 7],
    [[6, 6], 6],
    [[7, 6, 6, 6], 6.5],
    [[6, 6, 6, 5.5], 6],
  ])('rounds %j to %d', (bands, expected) => {
    expect(ieltsBand(bands)).toBe(expected);
  });
});

describe('transcripts', () => {
  it('attaches each transcript to the section that plays its audio', () => {
    const view = buildResultView(makeAttemptResult(), makeTest());

    expect(view.sections[0].transcripts).toEqual([
      {
        mediaId: 1,
        partTitle: 'Part 1',
        partOrder: 1,
        transcript: 'Good morning, how can I help?',
      },
    ]);
    expect(view.sections[1].transcripts).toEqual([]);
  });
});
