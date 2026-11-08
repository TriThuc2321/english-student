import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { attemptSection, makeAttemptResult } from '@/test/fixtures/attempt';
import { renderWithIntl } from '@/test/render';

import { ResultHeader } from './resultHeader';

describe('ResultHeader', () => {
  it('shows grading chip next to the expired chip', () => {
    const { attempt } = makeAttemptResult(
      {},
      {
        status: 'EXPIRED',
        sections: [
          attemptSection(30),
          attemptSection(31, {
            skill: 'WRITING',
            order: 2,
            gradingStatus: 'PENDING',
          }),
        ],
      },
    );
    renderWithIntl(<ResultHeader attempt={attempt} />);

    expect(screen.getByText('Expired, auto-submitted')).toBeVisible();
    expect(screen.getByText('Being graded')).toBeVisible();
  });

  it('hides the grading chip once everything is scored', () => {
    const { attempt } = makeAttemptResult();
    renderWithIntl(<ResultHeader attempt={attempt} />);

    expect(screen.queryByText('Being graded')).toBeNull();
  });

  it('links to the detailed answer review', () => {
    const { attempt } = makeAttemptResult();
    renderWithIntl(<ResultHeader attempt={attempt} />);

    expect(
      screen.getByRole('link', { name: 'Review answers' }),
    ).toHaveAttribute('href', `/attempts/${attempt.id}/review`);
  });
});
