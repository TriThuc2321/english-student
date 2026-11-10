'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getClientIp, withClientIp } from './client-ip';
import {
  AUTH_CLIENT,
  LOGIN_PATH,
  LoginNotice,
  RESET_PASSWORD_PATH,
  VERIFY_EMAIL_PATH,
  withEmail,
} from './constants';
import { AuthFormError, type AuthFormState, toFormError } from './form-state';
import {
  applySession,
  callBe,
  clearSession,
  SESSION_COOKIE,
  type SessionTokens,
} from './session';

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

const secret = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
};

async function postAuth(path: string, body: unknown) {
  try {
    return await callBe(path, {
      method: 'POST',
      headers: withClientIp(
        { 'Content-Type': 'application/json' },
        getClientIp(await headers()),
      ),
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}

async function readErrorCode(res: Response | null) {
  const body = (await res?.json().catch(() => null)) as {
    code?: unknown;
  } | null;
  return typeof body?.code === 'string' ? body.code : undefined;
}

async function failure(
  res: Response | null,
  values?: Record<string, string>,
): Promise<AuthFormState> {
  return { error: toFormError(res?.status, await readErrorCode(res)), values };
}

async function signIn(res: Response): Promise<never> {
  applySession(await cookies(), (await res.json()) as SessionTokens);
  redirect('/');
}

export async function logout() {
  const store = await cookies();
  const refreshToken = store.get(SESSION_COOKIE.REFRESH)?.value;

  if (refreshToken) {
    await postAuth('/auth/logout', { client: AUTH_CLIENT, refreshToken });
  }

  clearSession(store);
  redirect(LOGIN_PATH);
}

export async function loginWithEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = text(formData, 'email');
  const res = await postAuth('/auth/login', {
    client: AUTH_CLIENT,
    email,
    password: secret(formData, 'password'),
  });
  if (res?.ok) {
    return signIn(res);
  }

  const code = await readErrorCode(res);
  if (res?.status === 403 && code === 'EMAIL_NOT_VERIFIED') {
    await postAuth('/auth/verify-email/resend', { email });
    redirect(withEmail(VERIFY_EMAIL_PATH, email));
  }
  return { error: toFormError(res?.status, code), values: { email } };
}

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = {
    email: text(formData, 'email'),
    firstName: text(formData, 'firstName'),
    lastName: text(formData, 'lastName'),
  };
  const res = await postAuth('/auth/register', {
    client: AUTH_CLIENT,
    email: values.email,
    password: secret(formData, 'password'),
    firstName: values.firstName,
    lastName: values.lastName || undefined,
  });
  if (!res?.ok) {
    return failure(res, values);
  }
  redirect(withEmail(VERIFY_EMAIL_PATH, values.email));
}

export async function verifyEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const res = await postAuth('/auth/verify-email', {
    client: AUTH_CLIENT,
    email: text(formData, 'email'),
    code: text(formData, 'code'),
  });
  if (!res?.ok) {
    return failure(res);
  }
  return signIn(res);
}

export async function resendVerificationCode(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const res = await postAuth('/auth/verify-email/resend', {
    email: text(formData, 'email'),
  });
  return res?.ok ? { sentAt: Date.now() } : failure(res);
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = text(formData, 'email');
  const res = await postAuth('/auth/forgot-password', { email });
  if (!res?.ok) {
    return failure(res, { email });
  }
  redirect(withEmail(RESET_PASSWORD_PATH, email));
}

export async function resendPasswordResetCode(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const res = await postAuth('/auth/forgot-password', {
    email: text(formData, 'email'),
  });
  return res?.ok ? { sentAt: Date.now() } : failure(res);
}

export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const newPassword = secret(formData, 'newPassword');
  if (newPassword !== secret(formData, 'confirmPassword')) {
    return { error: AuthFormError.PASSWORD_MISMATCH };
  }

  const res = await postAuth('/auth/reset-password', {
    email: text(formData, 'email'),
    code: text(formData, 'code'),
    newPassword,
  });
  if (!res?.ok) {
    return failure(res);
  }
  redirect(`${LOGIN_PATH}?notice=${LoginNotice.PASSWORD_RESET}`);
}
