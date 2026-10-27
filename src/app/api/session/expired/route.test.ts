// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('GET /api/session/expired', () => {
  it('clears both session cookies and redirects to /login', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/session/expired'),
    );

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
    expect(res.cookies.get('st_access_token')?.value).toBe('');
    expect(res.cookies.get('st_refresh_token')?.value).toBe('');
  });
});
