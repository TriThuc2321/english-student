import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import PagePagination from './pagePagination';

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));

const push = vi.fn();

beforeEach(() => {
  push.mockReset();
  vi.mocked(useRouter).mockReturnValue({ push } as never);
});

describe('PagePagination', () => {
  it('renders nothing for one page', () => {
    const { container } = renderWithIntl(
      <PagePagination page={1} totalPages={1} pathname="/" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('pushes the selected page with filters', async () => {
    renderWithIntl(
      <PagePagination
        page={1}
        totalPages={3}
        pathname="/"
        query={{ exam: 'TOEIC_LR', q: 'x' }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(push).toHaveBeenCalledWith('/?exam=TOEIC_LR&q=x&page=2');
  });

  it('drops the page param when going back to page 1', async () => {
    renderWithIntl(
      <PagePagination
        page={2}
        totalPages={3}
        pathname="/attempts"
        query={{ status: 'GRADED' }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '1' }));
    expect(push).toHaveBeenCalledWith('/attempts?status=GRADED');
  });
});
