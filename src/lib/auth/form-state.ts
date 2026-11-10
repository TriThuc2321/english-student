export enum AuthFormError {
  INVALID_CREDENTIALS = 'invalidCredentials',
  INVALID_CODE = 'invalidCode',
  INVALID = 'invalid',
  PASSWORD_MISMATCH = 'passwordMismatch',
  TOO_MANY_REQUESTS = 'tooManyRequests',
  UNAVAILABLE = 'unavailable',
}

export type AuthFormState =
  | {
      error?: AuthFormError;
      values?: Record<string, string>;
      sentAt?: number;
    }
  | undefined;

export function toFormError(status: number | undefined, code?: string) {
  if (status === undefined || status >= 500) return AuthFormError.UNAVAILABLE;
  if (status === 429) return AuthFormError.TOO_MANY_REQUESTS;
  if (status === 401 || status === 403) {
    return AuthFormError.INVALID_CREDENTIALS;
  }
  if (code === 'INVALID_CODE') return AuthFormError.INVALID_CODE;
  return AuthFormError.INVALID;
}
