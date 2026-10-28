import { describe, expect, it } from 'vitest';

import { makeTest } from '@/test/fixtures/student-test';

import {
  createInitialState,
  examReducer,
  isSectionLocked,
  type ExamState,
} from './reducer';

const test = makeTest();
const initial = () => createInitialState(test);
const run = (state: ExamState, action: Parameters<typeof examReducer>[2]) =>
  examReducer(test, state, action);

describe('examReducer', () => {
  it('creates the initial state', () => {
    expect(initial()).toMatchObject({
      sectionId: 30,
      partId: 300,
      remaining: { 30: 1800, 31: 3600 },
    });
  });

  it('keeps answers per section', () => {
    let s = run(initial(), { type: 'answer', n: 1, value: 'x' });
    s = run(s, { type: 'goTo', sectionId: 31 });
    s = run(s, { type: 'answer', n: 1, value: 'y' });
    expect(s.answers[30][1]).toBe('x');
    expect(s.answers[31][1]).toBe('y');
  });

  it('toggles flags', () => {
    let s = run(initial(), { type: 'toggleFlag', n: 2 });
    expect(s.flagged[30]).toEqual([2]);
    s = run(s, { type: 'toggleFlag', n: 2 });
    expect(Object.values(s.flagged).flat()).toEqual([]);
  });

  it('steps between parts of the current section only', () => {
    const atFirst = initial();
    expect(run(atFirst, { type: 'step', dir: -1 })).toEqual(atFirst);
    const atSecond = run(atFirst, { type: 'step', dir: 1 });
    expect(atSecond.partId).toBe(301);
    expect(run(atSecond, { type: 'step', dir: 1 })).toEqual(atSecond);
  });

  it('submits the section and moves to the next one', () => {
    const s = run(initial(), { type: 'submitSection' });
    expect(s.submitted).toEqual([30]);
    expect([s.sectionId, s.partId]).toEqual([31, 310]);
    expect(isSectionLocked(s, 30)).toBe(true);
    expect(run(s, { type: 'goTo', sectionId: 30 })).toEqual(s);
  });

  it('stays on the last section after submitting it', () => {
    let s = run(initial(), { type: 'submitSection' });
    s = run(s, { type: 'submitSection' });
    expect(s.submitted).toEqual([30, 31]);
    expect(s.sectionId).toBe(31);
  });

  it('goTo defaults to the first part of the section', () => {
    const s = run(initial(), { type: 'goTo', sectionId: 31 });
    expect([s.sectionId, s.partId]).toEqual([31, 310]);
  });

  it('locks a section when its timer runs out', () => {
    let s = run(initial(), { type: 'tick', seconds: 2000 });
    expect(s.remaining[30]).toBe(0);
    expect(isSectionLocked(s, 30)).toBe(true);
    expect(s.submitted).toEqual([30]);
    s = run(s, { type: 'answer', n: 1, value: 'x' });
    expect(s.answers[30]?.[1]).toBeUndefined();
  });

  it('restore falls back to the first section for unknown ids', () => {
    const saved: ExamState = {
      ...initial(),
      sectionId: 999,
      partId: 5,
      answers: { 30: { 1: 'x' } },
    };
    const s = run(initial(), { type: 'restore', state: saved });
    expect([s.sectionId, s.partId]).toEqual([30, 300]);
    expect(s.answers[30][1]).toBe('x');
  });

  it('restore keeps a zero remaining and repairs invalid values', () => {
    const saved: ExamState = {
      ...initial(),
      remaining: { 30: 0, 31: -5 },
    };
    const s = run(initial(), { type: 'restore', state: saved });
    expect(s.remaining[30]).toBe(0);
    expect(s.remaining[31]).toBe(3600);
  });

  it('restore moves past locked sections', () => {
    const saved: ExamState = { ...initial(), submitted: [30, 999] };
    const s = run(initial(), { type: 'restore', state: saved });
    expect(s.submitted).toEqual([30]);
    expect([s.sectionId, s.partId]).toEqual([31, 310]);
  });
});
