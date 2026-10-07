import { type NextRequest, NextResponse } from 'next/server';

import ENV from '@/configs/env';
import { getClientIp, withClientIp } from '@/lib/auth/client-ip';
import { LOGIN_PATH } from '@/lib/auth/constants';
import {
  applySession,
  clearSession,
  refreshSession,
  SESSION_COOKIE,
  type SessionTokens,
} from '@/lib/auth/session';

const BFF_PREFIX = '/api/bff/';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  let accessToken = request.cookies.get(SESSION_COOKIE.ACCESS)?.value;
  const refreshToken = request.cookies.get(SESSION_COOKIE.REFRESH)?.value;
  const clientIp = getClientIp(request.headers);

  let issued: SessionTokens | undefined;
  let expired = false;

  if (!accessToken && refreshToken) {
    const result = await refreshSession(refreshToken, clientIp);
    if (result.ok) {
      issued = result.tokens;
      accessToken = result.tokens.access_token;
      request.cookies.set(SESSION_COOKIE.ACCESS, result.tokens.access_token);
      request.cookies.set(SESSION_COOKIE.REFRESH, result.tokens.refresh_token);
    } else if (result.reason === 'rotated' && isDocumentRequest(request)) {
      return NextResponse.redirect(request.nextUrl);
    } else if (result.reason === 'invalid') {
      expired = true;
    }
  }

  const finish = (response: NextResponse) => {
    if (issued) {
      applySession(response.cookies, issued);
    } else if (expired) {
      clearSession(response.cookies);
    }
    return response;
  };

  if (pathname.startsWith(BFF_PREFIX)) {
    if (!accessToken) {
      return finish(
        NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      );
    }
    const headers = withClientIp(request.headers, clientIp);
    headers.delete('cookie');
    headers.set('Authorization', `Bearer ${accessToken}`);
    const target = new URL(
      `/api/${pathname.slice(BFF_PREFIX.length)}${search}`,
      ENV.API_URL,
    );
    return finish(NextResponse.rewrite(target, { request: { headers } }));
  }

  const isLoginPage = pathname === LOGIN_PATH;
  if (!accessToken && !isLoginPage) {
    return finish(NextResponse.redirect(new URL(LOGIN_PATH, request.url)));
  }
  if (accessToken && isLoginPage) {
    return finish(NextResponse.redirect(new URL('/', request.url)));
  }

  return finish(
    NextResponse.next({ request: { headers: new Headers(request.headers) } }),
  );
}

function isDocumentRequest(request: NextRequest) {
  return (
    request.method === 'GET' &&
    request.headers.get('sec-fetch-dest') === 'document'
  );
}

export const config = {
  matcher: [
    '/((?!api/session|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
};
