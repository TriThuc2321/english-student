import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExamState } from './reducer';

import {
  clearExamDraft,
  hasExamDraft,
  loadExamDraft,
  saveExamDraft,
} from './draft';

const state: ExamState = {
  answers: { 1: { 1: 'A', 2: ['x', 'y'] } },
  sectionId: 1,
  partId: 2,
  remaining: { 1: 1200 },
  flagged: { 1: [2] },
  submitted: [],
};

describe('exam draft', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('round-trips a saved state', () => {
    saveExamDraft('x', state);
    expect(hasExamDraft('x')).toBe(true);
    expect(loadExamDraft('x')).toEqual(state);
  });

  it('round-trips the practice section selection', () => {
    saveExamDraft('x', state, [1, 3]);
    expect(loadExamDraft('x')).toEqual({ ...state, sectionIds: [1, 3] });
  });

  it('returns null for malformed section ids', () => {
    localStorage.setItem(
      'exam-draft:x',
      JSON.stringify({ ...state, version: 1, sectionIds: ['a'] }),
    );
    expect(loadExamDraft('x')).toBeNull();
  });

  it('defaults submitted for drafts saved before it existed', () => {
    const legacy: Partial<ExamState> = { ...state };
    delete legacy.submitted;
    localStorage.setItem(
      'exam-draft:x',
      JSON.stringify({ ...legacy, version: 1 }),
    );
    expect(loadExamDraft('x')).toEqual(state);
  });

  it('returns null for unparseable JSON', () => {
    localStorage.setItem('exam-draft:x', '{bad');
    expect(loadExamDraft('x')).toBeNull();
  });

  it('returns null for an unknown version', () => {
    localStorage.setItem(
      'exam-draft:x',
      JSON.stringify({ ...state, version: 2 }),
    );
    expect(loadExamDraft('x')).toBeNull();
  });

  it('returns null for a malformed envelope', () => {
    localStorage.setItem(
      'exam-draft:x',
      JSON.stringify({ version: 1, answers: 3 }),
    );
    expect(loadExamDraft('x')).toBeNull();
  });

  it('tolerates storage throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(loadExamDraft('x')).toBeNull();
    expect(hasExamDraft('x')).toBe(false);
    expect(() => saveExamDraft('x', state)).not.toThrow();
  });

  it('clears a draft', () => {
    saveExamDraft('x', state);
    clearExamDraft('x');
    expect(localStorage.getItem('exam-draft:x')).toBeNull();
    expect(hasExamDraft('x')).toBe(false);
  });
});
