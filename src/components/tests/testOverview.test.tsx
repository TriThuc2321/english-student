import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ExamState } from '@/lib/exam/reducer';

import { hasExamDraft, saveExamDraft } from '@/lib/exam/draft';
import { renderWithIntl } from '@/test/render';

import TestOverview, {
  type IntroQuestion,
  type OverviewSection,
} from './testOverview';

const SLUG = 'practice-test-1';
const TAKE_HREF = '/tests/practice-test-1/take';
const QUESTIONS: IntroQuestion[] = [
  { sectionId: 1, from: 1, size: 1 },
  { sectionId: 1, from: 2, size: 2 },
  { sectionId: 1, from: 4, size: 1 },
  { sectionId: 2, from: 1, size: 1 },
];
const SECTIONS: OverviewSection[] = [
  { id: 1, skill: 'READING', questionCount: 4, minutes: 60 },
  { id: 2, skill: 'LISTENING', questionCount: 1, minutes: 30 },
];
const draft: ExamState = {
  answers: { 1: { 1: 'A', 2: ['B', 'C'] } },
  sectionId: 1,
  partId: 1,
  remaining: { 1: 3340 },
  flagged: { 1: [4] },
  submitted: [],
};

const renderOverview = () =>
  renderWithIntl(
    <TestOverview
      slug={SLUG}
      questions={QUESTIONS}
      sections={SECTIONS}
      rules={null}
    />,
  );

describe('TestOverview', () => {
  beforeEach(() => localStorage.clear());

  it('starts the full test by default', async () => {
    renderOverview();
    expect(await screen.findByRole('link', { name: 'Start' })).toHaveAttribute(
      'href',
      TAKE_HREF,
    );
    expect(screen.getByRole('checkbox', { name: /Reading/ })).toBeDisabled();
    expect(screen.getByText('1 h 30 min')).toBeInTheDocument();
  });

  it('starts only the picked sections in practice mode', async () => {
    renderOverview();
    await userEvent.click(screen.getByRole('radio', { name: /Practice/ }));
    expect(screen.queryByRole('link', { name: 'Start' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
    expect(screen.getByText('No sections yet')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: /Reading/ }));
    expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute(
      'href',
      `${TAKE_HREF}?sections=1`,
    );
    expect(screen.getByText('1 h')).toBeInTheDocument();
  });

  it('shows the headphone check only when Listening is chosen', async () => {
    renderOverview();
    expect(screen.getByText('Check your headphones')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: /Practice/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Reading/ }));
    expect(screen.queryByText('Check your headphones')).toBeNull();
  });

  it('resumes a full-test draft with its progress', async () => {
    saveExamDraft(SLUG, draft);
    renderOverview();
    expect(
      await screen.findByRole('link', { name: 'Resume attempt' }),
    ).toHaveAttribute('href', TAKE_HREF);
    expect(screen.getByTestId('draft-progress')).toHaveTextContent(
      '3 / 5 answered · 55:40 left in Reading · 1 flagged',
    );
    expect(screen.getByRole('radio', { name: /Practice/ })).toBeDisabled();
  });

  it('locks a practice draft to its sections', async () => {
    saveExamDraft(SLUG, draft, [1]);
    renderOverview();
    expect(
      await screen.findByRole('link', { name: 'Resume attempt' }),
    ).toHaveAttribute('href', `${TAKE_HREF}?sections=1`);
    expect(screen.getByTestId('draft-progress')).toHaveTextContent(
      '3 / 4 answered',
    );
    expect(screen.getByRole('checkbox', { name: /Reading/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Listening/ })).toBeDisabled();
  });

  it('keeps the draft when starting over is cancelled', async () => {
    saveExamDraft(SLUG, draft);
    renderOverview();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Start over' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancel' }),
    );
    expect(hasExamDraft(SLUG)).toBe(true);
  });

  it('clears the draft and unlocks the mode after confirming', async () => {
    saveExamDraft(SLUG, draft, [1]);
    renderOverview();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Start over' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Discard and start over' }),
    );
    expect(hasExamDraft(SLUG)).toBe(false);
    expect(
      await screen.findByRole('link', { name: 'Start' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Practice/ })).toBeEnabled();
  });
});
