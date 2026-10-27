import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import ExamTypeTabs from './examTypeTabs';

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));

const push = vi.fn();

beforeEach(() => {
  push.mockReset();
  vi.mocked(useRouter).mockReturnValue({ push } as never);
});

describe('ExamTypeTabs', () => {
  it('selects the tab from params', () => {
    renderWithIntl(
      <ExamTypeTabs params={{ exam: 'TOEIC_LR', q: '', page: 3 }} />,
    );

    expect(
      screen.getByRole('tab', { name: 'TOEIC Listening & Reading' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('resets page and keeps q when switching', async () => {
    renderWithIntl(
      <ExamTypeTabs params={{ exam: 'TOEIC_LR', q: 'cam', page: 3 }} />,
    );

    await userEvent.click(screen.getByRole('tab', { name: 'All' }));
    expect(push).toHaveBeenCalledWith('/tests?q=cam');
  });
});
