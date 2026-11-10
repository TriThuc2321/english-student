import { describe, expect, it } from 'vitest';

import { AuthFormError, toFormError } from './form-state';

describe('toFormError', () => {
  it.each([
    [undefined, undefined, AuthFormError.UNAVAILABLE],
    [502, undefined, AuthFormError.UNAVAILABLE],
    [429, undefined, AuthFormError.TOO_MANY_REQUESTS],
    [401, undefined, AuthFormError.INVALID_CREDENTIALS],
    [403, 'CMS_ACCESS_DENIED', AuthFormError.INVALID_CREDENTIALS],
    [400, 'INVALID_CODE', AuthFormError.INVALID_CODE],
    [400, undefined, AuthFormError.INVALID],
  ])('maps %s %s to %s', (status, code, expected) => {
    expect(toFormError(status, code)).toBe(expected);
  });
});
