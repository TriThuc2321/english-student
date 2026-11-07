import { describe, expect, it } from 'vitest';

import { timerLevel } from './examTimer';

describe('timerLevel', () => {
  it('uses the fixed thresholds for long sections', () => {
    expect(timerLevel(3600, 3600)).toBe('normal');
    expect(timerLevel(599, 3600)).toBe('warning');
    expect(timerLevel(299, 3600)).toBe('danger');
  });

  it('scales the thresholds down for short sections', () => {
    expect(timerLevel(60, 60)).toBe('normal');
    expect(timerLevel(14, 60)).toBe('warning');
    expect(timerLevel(5, 60)).toBe('danger');
  });

  it('falls back to the fixed thresholds without a total', () => {
    expect(timerLevel(400, null)).toBe('warning');
  });
});
