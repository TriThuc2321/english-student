import { describe, expect, it } from 'vitest';

import { attemptSection, makeAttemptResult } from '@/test/fixtures/attempt';
import { makeTest } from '@/test/fixtures/student-test';

import {
  buildReviewModel,
  initialPosition,
  partAssessment,
  partTranscripts,
  reviewSlots,
} from './review';
import { buildResultView } from './view';

const build = (result = makeAttemptResult(), test = makeTest()) =>
  buildReviewModel(result, test, buildResultView(result, test));

describe('buildReviewModel', () => {
  it('turns responses into exam answers keyed by question id', () => {
    const model = build();

    expect(model.answers).toEqual({
      1: 'Smith',
      3: ['A', 'C'],
      4: 'B',
      10: 'i',
      11: 'iii',
    });
  });

  it('groups review items by question', () => {
    const model = build();

    expect(model.items[3].map((item) => [item.n, item.status])).toEqual([
      [3, 'correct'],
      [4, 'incorrect'],
    ]);
    expect(model.items[4][0].explanation).toBe(
      'The speaker says the tour begins in the office.',
    );
  });

  it('keeps only the sections the attempt covered', () => {
    const result = makeAttemptResult(
      {},
      {
        mode: 'SECTION',
        sections: [attemptSection(31, { skill: 'READING' })],
      },
    );
    const model = build(result);

    expect(model.test.testSections.map((s) => s.id)).toEqual([31]);
    expect(model.sections.map((s) => s.sectionId)).toEqual([31]);
  });
});

describe('reviewSlots', () => {
  it('lists every number in exam order with its status', () => {
    const slots = reviewSlots(build());

    expect(slots.map((s) => [s.sectionId, s.n, s.status])).toEqual([
      [30, 1, 'correct'],
      [30, 2, 'blank'],
      [30, 3, 'correct'],
      [30, 4, 'incorrect'],
      [30, 5, 'correct'],
      [31, 1, 'correct'],
      [31, 2, 'incorrect'],
    ]);
  });
});

describe('partTranscripts', () => {
  it('keeps the transcripts of the audio used in the part', () => {
    const model = build();
    const [listening] = model.test.testSections;
    const transcripts = model.sections[0].transcripts;

    expect(partTranscripts(listening.testParts[0], transcripts)).toHaveLength(
      1,
    );
    expect(partTranscripts(listening.testParts[1], transcripts)).toEqual([]);
  });
});

describe('partAssessment', () => {
  const assessment = {
    band: 6.5,
    entries: [
      {
        partId: 400,
        partTitle: 'Task 1',
        partOrder: 1,
        band: 6,
        criteria: [],
        feedback: null,
      },
      {
        partId: null,
        partTitle: null,
        partOrder: null,
        band: 7,
        criteria: [],
        feedback: null,
      },
    ],
  };

  it('shows a part its own entry, and the first part the section-wide one', () => {
    expect(
      partAssessment(assessment, 400, true)?.entries.map((e) => e.partId),
    ).toEqual([400, null]);
    expect(partAssessment(assessment, 401, false)).toBeNull();
    expect(partAssessment(null, 400, true)).toBeNull();
  });
});

describe('initialPosition', () => {
  it('opens on the requested question', () => {
    expect(initialPosition(build(), { q: '11' })).toEqual({
      sectionId: 31,
      partId: 310,
      questionId: 11,
    });
  });

  it('falls back to the requested section, then the first one', () => {
    expect(initialPosition(build(), { section: '31' })).toEqual({
      sectionId: 31,
      partId: 310,
      questionId: null,
    });
    expect(initialPosition(build(), { q: 'nope' })).toEqual({
      sectionId: 30,
      partId: 300,
      questionId: null,
    });
  });
});
