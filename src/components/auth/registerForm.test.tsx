import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { register } from '@/lib/auth/actions';
import { AuthFormError } from '@/lib/auth/form-state';
import { renderWithIntl } from '@/test/render';

import RegisterForm from './registerForm';

vi.mock('@/lib/auth/actions', () => ({ register: vi.fn() }));

describe('RegisterForm', () => {
  it('sends the account details and keeps them after an error', async () => {
    vi.mocked(register).mockResolvedValue({
      error: AuthFormError.TOO_MANY_REQUESTS,
      values: { firstName: 'Lan', lastName: '', email: 'lan@example.com' },
    });
    const user = userEvent.setup();
    renderWithIntl(<RegisterForm />);

    await user.type(screen.getByLabelText(/first name/i), 'Lan');
    await user.type(screen.getByLabelText(/email/i), 'lan@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText(
        'Too many attempts. Wait a minute and try again.',
      ),
    ).toBeInTheDocument();
    const formData = vi.mocked(register).mock.calls[0][1];
    expect(Object.fromEntries(formData)).toMatchObject({
      firstName: 'Lan',
      email: 'lan@example.com',
      password: 'secret123',
    });
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Lan');
  });

  it('does not submit a password shorter than 8 characters', async () => {
    vi.mocked(register).mockClear();
    const user = userEvent.setup();
    renderWithIntl(<RegisterForm />);

    await user.type(screen.getByLabelText(/first name/i), 'Lan');
    await user.type(screen.getByLabelText(/email/i), 'lan@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(register).not.toHaveBeenCalled();
  });
});
