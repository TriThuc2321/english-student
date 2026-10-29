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
  it('links Tests to the library at /', () => {
    renderWithIntl(<NavLinks orientation="horizontal" />);

    const link = screen.getByRole('link', { name: 'Tests' });
    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('marks Tests active on /tests/practice-test-1', () => {
    onPath('/tests/practice-test-1');
    renderWithIntl(<NavLinks orientation="horizontal" />);

    expect(screen.getByRole('link', { name: 'Tests' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('does not mark Tests active on unrelated paths', () => {
    onPath('/testsuite');
    renderWithIntl(<NavLinks orientation="horizontal" />);

    expect(screen.getByRole('link', { name: 'Tests' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks My attempts active on a result page', () => {
    onPath('/attempts/a1/result');
    renderWithIntl(<NavLinks orientation="horizontal" />);

    const link = screen.getByRole('link', { name: 'My attempts' });
    expect(link).toHaveAttribute('href', '/attempts');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('calls onNavigate when a link is clicked', async () => {
    const onNavigate = vi.fn();
    renderWithIntl(<NavLinks orientation="vertical" onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole('link', { name: 'Tests' }));
    expect(onNavigate).toHaveBeenCalled();
  });
});
