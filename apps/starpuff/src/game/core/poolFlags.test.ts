import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { POOL_TRANSIENT_FLAGS, acquirePooled, resetTransientFlags } from './poolFlags';

// 池瞬時旗標 SSOT 守門（PR #886）：resetTransientFlags 對在冊旗標逐一歸位 false，
// acquirePooled 為池取出唯一入口，且原始碼靜態守門禁止繞過 wrapper 直呼 pool .get
// ——「新增旗標」與「新增取出點」兩個維度的遺漏都必須被抓到。

describe('poolFlags（池瞬時旗標 SSOT）', () => {
  it('resetTransientFlags 將在冊旗標全部歸位 false', () => {
    const data = new Map<string, unknown>(POOL_TRANSIENT_FLAGS.map((flag) => [flag, true]));
    resetTransientFlags({ setData: (key, value) => data.set(key, value) });
    for (const flag of POOL_TRANSIENT_FLAGS) expect(data.get(flag)).toBe(false);
  });

  it('acquirePooled 取出即復位；池竭回 null', () => {
    const data = new Map<string, unknown>(POOL_TRANSIENT_FLAGS.map((flag) => [flag, true]));
    const pooled = { setData: (key: string, value: unknown) => data.set(key, value) };
    const group = { get: () => pooled };
    expect(acquirePooled(group, 0, 0)).toBe(pooled);
    for (const flag of POOL_TRANSIENT_FLAGS) expect(data.get(flag)).toBe(false);
    expect(acquirePooled({ get: () => null }, 0, 0)).toBeNull();
  });
});

describe('池取出點靜態守門（PR #886 R3：新取出點不走 acquirePooled 必被抓）', () => {
  const GAME_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
  // 池群組命名全集（含 enemies 本體池的 group）：raw .get 直呼＝繞過取出即復位。
  const RAW_POOL_GET =
    /\b(hazards|projectiles|shockwaves|stars|meteors|embers|shields|group)\.get\(/;

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return walk(path);
      return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : [];
    });

  it('src/game 內禁止 raw pool .get（一律走 acquirePooled）', () => {
    const violations: string[] = [];
    for (const file of walk(GAME_DIR)) {
      if (file.endsWith('poolFlags.ts')) continue;
      const lines = readFileSync(file, 'utf-8').split('\n');
      lines.forEach((line, index) => {
        if (RAW_POOL_GET.test(line)) {
          violations.push(`${relative(GAME_DIR, file)}:${index + 1} ${line.trim()}`);
        }
      });
    }
    expect(violations).toEqual([]);
  });
});
