import ENV from '@/configs/env';

export function getClientIp(headers: Headers) {
  const { HEADER, HOPS } = ENV.CLIENT_IP;

  if (HEADER) {
    return headers.get(HEADER)?.trim() || undefined;
  }
  if (HOPS <= 0) {
    return undefined;
  }

  const chain = headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
  if (!chain || chain.length < HOPS) {
    return undefined;
  }
  return chain[chain.length - HOPS];
}

export function withClientIp(headers: HeadersInit | undefined, ip?: string) {
  const result = new Headers(headers);
  if (ip) {
    result.set('X-Forwarded-For', ip);
  } else {
    result.delete('X-Forwarded-For');
  }
  return result;
}
