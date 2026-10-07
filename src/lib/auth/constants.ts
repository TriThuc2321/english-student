export const AUTH_CLIENT = 'web';

export const LOGIN_PATH = '/login';

export const GOOGLE_LOGIN_START_PATH = '/api/session/google';

export enum LoginError {
  GOOGLE_LOGIN_FAILED = 'google_login_failed',
}

export const isLoginError = (value: unknown): value is LoginError =>
  Object.values<unknown>(LoginError).includes(value);
