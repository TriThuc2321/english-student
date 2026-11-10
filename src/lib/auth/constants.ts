export const AUTH_CLIENT = 'web';

export const LOGIN_PATH = '/login';
export const REGISTER_PATH = '/register';
export const VERIFY_EMAIL_PATH = '/verify-email';
export const FORGOT_PASSWORD_PATH = '/forgot-password';
export const RESET_PASSWORD_PATH = '/reset-password';

export const PUBLIC_AUTH_PATHS: readonly string[] = [
  LOGIN_PATH,
  REGISTER_PATH,
  VERIFY_EMAIL_PATH,
  FORGOT_PASSWORD_PATH,
  RESET_PASSWORD_PATH,
];

export const GOOGLE_LOGIN_START_PATH = '/api/session/google';

export const PASSWORD_RULE = { minLength: 8, maxLength: 72 };
export const CODE_LENGTH = 6;
export const RESEND_COOLDOWN_SECONDS = 60;

export enum LoginError {
  GOOGLE_LOGIN_FAILED = 'google_login_failed',
}

export const isLoginError = (value: unknown): value is LoginError =>
  Object.values<unknown>(LoginError).includes(value);

export enum LoginNotice {
  PASSWORD_RESET = 'password_reset',
}

export const isLoginNotice = (value: unknown): value is LoginNotice =>
  Object.values<unknown>(LoginNotice).includes(value);

export const withEmail = (path: string, email: string) =>
  email ? `${path}?${new URLSearchParams({ email })}` : path;
