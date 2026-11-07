import { describe, expect, it } from 'vitest';

import { clampSplit } from './useSplitRatio';

describe('clampSplit', () => {
  it('keeps the passage between 30% and 70%', () => {
    expect(clampSplit(10)).toBe(30);
    expect(clampSplit(95)).toBe(70);
    expect(clampSplit(48.6)).toBe(49);
  });
});
