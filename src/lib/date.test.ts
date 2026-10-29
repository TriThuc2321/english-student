import { describe, expect, it } from 'vitest';

import { LOCALE } from '@/i18n';

import { formatDate } from './date';

describe('formatDate', () => {
  it('formats in English', () => {
    expect(formatDate('2026-10-20T08:00:00.000Z', LOCALE.EN)).toBe(
      'October 20, 2026',
    );
  });

  it('formats in Vietnamese', () => {
    expect(formatDate('2026-10-20T08:00:00.000Z', LOCALE.VI)).toBe(
      '20 tháng 10 năm 2026',
    );
  });
});
