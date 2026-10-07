import { cookies } from 'next/headers';

import { callBe, SESSION_COOKIE } from '@/lib/auth/session';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const accessToken = (await cookies()).get(SESSION_COOKIE.ACCESS)?.value;
  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return callBe(path, { ...init, headers });
}
