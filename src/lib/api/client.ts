import { LOGIN_PATH } from '@/lib/auth/constants';

const BASE_URL = '/api/bff';

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(`Request failed with status ${status}`);
  }
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      window.location.href = LOGIN_PATH;
    }
    throw new ApiError(res.status, data);
  }

  return data as T;
}
