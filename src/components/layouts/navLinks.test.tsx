import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import NavLinks from './navLinks';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));

const onPath = (pathname: string) =>
  vi.mocked(usePathname).mockReturnValue(pathname);

beforeEach(() => {
  onPath('/');
});

describe('NavLinks', () => {
  it('marks Tests active on /tests/practice-test-1', () => {
    onPath('/tests/practice-test-1');
    renderWithIntl(<NavLinks orientation="horizontal" />);

    expect(screen.getByRole('link', { name: 'Tests' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks Home active only on /', () => {
    onPath('/tests');
    renderWithIntl(<NavLinks orientation="horizontal" />);

    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('calls onNavigate when a link is clicked', async () => {
    const onNavigate = vi.fn();
    renderWithIntl(<NavLinks orientation="vertical" onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole('link', { name: 'Tests' }));
    expect(onNavigate).toHaveBeenCalled();
  });
});
