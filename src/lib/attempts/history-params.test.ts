import { describe, expect, it } from 'vitest';

import { buildAttemptsHref, parseHistoryParams } from './history-params';

describe('parseHistoryParams', () => {
  it('defaults to all statuses on page 1', () => {
    expect(parseHistoryParams({})).toEqual({ status: undefined, page: 1 });
  });

  it('keeps a known status and page', () => {
    expect(parseHistoryParams({ status: 'GRADED', page: '3' })).toEqual({
      status: 'GRADED',
      page: 3,
    });
  });

  it('drops an unknown status and a bad page', () => {
    expect(parseHistoryParams({ status: 'DONE', page: '-2' })).toEqual({
      status: undefined,
      page: 1,
    });
  });

  it('reads the first of repeated params', () => {
    expect(parseHistoryParams({ status: ['EXPIRED', 'GRADED'] }).status).toBe(
      'EXPIRED',
    );
  });
});

describe('buildAttemptsHref', () => {
  it('omits defaults', () => {
    expect(buildAttemptsHref({ page: 1 })).toBe('/attempts');
  });

  it('includes status and page', () => {
    expect(buildAttemptsHref({ status: 'IN_PROGRESS', page: 2 })).toBe(
      '/attempts?status=IN_PROGRESS&page=2',
    );
  });
});
