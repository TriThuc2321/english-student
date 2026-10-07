import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import ENV from '@/configs/env';
import { AUTH_CLIENT } from '@/lib/auth/constants';
import {
  generateNonce,
  OAUTH_NONCE_COOKIE,
  oauthNonceCookieOptions,
} from '@/lib/auth/oauth-nonce';

export async function GET() {
  const nonce = generateNonce();
  (await cookies()).set(OAUTH_NONCE_COOKIE, nonce, oauthNonceCookieOptions);

  const target = new URL('/api/auth/google', ENV.API_URL);
  target.searchParams.set('client', AUTH_CLIENT);
  target.searchParams.set('nonce', nonce);
  redirect(target.toString());
}
