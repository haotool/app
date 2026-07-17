import { describe, expect, it } from 'vitest';
import { version as pkgVersion } from '../../package.json';
import { APP_VERSION, VERSION_FALLBACK } from './version';

describe('version', () => {
  it('APP_VERSION 只能是 package.json version 或安全回退值', () => {
    expect([pkgVersion, VERSION_FALLBACK]).toContain(APP_VERSION);
  });

  it('vitest 未注入 define 時回退 VERSION_FALLBACK', () => {
    expect(APP_VERSION).toBe(VERSION_FALLBACK);
  });
});
