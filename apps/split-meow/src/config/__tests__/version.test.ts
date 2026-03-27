import { describe, it, expect } from 'vitest';
import { getDisplayVersion, getFullVersion, APP_VERSION } from '../version';

describe('version', () => {
  it('APP_VERSION 是字串', () => {
    expect(typeof APP_VERSION).toBe('string');
    expect(APP_VERSION.length).toBeGreaterThan(0);
  });

  it('getDisplayVersion 以 v 開頭', () => {
    const v = getDisplayVersion();
    expect(v.startsWith('v')).toBe(true);
  });

  it('getDisplayVersion 移除 build metadata (+...)', () => {
    const v = getDisplayVersion();
    expect(v).not.toContain('+');
  });

  it('getFullVersion 以 v 開頭', () => {
    expect(getFullVersion().startsWith('v')).toBe(true);
  });

  it('getDisplayVersion 不重複加 v', () => {
    const v = getDisplayVersion();
    expect(v.startsWith('vv')).toBe(false);
  });
});
