import { describe, expect, it } from 'vitest';

import {
  isLoginError,
  isLoginNotice,
  LoginError,
  LoginNotice,
  withEmail,
} from './constants';

describe('isLoginError', () => {
  it('accepts known login errors', () => {
    expect(isLoginError(LoginError.GOOGLE_LOGIN_FAILED)).toBe(true);
  });

  it.each(['unknown', '', undefined, null, 1])('rejects %s', (value) => {
    expect(isLoginError(value)).toBe(false);
  });
});

describe('isLoginNotice', () => {
  it('accepts known notices', () => {
    expect(isLoginNotice(LoginNotice.PASSWORD_RESET)).toBe(true);
  });

  it.each(['unknown', undefined])('rejects %s', (value) => {
    expect(isLoginNotice(value)).toBe(false);
  });
});

describe('withEmail', () => {
  it('encodes the email into the query', () => {
    expect(withEmail('/verify-email', 'a+b@x.com')).toBe(
      '/verify-email?email=a%2Bb%40x.com',
    );
  });

  it('leaves the path alone without an email', () => {
    expect(withEmail('/verify-email', '')).toBe('/verify-email');
  });
});
