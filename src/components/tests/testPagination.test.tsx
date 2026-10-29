import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import TestPagination from './testPagination';

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));

const push = vi.fn();

beforeEach(() => {
  push.mockReset();
  vi.mocked(useRouter).mockReturnValue({ push } as never);
});

describe('TestPagination', () => {
  it('renders nothing for one page', () => {
    const { container } = renderWithIntl(
      <TestPagination page={1} totalPages={1} params={{ q: '', page: 1 }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('pushes the selected page with filters', async () => {
    renderWithIntl(
      <TestPagination
        page={1}
        totalPages={3}
        params={{ exam: 'TOEIC_LR', q: 'x', page: 1 }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(push).toHaveBeenCalledWith('/?exam=TOEIC_LR&q=x&page=2');
  });
});
