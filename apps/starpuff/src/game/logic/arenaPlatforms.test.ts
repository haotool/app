import { describe, expect, it } from 'vitest';
import { VIEW } from '../core/config';
import { getLevel } from './levels';

// arena 相對平台（#960）。魔王 arena 的世界寬＝前室 + **動態視寬**，靜態 x 在不同
// 視窗下會偏移（854 視寬置中者於 1200 下偏左 173px）——這是七個魔王關 platforms
// 恆為空的實務原因。本組釘住「以比例定位者在所有視寬皆落在預期位置」。

// createTerrain 的解析式（同一條算式，於此以純函式形式驗證幾何契約）。
function resolveX(arenaLeft: number, arenaWidth: number, xRatio: number): number {
  return arenaLeft + arenaWidth * xRatio;
}

const ANTEROOM_PX = 400;
const GROUND_TOP = VIEW.height - 80;
// 劉董體型（liudong.ts 鏡像）：體高 150 → 頭頂 y = GROUND_TOP - 150。
const BOSS_BODY_W = 170;
const BOSS_BODY_H = 150;
// 玩家跳躍（config 鏡像）：v²/2g。
const JUMP_APEX_PX = (420 * 420) / (2 * 900);

describe('L30 越場側翼平台（#960）', () => {
  const level = getLevel(30);
  const platforms = level.arenaPlatforms ?? [];

  it('L30 定義了 arena 相對平台（非靜態 platforms）', () => {
    expect(level.platforms).toEqual([]);
    expect(platforms.length).toBeGreaterThan(0);
  });

  it('在支援視寬全域皆相對 arena 對稱——不因視窗變寬而偏移', () => {
    for (const viewW of [VIEW.minWidth, 1000, VIEW.maxWidth]) {
      const arenaCx = resolveX(ANTEROOM_PX, viewW, 0.5);
      const xs = platforms.map((p) => resolveX(ANTEROOM_PX, viewW, p.xRatio));
      const offsets = xs.map((x) => x - arenaCx).sort((a, b) => a - b);
      // 左右對稱：最左與最右的偏移量互為相反數（tsconfig target 未含 Array#at）。
      const first = offsets[0] ?? 0;
      const last = offsets[offsets.length - 1] ?? 0;
      expect(first, `viewW=${viewW}`).toBeCloseTo(-last, 5);
    }
  });

  it('平台位於魔王體寬之外——不與其重疊、不成為頭頂棲身點', () => {
    for (const viewW of [VIEW.minWidth, VIEW.maxWidth]) {
      const arenaCx = resolveX(ANTEROOM_PX, viewW, 0.5);
      for (const p of platforms) {
        const x = resolveX(ANTEROOM_PX, viewW, p.xRatio);
        const gapFromBossEdge = Math.abs(x - arenaCx) - BOSS_BODY_W / 2 - p.w / 2;
        expect(gapFromBossEdge, `viewW=${viewW} xRatio=${p.xRatio}`).toBeGreaterThan(0);
      }
    }
  });

  it('平台高度單跳可及（自地面）', () => {
    for (const p of platforms) {
      expect(GROUND_TOP - p.y).toBeLessThan(JUMP_APEX_PX);
    }
  });

  it('自平台起跳可越過魔王頭頂——這是本次改動的目的', () => {
    const bossTopY = GROUND_TOP - BOSS_BODY_H;
    for (const p of platforms) {
      // 自平台面起跳的頂點高度，需高於魔王頭頂（y 越小越高）。
      expect(p.y - JUMP_APEX_PX).toBeLessThan(bossTopY);
    }
  });

  it('反證：自地面直接起跳無法越過魔王頭頂（故平台有其必要）', () => {
    const bossTopY = GROUND_TOP - BOSS_BODY_H;
    expect(GROUND_TOP - JUMP_APEX_PX).toBeGreaterThan(bossTopY);
  });
});
