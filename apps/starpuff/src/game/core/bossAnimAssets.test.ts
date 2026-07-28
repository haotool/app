import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ASSETS } from './assets';
import { ASSETS_V21_PART1 } from './assetsV21Part1';
import { ASSETS_V21_PART2 } from './assetsV21Part2';
import { ASSETS_V21_PART3 } from './assetsV21Part3';
import { BOSS_ANIM_ASSETS } from './bossAnimAssets';

// 四王動畫組守門（§125 W5 接關）：鍵組結構完整性、素材實檔存在、與主 manifest／
// v21 停車場零重複——manifest 單點真值，防搬遷殘留與雙重註冊。

// 演出鍵組結構 SSOT：與 bossStagecraft 的取鍵約定一致（39 鍵/王）。
const EXPECTED_SUFFIXES = [
  'idle-2',
  'idle-3',
  ...[1, 2, 3, 4].map((i) => `entry-${i}`),
  ...[1, 2, 3].flatMap((m) =>
    ['windup', 'charge', 'burst', 'recover'].map((beat) => `move${m}-${beat}`),
  ),
  ...[1, 2, 3, 4, 5, 6].map((i) => `p2trans-${i}`),
  ...[1, 2, 3, 4, 5, 6, 7].map((i) => `p3trans-${i}`),
  'hit-1',
  'hit-2',
  ...[1, 2, 3, 4, 5, 6].map((i) => `death-${i}`),
];

describe('bossAnimAssets 四王動畫組守門', () => {
  it('四王各 39 鍵、幀結構與 stagecraft 取鍵約定全等', () => {
    expect(EXPECTED_SUFFIXES).toHaveLength(39);
    for (const [kind, entries] of Object.entries(BOSS_ANIM_ASSETS)) {
      const expected = EXPECTED_SUFFIXES.map((suffix) => `boss-${kind}-${suffix}`);
      expect(entries.map((entry) => entry.key)).toEqual(expected);
    }
  });

  it('每條動畫鍵的素材實檔存在且為 WebP', () => {
    for (const entries of Object.values(BOSS_ANIM_ASSETS)) {
      for (const entry of entries) {
        const buffer = readFileSync(fileURLToPath(entry.url));
        expect(buffer.toString('ascii', 0, 4)).toBe('RIFF');
        expect(buffer.toString('ascii', 8, 12)).toBe('WEBP');
      }
    }
  });

  it('與主 manifest／v21 停車場零鍵重複（搬遷完整性，防雙重註冊）', () => {
    const parked = new Set(
      [...ASSETS, ...ASSETS_V21_PART1, ...ASSETS_V21_PART2, ...ASSETS_V21_PART3].map(
        (entry) => entry.key,
      ),
    );
    for (const entries of Object.values(BOSS_ANIM_ASSETS)) {
      const collided = entries.filter((entry) => parked.has(entry.key));
      expect(collided.map((entry) => entry.key)).toEqual([]);
    }
  });
});
