import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithIntl } from '@/test/render';

import EmailLoginForm from './emailLoginForm';

describe('EmailLoginForm', () => {
  it('renders email, password, forgot password and submit', () => {
    renderWithIntl(<EmailLoginForm />);

    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/password/i)).toHaveAttribute(
      'type',
      'password',
    );
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('keeps the user on the page when submitting valid credentials', async () => {
    const user = userEvent.setup();
    renderWithIntl(<EmailLoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'student@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByLabelText(/email/i)).toHaveValue('student@example.com');
  });
});
