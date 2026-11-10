import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { resetPassword } from '@/lib/auth/actions';
import { AuthFormError } from '@/lib/auth/form-state';
import { renderWithIntl } from '@/test/render';

import ResetPasswordForm from './resetPasswordForm';

vi.mock('@/lib/auth/actions', () => ({ resetPassword: vi.fn() }));

const fill = async (password: string, confirm: string) => {
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('textbox', { name: 'Reset code' }),
    '123456',
  );
  await user.type(screen.getByLabelText(/^new password/i), password);
  await user.type(screen.getByLabelText(/confirm new password/i), confirm);
  await user.click(screen.getByRole('button', { name: 'Update password' }));
};

describe('ResetPasswordForm', () => {
  it('blocks submit when the passwords differ', async () => {
    vi.mocked(resetPassword).mockClear();
    renderWithIntl(<ResetPasswordForm email="lan@example.com" />);

    await fill('secret123', 'secret124');

    expect(resetPassword).not.toHaveBeenCalled();
    expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
  });

  it('sends email, code and new password, then shows a bad code error', async () => {
    vi.mocked(resetPassword).mockResolvedValue({
      error: AuthFormError.INVALID_CODE,
    });
    renderWithIntl(<ResetPasswordForm email="lan@example.com" />);

    await fill('secret123', 'secret123');

    expect(
      await screen.findByText(/The code is wrong or has expired/),
    ).toBeInTheDocument();
    const formData = vi.mocked(resetPassword).mock.calls[0][1];
    expect(Object.fromEntries(formData)).toMatchObject({
      email: 'lan@example.com',
      code: '123456',
      newPassword: 'secret123',
      confirmPassword: 'secret123',
    });
  });
});
