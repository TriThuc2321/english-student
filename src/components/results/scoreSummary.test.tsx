import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ResultView } from '@/lib/results/view';

import { renderWithIntl } from '@/test/render';

import { ScoreSummary } from './scoreSummary';

const view = (overrides: Partial<ResultView> = {}): ResultView => ({
  examType: 'IELTS_ACADEMIC',
  skills: [
    {
      sectionId: 30,
      skill: 'WRITING',
      scaledScore: null,
      rawScore: null,
      maxScore: null,
      pending: true,
    },
  ],
  total: null,
  sections: [],
  ...overrides,
});

describe('ScoreSummary', () => {
  it('labels a final overall band', () => {
    renderWithIntl(
      <ScoreSummary
        view={view({
          total: { kind: 'ielts', band: 6.5, max: 9, estimate: false },
        })}
      />,
    );
    expect(screen.getByText('Overall band')).toBeVisible();
    expect(screen.queryByText(/Based on Listening and Reading/)).toBeNull();
  });

  it('labels an estimated overall band', () => {
    renderWithIntl(
      <ScoreSummary
        view={view({
          total: { kind: 'ielts', band: 6.5, max: 9, estimate: true },
        })}
      />,
    );
    expect(screen.getByText('Overall band (estimated)')).toBeVisible();
    expect(screen.getByText(/Based on Listening and Reading/)).toBeVisible();
  });

  it('shows pending for a section being graded', () => {
    renderWithIntl(<ScoreSummary view={view()} />);
    expect(screen.getByText('Grading pending')).toBeVisible();
  });

  it('shows a teacher-graded section as graded', () => {
    renderWithIntl(
      <ScoreSummary
        view={view({
          skills: [
            {
              sectionId: 30,
              skill: 'WRITING',
              scaledScore: 6.5,
              rawScore: null,
              maxScore: null,
              pending: false,
            },
          ],
        })}
      />,
    );
    expect(screen.getByText('6.5')).toBeVisible();
    expect(screen.getByText('Graded')).toBeVisible();
    expect(screen.queryByText('Grading pending')).toBeNull();
  });
});
