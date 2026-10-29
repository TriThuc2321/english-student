import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { SESSION_EXPIRED_PATH } from '@/constants/routes';
import { callBe, SESSION_COOKIE } from '@/lib/auth/session';

import { ApiError } from './client';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const accessToken = (await cookies()).get(SESSION_COOKIE.ACCESS)?.value;
  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return callBe(path, { ...init, headers });
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  // A Server Component can't clear cookies, and proxy.ts bounces /login back
  // to / while the stale access cookie exists, so a route handler clears them.
  if (res.status === 401) {
    redirect(SESSION_EXPIRED_PATH);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data as T;
}
