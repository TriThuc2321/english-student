import { describe, expect, it } from 'vitest';

import { EXAM_SKILLS, EXAM_TYPES, isExamType } from './exam';

describe('isExamType', () => {
  it.each(EXAM_TYPES)('accepts %s', (value) => {
    expect(isExamType(value)).toBe(true);
  });

  it.each(['ielts_academic', '', undefined, 1])('rejects %s', (value) => {
    expect(isExamType(value)).toBe(false);
  });
});

describe('EXAM_SKILLS', () => {
  it('lists TOEIC SW skills in exam order', () => {
    expect(EXAM_SKILLS.TOEIC_SW).toEqual(['SPEAKING', 'WRITING']);
  });
});
