import { describe, expect, it } from 'vitest';
import { GRAVITY_Y, PLAYER, VIEW } from '../core/config';
import { getLevel } from './levels';

// L30 越場踏腳石鏈（#960／#964 重設計）。
//
// #964 教訓：初版僅驗算「跳得上」與「越得過魔王頭頂」，**漏了水平射程**——兩塊側台
// 相距 427–600px 而單跳只飛 205px，玩家實測跨不過去。且原以 xRatio 比例定位，使間距
// 隨視寬膨脹；跳躍射程是固定像素，幾何必須同單位，故改 offsetPx。

const GROUND_TOP = VIEW.height - 80;
// 劉董體型（liudong.ts 鏡像）。
const BOSS_BODY_W = 170;
const BOSS_BODY_H = 150;
const BOSS_TOP_Y = GROUND_TOP - BOSS_BODY_H;

// 單跳能力：頂點 v²/2g、滯空 2v/g、水平射程 speed × 滯空。
const JUMP_APEX_PX = (PLAYER.jumpVelocity * PLAYER.jumpVelocity) / (2 * GRAVITY_Y);
const JUMP_AIRTIME_S = (2 * Math.abs(PLAYER.jumpVelocity)) / GRAVITY_Y;
const JUMP_RANGE_PX = PLAYER.moveSpeed * JUMP_AIRTIME_S;

const level = getLevel(30);
const platforms = [...(level.arenaPlatforms ?? [])].sort((a, b) => a.offsetPx - b.offsetPx);

describe('L30 越場踏腳石鏈（#964）', () => {
  it('左右對稱，且含一塊位於 arena 正中的中央台', () => {
    const offsets = platforms.map((p) => p.offsetPx);
    expect(offsets.length).toBeGreaterThanOrEqual(3);
    expect(offsets[0]).toBe(-(offsets[offsets.length - 1] ?? 0));
    expect(offsets).toContain(0);
  });

  it('地面可單跳踏上最低階', () => {
    const lowest = platforms.reduce((a, b) => (a.y > b.y ? a : b));
    expect(GROUND_TOP - lowest.y).toBeLessThan(JUMP_APEX_PX);
  });

  // 本次核心回歸點：修前只驗高度不驗水平，遂完全跨不過去。
  it('相鄰平台的水平間隙皆在單跳射程內', () => {
    for (let i = 1; i < platforms.length; i += 1) {
      const prev = platforms[i - 1]!;
      const cur = platforms[i]!;
      const gap = cur.offsetPx - cur.w / 2 - (prev.offsetPx + prev.w / 2);
      expect(gap, `間隙 ${i}`).toBeLessThan(JUMP_RANGE_PX);
    }
  });

  it('相鄰平台的高低差皆在單跳頂點內', () => {
    for (let i = 1; i < platforms.length; i += 1) {
      const rise = Math.abs((platforms[i - 1]?.y ?? 0) - (platforms[i]?.y ?? 0));
      expect(rise, `高低差 ${i}`).toBeLessThan(JUMP_APEX_PX);
    }
  });

  it('中央台高於魔王頭頂，不與其體積重疊', () => {
    const mid = platforms.find((p) => p.offsetPx === 0);
    expect(mid).toBeDefined();
    expect(mid?.y ?? 0).toBeLessThan(BOSS_TOP_Y);
  });

  it('側台位於魔王體寬之外', () => {
    for (const p of platforms) {
      if (p.offsetPx === 0) continue;
      expect(Math.abs(p.offsetPx) - p.w / 2).toBeGreaterThan(BOSS_BODY_W / 2);
    }
  });

  it('反證：修前兩側配置（無中央台）水平間隙超出射程', () => {
    // xRatio 0.25/0.75 於最小視寬即相距 0.5 × 854 = 427px，扣掉兩側各半個平台寬仍超標。
    const legacyGap = 0.5 * VIEW.minWidth - 120;
    expect(legacyGap).toBeGreaterThan(JUMP_RANGE_PX);
  });
});
