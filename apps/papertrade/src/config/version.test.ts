import { describe, expect, it } from 'vitest';
import { version as pkgVersion } from '../../package.json';
import { APP_VERSION, VERSION_FALLBACK } from './version';

// 正式版本注入以 build/e2e 為準，此處鎖 fallback 語義（vitest 不注入 define）。
describe('version', () => {
  it('APP_VERSION 只能是 package.json version 或安全回退值', () => {
    expect([pkgVersion, VERSION_FALLBACK]).toContain(APP_VERSION);
  });

  it('vitest 未注入 define 時回退 VERSION_FALLBACK', () => {
    expect(APP_VERSION).toBe(VERSION_FALLBACK);
  });
});
