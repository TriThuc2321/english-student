import { describe, expect, it } from 'vitest';

import { attemptSection, makeAttemptListItem } from '@/test/fixtures/attempt';

import { attemptAction, attemptScore } from './history';

const toeic = {
  id: 2,
  slug: 'ets-3',
  title: 'ETS 3',
  examType: 'TOEIC_LR',
} as const;

describe('attemptScore', () => {
  it('estimates the IELTS band of a full test', () => {
    expect(attemptScore(makeAttemptListItem())).toEqual({
      kind: 'overall',
      value: '7.0',
      max: null,
    });
  });

  it('shows the TOEIC total out of 990', () => {
    expect(
      attemptScore(makeAttemptListItem({ test: toeic, overallScore: 755 })),
    ).toEqual({ kind: 'overall', value: '755', max: 990 });
  });

  it('lists section scores of a practice session in order', () => {
    const attempt = makeAttemptListItem({
      mode: 'SECTION',
      sections: [
        attemptSection(31, { skill: 'READING', order: 2, scaledScore: 6.5 }),
        attemptSection(30, { order: 1, scaledScore: 7 }),
      ],
    });

    expect(attemptScore(attempt)).toEqual({
      kind: 'sections',
      items: [
        { skill: 'LISTENING', value: '7.0' },
        { skill: 'READING', value: '6.5' },
      ],
    });
  });

  it('waits for grading of a submitted attempt without scores', () => {
    const attempt = makeAttemptListItem({
      status: 'SUBMITTED',
      sections: [attemptSection(30)],
    });

    expect(attemptScore(attempt)).toEqual({ kind: 'pending' });
  });

  it('has no score while in progress', () => {
    expect(
      attemptScore(makeAttemptListItem({ status: 'IN_PROGRESS' })),
    ).toEqual({ kind: 'none' });
  });
});

describe('attemptAction', () => {
  it('resumes a full test on the take page', () => {
    expect(
      attemptAction(makeAttemptListItem({ status: 'IN_PROGRESS' })),
    ).toEqual({ kind: 'resume', href: '/tests/practice-test-1/take' });
  });

  it('resumes a practice session with its sections', () => {
    expect(
      attemptAction(
        makeAttemptListItem({ status: 'IN_PROGRESS', mode: 'SECTION' }),
      ),
    ).toEqual({
      kind: 'resume',
      href: '/tests/practice-test-1/take?sections=30,31',
    });
  });

  it('links graded and expired attempts to their result', () => {
    for (const status of ['GRADED', 'EXPIRED'] as const) {
      expect(attemptAction(makeAttemptListItem({ id: 'a1', status }))).toEqual({
        kind: 'results',
        href: '/attempts/a1/result',
      });
    }
  });

  it('has nothing to open while grading is pending', () => {
    expect(attemptAction(makeAttemptListItem({ status: 'SUBMITTED' }))).toEqual(
      { kind: 'none' },
    );
  });
});
