import type { NextRequest } from 'next/server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getClientIp } from '@/lib/auth/client-ip';
import { isLoginError, LOGIN_PATH, LoginError } from '@/lib/auth/constants';
import {
  nonceMatches,
  OAUTH_NONCE_COOKIE,
  oauthNonceCookieOptions,
} from '@/lib/auth/oauth-nonce';
import { applySession, refreshSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const error = searchParams.get('error');
  const code = searchParams.get('code');

  const store = await cookies();
  const expectedNonce = store.get(OAUTH_NONCE_COOKIE)?.value;
  store.delete({
    name: OAUTH_NONCE_COOKIE,
    path: oauthNonceCookieOptions.path,
  });

  if (error || !code) {
    const reason = isLoginError(error) ? error : LoginError.GOOGLE_LOGIN_FAILED;
    redirect(`${LOGIN_PATH}?error=${reason}`);
  }

  if (!nonceMatches(expectedNonce, searchParams.get('state'))) {
    redirect(`${LOGIN_PATH}?error=${LoginError.GOOGLE_LOGIN_FAILED}`);
  }

  const result = await refreshSession(code, getClientIp(request.headers));
  if (!result.ok) {
    redirect(`${LOGIN_PATH}?error=${LoginError.GOOGLE_LOGIN_FAILED}`);
  }

  applySession(store, result.tokens);
  redirect('/');
}
