import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { buildResultView } from '@/lib/results/view';
import {
  attemptSection,
  makeAttemptResult,
  resultQuestion,
} from '@/test/fixtures/attempt';
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

const essay = 'First paragraph of my essay.\n\n' + 'word '.repeat(60).trim();

const renderGraded = (skill: 'WRITING' | 'SPEAKING') => {
  const result = makeAttemptResult(
    {
      questions: [
        resultQuestion(1, 30, 1, {
          response: skill === 'WRITING' ? { text: essay } : { mediaId: 9 },
          answer: { sample: 'A model answer.' },
          audioUrl: skill === 'SPEAKING' ? 'https://signed.test/a.webm' : null,
        }),
      ],
      assessments: [
        {
          attemptSectionId: 'as-30',
          band: 6.5,
          entries: [
            skill === 'WRITING'
              ? {
                  partId: 300,
                  criteria: { TR: 7, CC: 6, LR: 7, GRA: 6 },
                  band: 6.5,
                  feedback: 'Clear position throughout.',
                }
              : {
                  partId: null,
                  criteria: { FC: 7, LR: 6, GRA: 6, P: 7 },
                  band: 6.5,
                  feedback: null,
                },
          ],
        },
      ],
    },
    {
      sections: [
        attemptSection(30, {
          skill,
          gradingStatus: 'GRADED',
          scaledScore: 6.5,
        }),
      ],
    },
  );
  return renderWithIntl(
    <ResultReview sections={buildResultView(result, makeTest()).sections} />,
  );
};

describe('ResultReview teacher grading', () => {
  it('shows criteria and feedback for a graded Writing section', () => {
    renderGraded('WRITING');

    const grade = within(
      screen.getByRole('region', { name: "Teacher's grade · Band 6.5" }),
    );
    expect(grade.getByText('Part 1 · Band 6.5')).toBeVisible();
    expect(grade.getByText('Task Response')).toBeVisible();
    expect(grade.getByText('Grammatical Range and Accuracy')).toBeVisible();
    expect(grade.getAllByText('7.0')).toHaveLength(2);
    expect(grade.getByText('Clear position throughout.')).toBeVisible();
  });

  it('shows the full essay and the sample', () => {
    renderGraded('WRITING');

    expect(
      screen.getByRole('button', { name: 'Question 1, Graded' }),
    ).toBeInTheDocument();
    expect(
      panel().getByText((_, el) => el?.textContent === essay, {
        selector: 'p',
      }),
    ).toBeVisible();
    expect(panel().getByText('Sample answer')).toBeVisible();
    expect(panel().getByText('A model answer.')).toBeVisible();
  });

  it('plays the recording', () => {
    const { container } = renderGraded('SPEAKING');

    expect(container.querySelector('audio')).toHaveAttribute(
      'src',
      'https://signed.test/a.webm',
    );
    expect(panel().getByText('Your recording')).toBeVisible();
    expect(panel().queryByText('Not answered')).toBeNull();
    expect(screen.getByText('Pronunciation')).toBeVisible();
  });
});
