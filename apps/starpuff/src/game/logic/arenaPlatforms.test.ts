import { describe, expect, it } from 'vitest';
import { GRAVITY_Y, PLAYER, VIEW } from '../core/config';
import { maxJumpClearancePx } from './difficulty';
import { L30_ARENA_PLATFORMS, getLevel } from './levels';
import { LIUDONG } from './liudongFsm';

// L30 中央平台幾何（#960／#964）：平台不是固定跳鏈，而是讀招後的換位工具；
// 地面永遠保留完整通路，且平台以固定像素 offset 解析，不受視窗寬度改變可玩性。
const GROUND_TOP = VIEW.height - 80;
const PLATFORM_H = 16;
const PLATFORM_BOSS_CLEARANCE_PX = 8;
// 劉董體型與物理箱（liudong.ts 鏡像）：視覺高 150，物理高 88%。
const BOSS_BODY_H = 150;
const BOSS_PHYS_TOP_Y =
  GROUND_TOP - BOSS_BODY_H / 2 - (BOSS_BODY_H * LIUDONG.bodyHitboxHeightRatio) / 2;

const level = getLevel(30);
const platforms = [...(level.arenaPlatforms ?? [])].sort((a, b) => a.offsetPx - b.offsetPx);

describe('L30 中央平台幾何（#964）', () => {
  it('只保留一塊位於 arena 正中的平台，左右側台已移除', () => {
    const offsets = platforms.map((p) => p.offsetPx);
    expect(platforms).toHaveLength(1);
    expect(platforms).toEqual([...L30_ARENA_PLATFORMS]);
    expect(offsets).toEqual([0]);
  });

  it('平台比舊版中央台再低，仍在滿拍翅可達高度內', () => {
    const [mid] = platforms;
    expect(mid?.y ?? 0).toBeGreaterThan(248);
    const platformTop = (mid?.y ?? GROUND_TOP) - PLATFORM_H / 2;
    expect(GROUND_TOP - platformTop).toBeLessThanOrEqual(maxJumpClearancePx());
  });

  it('中央平台上緣與劉董物理箱保留玩家站立安全距離，並保留足夠水平承接空間', () => {
    const [mid] = platforms;
    expect((mid?.y ?? GROUND_TOP) - PLATFORM_H / 2).toBeLessThanOrEqual(
      BOSS_PHYS_TOP_Y - PLATFORM_BOSS_CLEARANCE_PX,
    );
    expect(Math.abs(mid?.offsetPx ?? Infinity)).toBe(0);
    expect(mid?.w ?? 0).toBeGreaterThanOrEqual(PLAYER.moveSpeed * 1.2);
  });

  it('固定像素 offset 不因寬視窗改變，避免再次引入跨距陷阱', () => {
    const [mid] = platforms;
    expect(mid?.offsetPx).toBe(0);
    // 修前兩側 xRatio 平台在最小視寬的間隙已超過單跳水平射程；現在不再存在該路線。
    const legacyGap = 0.5 * VIEW.minWidth - 120;
    const jumpRangePx = PLAYER.moveSpeed * ((2 * Math.abs(PLAYER.jumpVelocity)) / GRAVITY_Y);
    expect(legacyGap).toBeGreaterThan(jumpRangePx);
  });
});
