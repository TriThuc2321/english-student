import { describe, expect, it } from 'vitest';

import { makeTest } from '@/test/fixtures/student-test';

import {
  isAnswered,
  partSequence,
  questionSlots,
  sectionDurationSeconds,
} from './structure';

describe('partSequence', () => {
  it('lists parts by section then part order', () => {
    expect(partSequence(makeTest())).toEqual([
      { sectionId: 30, partId: 300 },
      { sectionId: 30, partId: 301 },
      { sectionId: 31, partId: 310 },
      { sectionId: 31, partId: 311 },
    ]);
  });

  it('yields a null partId for a section without parts', () => {
    const test = makeTest();
    test.testSections[1].testParts = [];
    expect(partSequence(test).at(-1)).toEqual({
      sectionId: 31,
      partId: null,
    });
  });
});

describe('questionSlots', () => {
  it('expands multi-number questions into one slot per number', () => {
    const slots = questionSlots(makeTest().testSections[0]);
    expect(slots.map((s) => s.n)).toEqual([1, 2, 3, 4, 5]);
    expect(slots[3]).toEqual({ n: 4, from: 3, partId: 300 });
    expect(slots[4].partId).toBe(301);
  });
});

describe('sectionDurationSeconds', () => {
  it('uses the section duration, then the test duration, then null', () => {
    const test = makeTest();
    const [a, b] = test.testSections;
    expect(sectionDurationSeconds(test, a)).toBe(1800);
    expect(sectionDurationSeconds(test, b)).toBe(3600);
    expect(
      sectionDurationSeconds({ ...test, durationMinutes: null }, b),
    ).toBeNull();
  });
});

describe('isAnswered', () => {
  it('checks strings and arrays', () => {
    expect(isAnswered(['A'], 2)).toBe(false);
    expect(isAnswered(['A', 'C'], 2)).toBe(true);
    expect(isAnswered('  ', 1)).toBe(false);
    expect(isAnswered('x', 1)).toBe(true);
    expect(isAnswered(undefined, 1)).toBe(false);
  });
});
