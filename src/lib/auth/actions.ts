'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AUTH_CLIENT, LOGIN_PATH } from './constants';
import { callBe, clearSession, SESSION_COOKIE } from './session';

export async function logout() {
  const store = await cookies();
  const accessToken = store.get(SESSION_COOKIE.ACCESS)?.value;

  if (accessToken) {
    await callBe('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client: AUTH_CLIENT,
        refreshToken: store.get(SESSION_COOKIE.REFRESH)?.value,
      }),
    }).catch(() => {});
  }

  clearSession(store);
  redirect(LOGIN_PATH);
}
