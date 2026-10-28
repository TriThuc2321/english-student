import { describe, expect, it } from 'vitest';

import {
  buildTestsHref,
  type CatalogueParams,
  parseCatalogueParams,
} from './catalogue-params';

describe('parseCatalogueParams', () => {
  it.each([
    [{}, { exam: undefined, q: '', page: 1 }],
    [
      { exam: 'TOEIC_LR', page: '3' },
      { exam: 'TOEIC_LR', q: '', page: 3 },
    ],
    [
      { exam: 'FOO', page: '0' },
      { exam: undefined, q: '', page: 1 },
    ],
    [{ page: 'abc' }, { exam: undefined, q: '', page: 1 }],
    [{ page: '1.5' }, { exam: undefined, q: '', page: 1 }],
    [{ page: '-2' }, { exam: undefined, q: '', page: 1 }],
    [
      { exam: ['IELTS_GENERAL', 'TOEIC_SW'], q: '  cam  ' },
      { exam: 'IELTS_GENERAL', q: 'cam', page: 1 },
    ],
  ])('parses %o', (input, expected) => {
    expect(parseCatalogueParams(input)).toEqual(expected);
  });

  it('truncates q to 255 characters after trimming', () => {
    expect(parseCatalogueParams({ q: ` ${'a'.repeat(300)} ` }).q).toHaveLength(
      255,
    );
  });
});

describe('buildTestsHref', () => {
  it.each([
    [{}, '/'],
    [{ page: 1 }, '/'],
    [{ exam: 'TOEIC_LR', q: 'cam', page: 1 }, '/?exam=TOEIC_LR&q=cam'],
    [{ q: 'a b', page: 2 }, '/?q=a+b&page=2'],
  ])('builds %o', (input, expected) => {
    expect(buildTestsHref(input as Partial<CatalogueParams>)).toBe(expected);
  });
});
