import { randomBytes, timingSafeEqual } from 'node:crypto';

import { GOOGLE_LOGIN_START_PATH } from './constants';

export const OAUTH_NONCE_COOKIE = 'oauth_nonce';

export const oauthNonceCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: GOOGLE_LOGIN_START_PATH,
  maxAge: 600,
};

export const generateNonce = () => randomBytes(16).toString('base64url');

export function nonceMatches(expected: string | undefined, actual: unknown) {
  if (!expected || typeof actual !== 'string') return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}
