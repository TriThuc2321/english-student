import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { buildResultView } from '@/lib/results/view';
import { makeAttemptResult } from '@/test/fixtures/attempt';
import { makeTest } from '@/test/fixtures/student-test';
import { renderWithIntl } from '@/test/render';

import { ResultReview } from './resultReview';

const renderReview = () =>
  renderWithIntl(
    <ResultReview
      sections={buildResultView(makeAttemptResult(), makeTest()).sections}
    />,
  );

const panel = () => within(screen.getByRole('complementary'));

describe('ResultReview', () => {
  it('reviews the first question of the first section', () => {
    renderReview();

    expect(
      screen.getByRole('heading', { name: 'Your answers · Listening' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Question 1, Correct' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(panel().getByRole('heading', { name: 'Question 1' })).toBeVisible();
    expect(panel().getByText('Also accepted: Mr Smith')).toBeVisible();
  });

  it('opens the question picked in the grid', async () => {
    const user = userEvent.setup();
    renderReview();

    await user.click(
      screen.getByRole('button', { name: 'Question 5, Correct' }),
    );

    expect(panel().getByRole('heading', { name: 'Question 5' })).toBeVisible();
    expect(panel().getByText('Where will the tour start?')).toBeVisible();
    expect(panel().getAllByText('B · In the office')).toHaveLength(2);
    expect(
      panel().getByText('The speaker says the tour begins in the office.'),
    ).toBeVisible();
  });

  it('steps through questions and stops at the ends', async () => {
    const user = userEvent.setup();
    renderReview();

    const previous = panel().getByRole('button', { name: 'Previous' });
    const next = panel().getByRole('button', { name: 'Next' });
    expect(previous).toBeDisabled();

    await user.click(next);
    expect(panel().getByRole('heading', { name: 'Question 2' })).toBeVisible();
    expect(panel().getByText('No answer')).toBeVisible();

    for (let i = 0; i < 3; i++) await user.click(next);
    expect(panel().getByRole('heading', { name: 'Question 5' })).toBeVisible();
    expect(next).toBeDisabled();
  });

  it('switches section with the tabs', async () => {
    const user = userEvent.setup();
    renderReview();

    await user.click(screen.getByRole('tab', { name: 'Reading' }));

    expect(
      screen.getByRole('heading', { name: 'Your answers · Reading' }),
    ).toBeInTheDocument();
    expect(panel().getByText('Paragraph A')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Question 2, Incorrect' }),
    );
    expect(panel().getByText('ii · A journey across continents')).toBeVisible();
    expect(screen.getByText('Needs work')).toBeInTheDocument();
  });
});
