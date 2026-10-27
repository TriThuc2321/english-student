import { type NextRequest, NextResponse } from 'next/server';

import { LOGIN_PATH } from '@/lib/auth/constants';
import { clearSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  clearSession(response.cookies);
  return response;
}
