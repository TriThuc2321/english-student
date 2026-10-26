import { describe, expect, it } from 'vitest';

import { isLoginError, LoginError } from './constants';

describe('isLoginError', () => {
  it('accepts known login errors', () => {
    expect(isLoginError(LoginError.GOOGLE_LOGIN_FAILED)).toBe(true);
  });

  it.each(['unknown', '', undefined, null, 1])('rejects %s', (value) => {
    expect(isLoginError(value)).toBe(false);
  });
});
