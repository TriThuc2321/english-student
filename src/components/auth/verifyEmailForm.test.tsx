import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { verifyEmail } from '@/lib/auth/actions';
import { AuthFormError } from '@/lib/auth/form-state';
import { renderWithIntl } from '@/test/render';

import VerifyEmailForm from './verifyEmailForm';

vi.mock('@/lib/auth/actions', () => ({ verifyEmail: vi.fn() }));

describe('VerifyEmailForm', () => {
  it('submits as soon as all six digits are entered', async () => {
    vi.mocked(verifyEmail).mockResolvedValue({
      error: AuthFormError.INVALID_CODE,
    });
    const user = userEvent.setup();
    renderWithIntl(<VerifyEmailForm email="lan@example.com" />);

    expect(screen.getByRole('button', { name: 'Verify email' })).toBeDisabled();
    await user.type(
      screen.getByRole('textbox', { name: 'Verification code' }),
      '654321',
    );

    expect(
      await screen.findByText(/The code is wrong or has expired/),
    ).toBeInTheDocument();
    const formData = vi.mocked(verifyEmail).mock.calls[0][1];
    expect(formData.get('email')).toBe('lan@example.com');
    expect(formData.get('code')).toBe('654321');
  });
});
