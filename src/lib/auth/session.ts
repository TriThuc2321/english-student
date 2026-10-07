import ENV from '@/configs/env';

import { AUTH_CLIENT } from './constants';

export const SESSION_COOKIE = {
  ACCESS: ENV.COOKIE.ACCESS_TOKEN_NAME,
  REFRESH: ENV.COOKIE.REFRESH_TOKEN_NAME,
};

const ACCESS_EXPIRY_SKEW_SECONDS = 30;
const REFRESH_DEDUPE_MS = 30_000;

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
  refresh_token_expires_at: string;
};

export type RefreshResult =
  | { ok: true; tokens: SessionTokens }
  | { ok: false; reason: 'invalid' | 'rotated' | 'unavailable' };

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge?: number;
  expires?: Date;
};

type CookieWriter = {
  set(name: string, value: string, options: CookieOptions): unknown;
  delete(name: string): unknown;
};

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export function callBe(path: string, init: RequestInit = {}) {
  return fetch(`${ENV.API_URL}/api${path}`, { ...init, cache: 'no-store' });
}

function secondsUntilExpiry(jwt: string) {
  const { exp } = JSON.parse(
    Buffer.from(jwt.split('.')[1], 'base64url').toString(),
  ) as { exp: number };
  return exp - Math.floor(Date.now() / 1000);
}

export function applySession(target: CookieWriter, tokens: SessionTokens) {
  target.set(SESSION_COOKIE.ACCESS, tokens.access_token, {
    ...baseCookieOptions,
    maxAge: Math.max(
      secondsUntilExpiry(tokens.access_token) - ACCESS_EXPIRY_SKEW_SECONDS,
      0,
    ),
  });
  target.set(SESSION_COOKIE.REFRESH, tokens.refresh_token, {
    ...baseCookieOptions,
    expires: new Date(tokens.refresh_token_expires_at),
  });
}

export function clearSession(target: CookieWriter) {
  target.delete(SESSION_COOKIE.ACCESS);
  target.delete(SESSION_COOKIE.REFRESH);
}

async function requestRefresh(refreshToken: string): Promise<RefreshResult> {
  let res: Response;
  try {
    res = await callBe('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client: AUTH_CLIENT, refreshToken }),
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  if (res.ok) {
    return { ok: true, tokens: (await res.json()) as SessionTokens };
  }
  if (res.status >= 500) {
    return { ok: false, reason: 'unavailable' };
  }
  const body = (await res.json().catch(() => null)) as { code?: string } | null;
  return {
    ok: false,
    reason: body?.code === 'REFRESH_TOKEN_ROTATED' ? 'rotated' : 'invalid',
  };
}

const globalForRefresh = globalThis as typeof globalThis & {
  __boRefresh?: Map<string, { promise: Promise<RefreshResult>; at: number }>;
};
const refreshes = (globalForRefresh.__boRefresh ??= new Map());

export function refreshSession(refreshToken: string) {
  const now = Date.now();
  for (const [token, entry] of refreshes) {
    if (now - entry.at > REFRESH_DEDUPE_MS) {
      refreshes.delete(token);
    }
  }

  const pending = refreshes.get(refreshToken);
  if (pending) {
    return pending.promise;
  }
  const promise = requestRefresh(refreshToken);
  refreshes.set(refreshToken, { promise, at: now });
  return promise;
}
