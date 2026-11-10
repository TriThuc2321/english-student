import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loginWithEmail } from '@/lib/auth/actions';
import { AuthFormError } from '@/lib/auth/form-state';
import { renderWithIntl } from '@/test/render';

import EmailLoginForm from './emailLoginForm';

vi.mock('@/lib/auth/actions', () => ({ loginWithEmail: vi.fn() }));

describe('EmailLoginForm', () => {
  beforeEach(() => {
    vi.mocked(loginWithEmail).mockReset();
  });

  it('renders email, password, forgot password and submit', () => {
    renderWithIntl(<EmailLoginForm />);

    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/password/i)).toHaveAttribute(
      'type',
      'password',
    );
    expect(
      screen.getByRole('link', { name: 'Forgot password?' }),
    ).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('submits the credentials and shows the returned error', async () => {
    vi.mocked(loginWithEmail).mockResolvedValue({
      error: AuthFormError.INVALID_CREDENTIALS,
      values: { email: 'student@example.com' },
    });
    const user = userEvent.setup();
    renderWithIntl(<EmailLoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'student@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('Incorrect email or password.'),
    ).toBeInTheDocument();
    const formData = vi.mocked(loginWithEmail).mock.calls[0][1];
    expect(formData.get('email')).toBe('student@example.com');
    expect(formData.get('password')).toBe('secret123');
    expect(screen.getByLabelText(/email/i)).toHaveValue('student@example.com');
  });
});
