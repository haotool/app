import { describe, expect, it } from 'vitest';
import {
  SPRING_COOLDOWN_MS,
  SPRING_VELOCITY_Y,
  canSpringLaunch,
  clampEliteX,
  crossedGate,
  maxDecorInWindow,
  oneWayLandBand,
  restingOnOneWay,
  shouldDropThrough,
  springSweepHit,
  type BoundsRect,
} from './stageModel';

describe('canSpringLaunch 彈簧觸發閘（§29 / recon C.3）', () => {
  it('落下或站立（vy>=0）且冷卻期滿可觸發', () => {
    expect(canSpringLaunch(1000, 0, 0)).toBe(true);
    expect(canSpringLaunch(1000, 0, 320)).toBe(true);
  });

  it('上升中（vy<0）不觸發，防連彈抖動', () => {
    expect(canSpringLaunch(1000, 0, SPRING_VELOCITY_Y)).toBe(false);
    expect(canSpringLaunch(1000, 0, -1)).toBe(false);
  });

  it('冷卻期內不重複觸發，期滿恢復', () => {
    const lockedUntil = 1000 + SPRING_COOLDOWN_MS;
    expect(canSpringLaunch(1100, lockedUntil, 100)).toBe(false);
    expect(canSpringLaunch(lockedUntil, lockedUntil, 100)).toBe(true);
  });
});

describe('shouldDropThrough 下落穿透（§29）', () => {
  it('站在單向平台上搖桿下 + 跳觸發', () => {
    expect(shouldDropThrough(true, true, true)).toBe(true);
  });

  it('缺任一條件不觸發（地面下跳、單按下、單按跳）', () => {
    expect(shouldDropThrough(true, true, false)).toBe(false);
    expect(shouldDropThrough(true, false, true)).toBe(false);
    expect(shouldDropThrough(false, true, true)).toBe(false);
  });
});

describe('restingOnOneWay 站台判定（§71 熱修：接觸旗標抖動免疫）', () => {
  const rect = { left: 925, right: 1075, top: 328, bottom: 344 };
  const base = { left: 982, right: 1018 };

  it('接觸幀（旗標為真、腳底貼台頂）成立', () => {
    expect(restingOnOneWay({ ...base, contactDown: true, velocityY: 0, bottom: 328 }, rect)).toBe(
      true,
    );
  });

  it('落地擠壓迴圈假空中幀（旗標為假、腳底微懸浮、微沉降速度）仍成立', () => {
    expect(
      restingOnOneWay({ ...base, contactDown: false, velocityY: 15, bottom: 323.3 }, rect),
    ).toBe(true);
    expect(
      restingOnOneWay({ ...base, contactDown: false, velocityY: 30, bottom: 326.8 }, rect),
    ).toBe(true);
  });

  it('接觸幀腳底震盪至舊 ±4 容差外（台頂上方 4.7px）仍成立', () => {
    expect(restingOnOneWay({ ...base, contactDown: true, velocityY: 0, bottom: 323.3 }, rect)).toBe(
      true,
    );
  });

  it('起跳上升（vy<0）不成立——向上穿台不得觸發下穿窗', () => {
    expect(
      restingOnOneWay({ ...base, contactDown: false, velocityY: -420, bottom: 328 }, rect),
    ).toBe(false);
  });

  it('高速下墜路過（vy 超過沉降帶）不成立', () => {
    expect(
      restingOnOneWay({ ...base, contactDown: false, velocityY: 400, bottom: 327 }, rect),
    ).toBe(false);
  });

  it('水平投影不重疊或腳底遠離台頂不成立', () => {
    expect(
      restingOnOneWay(
        { left: 700, right: 736, contactDown: true, velocityY: 0, bottom: 328 },
        rect,
      ),
    ).toBe(false);
    expect(restingOnOneWay({ ...base, contactDown: true, velocityY: 0, bottom: 300 }, rect)).toBe(
      false,
    );
    expect(restingOnOneWay({ ...base, contactDown: false, velocityY: 30, bottom: 344 }, rect)).toBe(
      false,
    );
  });
});

describe('下跳指示狀態機（§71：跳鍵此刻＝下跳 → 變色；離開 → 原色）', () => {
  it('壓下且站台成立 → 指示開（jumpPressed 恆以假設值 true 帶入）', () => {
    expect(shouldDropThrough(true, true, true)).toBe(true);
  });

  it('未壓下或不在單向平台 → 指示關（還原原色）', () => {
    expect(shouldDropThrough(false, true, true)).toBe(false);
    expect(shouldDropThrough(true, true, false)).toBe(false);
  });
});

describe('oneWayLandBand 單向著地帶（§71 熱修：高速著地防隧穿）', () => {
  it('低速著地維持既有 +6 緊帶', () => {
    expect(oneWayLandBand(0)).toBe(6);
    expect(oneWayLandBand(4)).toBe(6);
  });

  it('高速著地（單步位移 > 4px）依位移放寬，接住下砸與高處落下', () => {
    expect(oneWayLandBand(11.7)).toBeCloseTo(13.7);
    expect(oneWayLandBand(8)).toBeCloseTo(10);
  });
});

describe('maxDecorInWindow 同屏密度（§32）', () => {
  it('回報任一視窗內最大道具數（視窗含端點）', () => {
    expect(maxDecorInWindow([0, 500, 1000, 1500, 2000], 1200)).toBe(3);
    expect(maxDecorInWindow([0, 100, 200, 300], 1200)).toBe(4);
  });

  it('空佈景回 0；單件回 1', () => {
    expect(maxDecorInWindow([], 1200)).toBe(0);
    expect(maxDecorInWindow([400], 1200)).toBe(1);
  });
});

// 星星門幾何背擋（§43）：L1 實際幾何——門心 2580、判定區 90×150（2535-2625、235-385）。
describe('crossedGate 星星門到達判定（§43）', () => {
  const GATE_X = 2580;
  const zone: BoundsRect = { left: 2535, right: 2625, top: 235, bottom: 385 };
  const playerAt = (x: number): BoundsRect => ({
    left: x - 18,
    right: x + 18,
    top: 361,
    bottom: 400,
  });

  it('停在門區左半（未達門心）：AABB 交疊即判入門', () => {
    expect(crossedGate(2540, 2540, GATE_X, playerAt(2540), zone)).toBe(true);
  });

  it('高速隧穿：單幀自區左外跳至區右外，跨門心即判入門', () => {
    expect(crossedGate(2500, 2660, GATE_X, playerAt(2660), zone)).toBe(true);
  });

  it('跨門心（含等值落點）判入門', () => {
    expect(crossedGate(2579, 2581, GATE_X, playerAt(2581), zone)).toBe(true);
    expect(crossedGate(2570, GATE_X, GATE_X, playerAt(GATE_X), zone)).toBe(true);
  });

  it('生成時已越門（prev=curr 於門心右側、甚至區右外）直接判入門', () => {
    expect(crossedGate(2682, 2682, GATE_X, playerAt(2682), zone)).toBe(true);
    expect(crossedGate(2600, 2600, GATE_X, playerAt(2600), zone)).toBe(true);
  });

  it('重生後 prev 重置於起點：遠離門區不誤觸', () => {
    expect(crossedGate(100, 100, GATE_X, playerAt(100), zone)).toBe(false);
    expect(crossedGate(100, 320, GATE_X, playerAt(320), zone)).toBe(false);
  });

  it('自右向左回頭跨門心（門生在身後補救路徑）亦判入門', () => {
    expect(crossedGate(2650, 2560, GATE_X, playerAt(2560), zone)).toBe(true);
  });
});

// 彈簧掃掠背擋（§43）：L2 實際幾何——彈簧中心 (1150, 391)、44×18（1128-1172、382-400）。
describe('springSweepHit 彈簧掃掠命中（§43）', () => {
  const spring: BoundsRect = { left: 1128, right: 1172, top: 382, bottom: 400 };
  const HALF_W = 18;
  const GROUND_BOTTOM = 400;

  it('走上簧面：腳底帶內且水平交疊命中', () => {
    expect(springSweepHit(1140, 1150, HALF_W, GROUND_BOTTOM, spring)).toBe(true);
  });

  it('高速穿越：單幀自簧左外跳至簧右外，掃掠區間補判命中', () => {
    expect(springSweepHit(1050, 1250, HALF_W, GROUND_BOTTOM, spring)).toBe(true);
  });

  it('腳底帶外不命中：騰空掠過（bottom 高於簧頂帶）或深陷（低於簧底 +10）', () => {
    expect(springSweepHit(1140, 1160, HALF_W, spring.top - 9, spring)).toBe(false);
    expect(springSweepHit(1140, 1160, HALF_W, spring.bottom + 11, spring)).toBe(false);
  });

  it('水平未達（含掃掠區間）不命中', () => {
    expect(springSweepHit(1000, 1090, HALF_W, GROUND_BOTTOM, spring)).toBe(false);
  });

  it('同幀去重與 lockedUntil：首發後冷卻閘擋重複發射', () => {
    // 掃掠與 overlap 同幀雙報：命中判定皆真，發射由 canSpringLaunch 冷卻去重。
    expect(springSweepHit(1140, 1150, HALF_W, GROUND_BOTTOM, spring)).toBe(true);
    const now = 5000;
    expect(canSpringLaunch(now, 0, 0)).toBe(true);
    const lockedUntil = now + SPRING_COOLDOWN_MS;
    expect(canSpringLaunch(now, lockedUntil, 0)).toBe(false);
    expect(canSpringLaunch(lockedUntil, lockedUntil, 0)).toBe(true);
  });
});

describe('clampEliteX（§48 精英房箝制）', () => {
  it('房內不動：座標與速度原樣返回', () => {
    expect(clampEliteX(1500, 130, 1200, 1760)).toEqual({ x: 1500, velocityX: 130 });
  });

  it('越左界回夾並朝房內（正向）反向', () => {
    expect(clampEliteX(1180, -130, 1200, 1760)).toEqual({ x: 1200, velocityX: 130 });
  });

  it('越右界（門前）回夾並朝房內（負向）反向，逾時開門保險不受追殺影響', () => {
    expect(clampEliteX(1790, 130, 1200, 1760)).toEqual({ x: 1760, velocityX: -130 });
    expect(clampEliteX(1790, -50, 1200, 1760)).toEqual({ x: 1760, velocityX: -50 });
  });
});
