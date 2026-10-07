'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getClientIp, withClientIp } from './client-ip';
import { AUTH_CLIENT, LOGIN_PATH } from './constants';
import { callBe, clearSession, SESSION_COOKIE } from './session';

export async function logout() {
  const store = await cookies();
  const refreshToken = store.get(SESSION_COOKIE.REFRESH)?.value;

  if (refreshToken) {
    await callBe('/auth/logout', {
      method: 'POST',
      headers: withClientIp(
        { 'Content-Type': 'application/json' },
        getClientIp(await headers()),
      ),
      body: JSON.stringify({ client: AUTH_CLIENT, refreshToken }),
    }).catch(() => {});
  }

  clearSession(store);
  redirect(LOGIN_PATH);
}
