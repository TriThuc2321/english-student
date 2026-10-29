import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { attemptSection, makeAttemptListItem } from '@/test/fixtures/attempt';
import { renderWithIntl } from '@/test/render';

import { AttemptsTable } from './attemptsTable';

const row = (title: string) =>
  screen.getByRole('rowheader', { name: new RegExp(title) }).closest('tr')!;

describe('AttemptsTable', () => {
  it('shows each attempt with its status, score and action', () => {
    renderWithIntl(
      <AttemptsTable
        attempts={[
          makeAttemptListItem({
            id: 'open',
            status: 'IN_PROGRESS',
            test: {
              id: 1,
              slug: 'practice-test-1',
              title: 'Open test',
              examType: 'IELTS_ACADEMIC',
            },
          }),
          makeAttemptListItem({
            id: 'done',
            overallScore: 755,
            test: {
              id: 2,
              slug: 'ets-3',
              title: 'ETS Test 3',
              examType: 'TOEIC_LR',
            },
          }),
          makeAttemptListItem({
            id: 'waiting',
            status: 'SUBMITTED',
            mode: 'SECTION',
            sections: [attemptSection(30, { skill: 'SPEAKING' })],
            test: {
              id: 3,
              slug: 'sw-2',
              title: 'S&W Test 2',
              examType: 'TOEIC_SW',
            },
          }),
        ]}
      />,
    );

    const open = within(row('Open test'));
    expect(open.getByText('In progress')).toBeInTheDocument();
    expect(open.getByRole('link', { name: 'Resume' })).toHaveAttribute(
      'href',
      '/tests/practice-test-1/take',
    );

    const done = within(row('ETS Test 3'));
    expect(done.getByText('755 / 990')).toBeInTheDocument();
    expect(done.getByRole('link', { name: 'View results' })).toHaveAttribute(
      'href',
      '/attempts/done/result',
    );

    const waiting = within(row('S&W Test 2'));
    expect(waiting.getByText('Awaiting grading')).toBeInTheDocument();
    expect(waiting.getByText('Sections')).toBeInTheDocument();
    expect(waiting.queryByRole('link')).not.toBeInTheDocument();
  });
});
