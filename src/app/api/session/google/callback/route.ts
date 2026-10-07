import type { NextRequest } from 'next/server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { isLoginError, LOGIN_PATH, LoginError } from '@/lib/auth/constants';
import { applySession, refreshSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const error = searchParams.get('error');
  const code = searchParams.get('code');

  if (error || !code) {
    const reason = isLoginError(error) ? error : LoginError.GOOGLE_LOGIN_FAILED;
    redirect(`${LOGIN_PATH}?error=${reason}`);
  }

  const result = await refreshSession(code);
  if (!result.ok) {
    redirect(`${LOGIN_PATH}?error=${LoginError.GOOGLE_LOGIN_FAILED}`);
  }

  applySession(await cookies(), result.tokens);
  redirect('/');
}
