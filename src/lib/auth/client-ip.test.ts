import { afterEach, describe, expect, it } from 'vitest';

import ENV from '@/configs/env';

import { getClientIp, withClientIp } from './client-ip';

const original = { ...ENV.CLIENT_IP };

afterEach(() => {
  ENV.CLIENT_IP = { ...original };
});

describe('getClientIp', () => {
  it('reads the configured header when set', () => {
    ENV.CLIENT_IP = { HEADER: 'cf-connecting-ip', HOPS: 0 };
    const headers = new Headers({ 'cf-connecting-ip': ' 1.1.1.1 ' });
    expect(getClientIp(headers)).toBe('1.1.1.1');
  });

  it('returns undefined when no header and no trusted hops', () => {
    ENV.CLIENT_IP = { HEADER: undefined, HOPS: 0 };
    const headers = new Headers({ 'x-forwarded-for': '1.1.1.1' });
    expect(getClientIp(headers)).toBeUndefined();
  });

  it('picks the entry HOPS from the right of x-forwarded-for', () => {
    ENV.CLIENT_IP = { HEADER: undefined, HOPS: 2 };
    const headers = new Headers({
      'x-forwarded-for': 'spoofed, 1.1.1.1, 10.0.0.1',
    });
    expect(getClientIp(headers)).toBe('1.1.1.1');
  });

  it('returns undefined when the chain is shorter than HOPS', () => {
    ENV.CLIENT_IP = { HEADER: undefined, HOPS: 3 };
    const headers = new Headers({ 'x-forwarded-for': '1.1.1.1, 10.0.0.1' });
    expect(getClientIp(headers)).toBeUndefined();
  });
});

describe('withClientIp', () => {
  it('sets X-Forwarded-For when an ip is given', () => {
    const headers = withClientIp({ 'x-forwarded-for': 'old' }, '1.1.1.1');
    expect(headers.get('x-forwarded-for')).toBe('1.1.1.1');
  });

  it('removes X-Forwarded-For when no ip is given', () => {
    const headers = withClientIp({ 'x-forwarded-for': 'old' });
    expect(headers.has('x-forwarded-for')).toBe(false);
  });
});
