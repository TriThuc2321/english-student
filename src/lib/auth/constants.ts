export const AUTH_CLIENT = 'bo';

export const LOGIN_PATH = '/login';

export enum LoginError {
  GOOGLE_LOGIN_FAILED = 'google_login_failed',
  CMS_ACCESS_DENIED = 'cms_access_denied',
}

export const isLoginError = (value: unknown): value is LoginError =>
  Object.values<unknown>(LoginError).includes(value);
