import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CatalogueParams } from '@/lib/tests/catalogue-params';

import { renderWithIntl } from '@/test/render';

import TestSearch from './testSearch';

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));

const replace = vi.fn();
const NO_FILTERS: CatalogueParams = { q: '', page: 1 };

const setup = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const input = () => screen.getByRole('searchbox', { name: 'Search tests' });
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
  replace.mockReset();
  vi.mocked(useRouter).mockReturnValue({ replace } as never);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TestSearch', () => {
  it('debounces and replaces the URL once', async () => {
    const user = setup();
    renderWithIntl(<TestSearch params={NO_FILTERS} />);

    await user.type(input(), 'cam');
    advance(299);
    expect(replace).not.toHaveBeenCalled();

    advance(1);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/tests?q=cam');
  });

  it('keeps exam and drops page', async () => {
    const user = setup();
    renderWithIntl(
      <TestSearch params={{ exam: 'TOEIC_SW', q: '', page: 2 }} />,
    );

    await user.type(input(), 'a');
    advance(300);
    expect(replace).toHaveBeenCalledWith('/tests?exam=TOEIC_SW&q=a');
  });

  it('syncs when q changes from outside', () => {
    const { rerender } = renderWithIntl(
      <TestSearch params={{ q: 'cam', page: 1 }} />,
    );
    expect(input()).toHaveValue('cam');

    rerender(<TestSearch params={NO_FILTERS} />);
    expect(input()).toHaveValue('');
  });

  it('does not reset typing on its own update', async () => {
    const user = setup();
    const { rerender } = renderWithIntl(<TestSearch params={NO_FILTERS} />);

    await user.type(input(), 'cam');
    advance(300);
    await user.type(input(), 'b');
    rerender(<TestSearch params={{ q: 'cam', page: 1 }} />);

    expect(input()).toHaveValue('camb');
  });
});
