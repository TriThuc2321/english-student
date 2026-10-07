// The BE throttles per IP and sees this server as the caller, so forward the
// browser's IP; BE only honours it when TRUST_PROXY covers this server.
export function getClientIp(headers: Headers) {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    undefined
  );
}

export function withClientIp(headers: HeadersInit | undefined, ip?: string) {
  const result = new Headers(headers);
  if (ip) {
    result.set('X-Forwarded-For', ip);
  }
  return result;
}
