import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExamState } from '@/lib/exam/reducer';

import { hasExamDraft, saveExamDraft } from '@/lib/exam/draft';
import { renderWithIntl } from '@/test/render';

import StartExamButton from './startExamButton';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const SLUG = 'practice-test-1';
const TAKE_HREF = '/tests/practice-test-1/take';
const draft: ExamState = {
  answers: { 1: { 1: 'A' } },
  sectionId: 1,
  partId: 1,
  remaining: { 1: 1200 },
  flagged: {},
};

describe('StartExamButton', () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
  });

  it('offers Start when there is no draft', async () => {
    renderWithIntl(<StartExamButton slug={SLUG} />);
    const link = await screen.findByRole('link', { name: 'Start' });
    expect(link).toHaveAttribute('href', TAKE_HREF);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('offers Continue and Start over when a draft exists', async () => {
    saveExamDraft(SLUG, draft);
    renderWithIntl(<StartExamButton slug={SLUG} />);
    const link = await screen.findByRole('link', { name: 'Continue' });
    expect(link).toHaveAttribute('href', TAKE_HREF);
    expect(screen.getByRole('button', { name: 'Start over' })).toBeVisible();
  });

  it('clears the draft and navigates when starting over', async () => {
    saveExamDraft(SLUG, draft);
    renderWithIntl(<StartExamButton slug={SLUG} />);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Start over' }),
    );
    expect(hasExamDraft(SLUG)).toBe(false);
    expect(push).toHaveBeenCalledWith(TAKE_HREF);
  });
});
