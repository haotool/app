import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EGG_HP_CAP, PLAYER } from '../core/config';
import type { LevelSpec } from '../logic/levels';
import { createEggTracker, type EggTrackerHooks } from './eggTracker';
import type { PlayerHandle } from './player';

// characterization（v17 債務列車）：鎖住自 GameScene 抽出的彩蛋追蹤與獎勵
// 落地現行為；advanceEgg 推進數學由 logic/eggs 單測覆蓋。

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

function makeLevel(overrides: Partial<LevelSpec>): LevelSpec {
  return {
    boss: null,
    platforms: [],
    easterEggs: [],
    ...overrides,
  } as unknown as LevelSpec;
}

function makeHarness(
  level: LevelSpec,
  config: { hp?: number; bossActive?: boolean } = {},
): {
  tracker: ReturnType<typeof createEggTracker>;
  heal: ReturnType<typeof vi.fn>;
  grantFullMagazine: ReturnType<typeof vi.fn>;
  grantGoldStar: ReturnType<typeof vi.fn>;
  recordEggAndAward: ReturnType<typeof vi.fn>;
  celebrate: ReturnType<typeof vi.fn>;
  playerBody: { blocked: { down: boolean }; touching: { down: boolean }; bottom: number };
  playerSprite: { x: number; y: number };
  setNow: (value: number) => void;
} {
  const heal = vi.fn();
  const grantFullMagazine = vi.fn();
  const grantGoldStar = vi.fn();
  const recordEggAndAward = vi.fn();
  const celebrate = vi.fn();
  const playerBody = { blocked: { down: true }, touching: { down: false }, bottom: 292 };
  const playerSprite = { x: 100, y: 280, body: playerBody };
  let now = 1000;
  const hooks: EggTrackerHooks = {
    player: () =>
      ({
        sprite: playerSprite,
        heal,
        grantFullMagazine,
        grantGoldStar,
      }) as unknown as PlayerHandle,
    playerHp: () => config.hp ?? 3,
    bossActive: () => config.bossActive ?? false,
    now: () => now,
    recordEggAndAward,
    celebrate,
  };
  return {
    tracker: createEggTracker(level, hooks),
    heal,
    grantFullMagazine,
    grantGoldStar,
    recordEggAndAward,
    celebrate,
    playerBody,
    playerSprite,
    setNow: (value) => {
      now = value;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reach-x 彩蛋（§24 回頭走）', () => {
  const level = makeLevel({
    easterEggs: [{ trigger: 'reach-x', reward: 'hp-up', maxX: 150 }] as LevelSpec['easterEggs'],
  });

  it('位置事件退至 x ≤ maxX 觸發一次：記錄存檔＋回血＋慶祝，之後不重複', () => {
    const harness = makeHarness(level);
    harness.playerSprite.x = 400;
    harness.tracker.sync();
    expect(harness.recordEggAndAward).not.toHaveBeenCalled();
    harness.playerSprite.x = 120;
    harness.tracker.sync();
    expect(harness.recordEggAndAward).toHaveBeenCalledWith('reach-x');
    expect(harness.heal).toHaveBeenCalledWith(1, EGG_HP_CAP);
    expect(harness.celebrate).toHaveBeenCalledWith('彩虹果凍 +1 HP');
    harness.tracker.sync();
    expect(harness.recordEggAndAward).toHaveBeenCalledTimes(1);
  });
});

describe('stand-count 彩蛋與站立平台判定', () => {
  const level = makeLevel({
    platforms: [{ x: 100, y: 300, w: 120 }] as LevelSpec['platforms'],
    easterEggs: [
      { trigger: 'stand-count', reward: 'full-magazine', platformY: 300, count: 2 },
    ] as LevelSpec['easterEggs'],
  });

  it('上升緣計數：站上→離開→再站上達次數觸發滿彈匣（連續站立不重計）', () => {
    const harness = makeHarness(level);
    harness.playerBody.bottom = 292;
    harness.playerSprite.x = 100;
    harness.tracker.sync();
    // 連續站立同平台不重計。
    harness.tracker.sync();
    expect(harness.grantFullMagazine).not.toHaveBeenCalled();
    // 離開平台（離地）再站回：第二次上升緣觸發。
    harness.playerBody.blocked.down = false;
    harness.tracker.sync();
    harness.playerBody.blocked.down = true;
    harness.tracker.sync();
    expect(harness.grantFullMagazine).toHaveBeenCalledTimes(1);
    expect(harness.celebrate).toHaveBeenCalledWith('星星雨！彈匣全滿');
  });

  it('離地（非 blocked/touching down）回報 null 不推進', () => {
    const harness = makeHarness(level);
    harness.playerBody.blocked.down = false;
    harness.playerBody.touching.down = false;
    harness.tracker.sync();
    harness.tracker.sync();
    expect(harness.grantFullMagazine).not.toHaveBeenCalled();
  });
});

describe('crown-early-hit 魔王受擊時間窗', () => {
  const level = makeLevel({
    boss: 'jellord',
    easterEggs: [
      { trigger: 'crown-early-hit', reward: 'heal', windowMs: 5000 },
    ] as LevelSpec['easterEggs'],
  });

  it('魔王 active 起算；窗內受擊觸發、記錄起點前受擊不觸發', () => {
    const harness = makeHarness(level, { bossActive: true, hp: 3 });
    // active 前 noteBossHit 零效果（bossActiveAt 未鎖存）。
    harness.tracker.noteBossHit();
    expect(harness.recordEggAndAward).not.toHaveBeenCalled();
    harness.setNow(2000);
    harness.tracker.sync();
    harness.setNow(4000);
    harness.tracker.noteBossHit();
    expect(harness.recordEggAndAward).toHaveBeenCalledWith('crown-early-hit');
    // 非滿血走 +1 HP 分支（PLAYER.maxHp 上限）。
    expect(harness.heal).toHaveBeenCalledWith(1, PLAYER.maxHp);
    expect(harness.celebrate).toHaveBeenCalledWith('皇冠火花 +1 HP');
  });

  it('滿血時 heal fallback 改給滿彈匣（獎勵必有回饋）', () => {
    const harness = makeHarness(level, { bossActive: true, hp: PLAYER.maxHp });
    harness.setNow(2000);
    harness.tracker.sync();
    harness.setNow(3000);
    harness.tracker.noteBossHit();
    expect(harness.grantFullMagazine).toHaveBeenCalledTimes(1);
    expect(harness.celebrate).toHaveBeenCalledWith('皇冠火花！彈匣全滿');
  });
});

describe('gold-star 與外部事件餵送', () => {
  it('twin-finish 事件經 feed 觸發金星彈獎勵', () => {
    const level = makeLevel({
      easterEggs: [{ trigger: 'twin-finish', reward: 'gold-star' }] as LevelSpec['easterEggs'],
    });
    const harness = makeHarness(level);
    harness.tracker.feed({ kind: 'twin-finish' });
    expect(harness.grantGoldStar).toHaveBeenCalledTimes(1);
    expect(harness.celebrate).toHaveBeenCalledWith('金星彈入匣！');
  });
});
