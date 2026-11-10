import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RESEND_COOLDOWN_SECONDS } from '@/lib/auth/constants';
import { renderWithIntl } from '@/test/render';

import ResendCodeForm from './resendCodeForm';

describe('ResendCodeForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('enables resend once the cooldown runs out', () => {
    const action = vi.fn();
    renderWithIntl(<ResendCodeForm email="lan@example.com" action={action} />);

    expect(
      screen.getByRole('button', {
        name: `Resend in ${RESEND_COOLDOWN_SECONDS}s`,
      }),
    ).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(RESEND_COOLDOWN_SECONDS * 1000);
    });

    expect(screen.getByRole('button', { name: 'Resend code' })).toBeEnabled();
  });
});
