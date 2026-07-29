import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FLAVOR_HINTS, MIX_HINTS } from '../core/codex';
import { GameEvents, emitGameEvent, type GameEventPayloads } from '../core/events';
import type { MagazineSlot } from '../core/config';
import type { LevelSpec } from '../logic/levels';
import { resetSceneEventsSession, wireSceneEvents, type SceneEventHooks } from './sceneEvents';
import type { BossRoomHandle } from './bossRoom';
import type { DamageDirector } from './damageDirector';
import type { EggTracker } from './eggTracker';
import type { FxSystem } from './fx';
import type { LevelGateHandle } from './levelGate';
import type { StageHandle } from './stage';
import type { StarCombat } from './starCombat';
import type { ToastSystem } from './toasts';

// characterization（W2 前置債務車）：鎖住自 GameScene 抽出的事件路由現行為——
// 契約事件 → 各系統結算的分派表、星味首遇提示 session 語意、P3 時停與
// 高風險位增益投放守門、票券蝠加速票、解除綁定零殘留。

// 最小事件匯流排：與 Phaser EventEmitter 同語意（同步派發、依註冊序呼叫）——
// 沿 core/events.test.ts 的 TestBus 介面。
interface TestBus {
  emit(event: string, ...args: unknown[]): unknown;
  on(event: string, fn: (...args: never[]) => void): unknown;
  off(event: string, fn: (...args: never[]) => void): unknown;
  listenerCount(): number;
}

function makeBus(): TestBus {
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>();
  return {
    emit(event, ...args) {
      for (const fn of [...(listeners.get(event) ?? [])]) fn(...args);
    },
    on(event, fn) {
      listeners.set(event, [...(listeners.get(event) ?? []), fn as (...args: unknown[]) => void]);
    },
    off(event, fn) {
      listeners.set(
        event,
        (listeners.get(event) ?? []).filter((candidate) => candidate !== fn),
      );
    },
    listenerCount() {
      let count = 0;
      for (const fns of listeners.values()) count += fns.length;
      return count;
    },
  };
}

interface HarnessConfig {
  exMode?: boolean;
  bossRoom?: boolean;
  arenaBuff?: 'shield' | null;
  arenaBuffPhase?: 'p2' | 'p3';
  outroCinematic?: 'market-open';
}

function makeHarness(config: HarnessConfig = {}): {
  bus: ReturnType<typeof makeBus>;
  unbind: () => void;
  emit: <K extends keyof GameEventPayloads>(event: K, payload: GameEventPayloads[K]) => void;
  spies: Record<
    | 'setPlayerHp'
    | 'setBossHp'
    | 'flavor'
    | 'resolveStarstorm'
    | 'resolveSlamImpact'
    | 'damageBricksInRadius'
    | 'resolveShieldCounter'
    | 'resolveTransformStrike'
    | 'noteBossHit'
    | 'feed'
    | 'hitStop'
    | 'dropArenaBuff'
    | 'resolveBossQuake'
    | 'applyBuff'
    | 'onPlayerDied'
    | 'onBossDefeated'
    | 'gateSpawn'
    | 'playOutroCinematic',
    ReturnType<typeof vi.fn>
  >;
} {
  const bus = makeBus();
  const spies = {
    setPlayerHp: vi.fn(),
    setBossHp: vi.fn(),
    flavor: vi.fn(),
    resolveStarstorm: vi.fn(),
    resolveSlamImpact: vi.fn(),
    damageBricksInRadius: vi.fn(),
    resolveShieldCounter: vi.fn(),
    resolveTransformStrike: vi.fn(),
    noteBossHit: vi.fn(),
    feed: vi.fn(),
    hitStop: vi.fn(),
    dropArenaBuff: vi.fn(),
    resolveBossQuake: vi.fn(),
    applyBuff: vi.fn(),
    onPlayerDied: vi.fn(),
    onBossDefeated: vi.fn(),
    gateSpawn: vi.fn(),
    playOutroCinematic: vi.fn(),
  };
  const hooks: SceneEventHooks = {
    setPlayerHp: spies.setPlayerHp,
    setBossHp: spies.setBossHp,
    toasts: () => ({ flavor: spies.flavor }) as unknown as ToastSystem,
    starCombat: () =>
      ({
        resolveStarstorm: spies.resolveStarstorm,
        resolveSlamImpact: spies.resolveSlamImpact,
        resolveShieldCounter: spies.resolveShieldCounter,
        resolveTransformStrike: spies.resolveTransformStrike,
        slamRadiusPx: () => 88,
      }) as unknown as StarCombat,
    stage: () => ({ damageBricksInRadius: spies.damageBricksInRadius }) as unknown as StageHandle,
    eggTracker: () =>
      ({ noteBossHit: spies.noteBossHit, feed: spies.feed }) as unknown as EggTracker,
    fx: () => ({ hitStop: spies.hitStop }) as unknown as FxSystem,
    damage: () =>
      ({
        resolveBossQuake: spies.resolveBossQuake,
        applyBuff: spies.applyBuff,
      }) as unknown as DamageDirector,
    levelGate: () => ({ spawn: spies.gateSpawn }) as unknown as LevelGateHandle,
    levelSpec: () =>
      ({
        arenaBuff: config.arenaBuff ?? null,
        ...(config.arenaBuffPhase !== undefined ? { arenaBuffPhase: config.arenaBuffPhase } : {}),
        ...(config.outroCinematic !== undefined ? { outroCinematic: config.outroCinematic } : {}),
      }) as unknown as LevelSpec,
    exMode: config.exMode ?? false,
    bossRoom: () =>
      config.bossRoom
        ? ({ dropArenaBuff: spies.dropArenaBuff } as unknown as BossRoomHandle)
        : null,
    arenaLeft: () => 300,
    viewWidth: () => 900,
    onPlayerDied: spies.onPlayerDied,
    onBossDefeated: spies.onBossDefeated,
    playOutroCinematic: spies.playOutroCinematic,
  };
  const unbind = wireSceneEvents(bus, hooks);
  const emit = <K extends keyof GameEventPayloads>(event: K, payload: GameEventPayloads[K]): void =>
    emitGameEvent(bus, event, payload);
  return { bus, unbind, emit, spies };
}

const slot = (partial: Partial<MagazineSlot> & Pick<MagazineSlot, 'flavor'>): MagazineSlot => ({
  charged: false,
  gold: false,
  ...partial,
});

beforeEach(() => {
  vi.clearAllMocks();
  resetSceneEventsSession();
});

describe('sceneEvents HP/技能路由（§11/§23）', () => {
  it('PLAYER_DAMAGED/HEALED 寫回 playerHp；BOSS_SPAWNED/DAMAGED 寫回 bossHp＋首擊窗', () => {
    const h = makeHarness();
    h.emit(GameEvents.PLAYER_DAMAGED, { hp: 3, maxHp: 5, damage: 2 });
    expect(h.spies.setPlayerHp).toHaveBeenCalledWith(3);
    h.emit(GameEvents.PLAYER_HEALED, { hp: 4, maxHp: 5 });
    expect(h.spies.setPlayerHp).toHaveBeenLastCalledWith(4);
    h.emit(GameEvents.BOSS_SPAWNED, { maxHp: 30 });
    expect(h.spies.setBossHp).toHaveBeenCalledWith(30);
    h.emit(GameEvents.BOSS_DAMAGED, { hp: 28, maxHp: 30, damage: 2 });
    expect(h.spies.setBossHp).toHaveBeenLastCalledWith(28);
    expect(h.spies.noteBossHit).toHaveBeenCalledTimes(1);
  });

  it('SKILL_* 路由至 starCombat；下衝擊同步破磚（半徑由 slamRadiusPx 供給）', () => {
    const h = makeHarness();
    h.emit(GameEvents.SKILL_STARSTORM, { x: 10, y: 20 });
    expect(h.spies.resolveStarstorm).toHaveBeenCalledTimes(1);
    h.emit(GameEvents.SKILL_SLAM_LANDED, { x: 100, y: 380 });
    expect(h.spies.resolveSlamImpact).toHaveBeenCalledWith(100, 380);
    expect(h.spies.damageBricksInRadius).toHaveBeenCalledWith(100, 380, 88);
    h.emit(GameEvents.SKILL_SHIELD_BLOCK, { x: 1, y: 2, facing: -1 });
    expect(h.spies.resolveShieldCounter).toHaveBeenCalledWith(1, 2, -1);
    h.emit(GameEvents.SKILL_TRANSFORM_STRIKE, {
      kind: 'volt-beam',
      form: 'volt',
      x: 5,
      y: 6,
      facing: 1,
    });
    expect(h.spies.resolveTransformStrike).toHaveBeenCalledWith('volt-beam', 5, 6, 1);
  });
});

describe('sceneEvents 星味首遇提示（§46/§47）', () => {
  it('頂槽新味首見 toast 一次；重複/金色頂槽靜默；配方走 MIX_HINTS', () => {
    const h = makeHarness();
    h.emit(GameEvents.AMMO_CHANGED, {
      ammo: 1,
      maxAmmo: 5,
      flavor: 'jelly',
      magazine: [slot({ flavor: 'jelly' })],
    });
    expect(h.spies.flavor).toHaveBeenCalledWith(FLAVOR_HINTS.jelly);
    h.emit(GameEvents.AMMO_CHANGED, {
      ammo: 2,
      maxAmmo: 5,
      flavor: 'jelly',
      magazine: [slot({ flavor: 'jelly' })],
    });
    expect(h.spies.flavor).toHaveBeenCalledTimes(1);
    h.emit(GameEvents.AMMO_CHANGED, {
      ammo: 3,
      maxAmmo: 5,
      flavor: 'floaty',
      magazine: [slot({ flavor: 'floaty', gold: true })],
    });
    expect(h.spies.flavor).toHaveBeenCalledTimes(1);
    h.emit(GameEvents.AMMO_CHANGED, {
      ammo: 4,
      maxAmmo: 5,
      flavor: 'jelly',
      magazine: [slot({ flavor: 'jelly', mix: 'swiftlight' })],
    });
    expect(h.spies.flavor).toHaveBeenLastCalledWith(MIX_HINTS.swiftlight);
    h.emit(GameEvents.AMMO_CHANGED, { ammo: 0, maxAmmo: 5, flavor: 'jelly', magazine: [] });
    expect(h.spies.flavor).toHaveBeenCalledTimes(2);
  });
});

describe('sceneEvents 魔王階段（§30/§69/§82）', () => {
  it('P3 時停 300ms；到達投放階段且非 EX 且有前室與配置才投放 arena 增益', () => {
    const h = makeHarness({ bossRoom: true, arenaBuff: 'shield' });
    h.emit(GameEvents.BOSS_PHASE, { phase: 'p2' });
    expect(h.spies.hitStop).not.toHaveBeenCalled();
    // 缺省投放階段 p2：arena 中央高位（arenaLeft + viewWidth/2, 190）。
    expect(h.spies.dropArenaBuff).toHaveBeenCalledWith('shield', 750, 190);
    h.emit(GameEvents.BOSS_PHASE, { phase: 'p3' });
    expect(h.spies.hitStop).toHaveBeenCalledWith(300);
    expect(h.spies.dropArenaBuff).toHaveBeenCalledTimes(1);
  });

  it('投放階段資料驅動（Voidra 生存段改 p3）；EX 不投放', () => {
    const p3drop = makeHarness({ bossRoom: true, arenaBuff: 'shield', arenaBuffPhase: 'p3' });
    p3drop.emit(GameEvents.BOSS_PHASE, { phase: 'p2' });
    expect(p3drop.spies.dropArenaBuff).not.toHaveBeenCalled();
    p3drop.emit(GameEvents.BOSS_PHASE, { phase: 'p3' });
    expect(p3drop.spies.dropArenaBuff).toHaveBeenCalledTimes(1);
    const ex = makeHarness({ bossRoom: true, arenaBuff: 'shield', exMode: true });
    ex.emit(GameEvents.BOSS_PHASE, { phase: 'p2' });
    expect(ex.spies.dropArenaBuff).not.toHaveBeenCalled();
  });

  it('BOSS_QUAKE 路由至 damageDirector 震落結算', () => {
    const h = makeHarness();
    h.emit(GameEvents.BOSS_QUAKE, { x: 0, y: 0 });
    expect(h.spies.resolveBossQuake).toHaveBeenCalledTimes(1);
  });
});

describe('sceneEvents 彩蛋/加速票/生死路由（§24/§120/§67）', () => {
  it('ENEMY_INHALED 具星味品種餵送吞噬歷史；無味品種靜默', () => {
    const h = makeHarness();
    h.emit(GameEvents.ENEMY_INHALED, { kind: 'jelly' });
    expect(h.spies.feed).toHaveBeenCalledWith({ kind: 'swallow', flavor: 'jelly' });
    h.spies.feed.mockClear();
    h.emit(GameEvents.ENEMY_INHALED, { kind: 'spiky' });
    expect(h.spies.feed).not.toHaveBeenCalled();
  });

  it('ENEMY_KILLED 票券蝠發疾風靴；其他品種不發', () => {
    const h = makeHarness();
    h.emit(GameEvents.ENEMY_KILLED, { kind: 'ticketa', x: 0, y: 0 });
    expect(h.spies.applyBuff).toHaveBeenCalledWith('swift');
    h.emit(GameEvents.ENEMY_KILLED, { kind: 'jelly', x: 0, y: 0 });
    expect(h.spies.applyBuff).toHaveBeenCalledTimes(1);
  });

  it('PLAYER_DIED/BOSS_DEFEATED/LEVEL_GATE_OPENED 回流 GameScene/levelGate', () => {
    const h = makeHarness();
    h.emit(GameEvents.PLAYER_DIED, { x: 12, y: 34 });
    expect(h.spies.onPlayerDied).toHaveBeenCalledWith(12, 34);
    h.emit(GameEvents.BOSS_DEFEATED, { x: 0, y: 0 });
    expect(h.spies.onBossDefeated).toHaveBeenCalledTimes(1);
    h.emit(GameEvents.LEVEL_GATE_OPENED, { levelId: 2 });
    expect(h.spies.gateSpawn).toHaveBeenCalledTimes(1);
    // 無收尾演出關：不觸發（§126）。
    expect(h.spies.playOutroCinematic).not.toHaveBeenCalled();
  });

  it('LEVEL_GATE_OPENED 收尾演出（§126）：outroCinematic 有值時觸發、門照常生成', () => {
    const h = makeHarness({ outroCinematic: 'market-open' });
    h.emit(GameEvents.LEVEL_GATE_OPENED, { levelId: 29 });
    expect(h.spies.gateSpawn).toHaveBeenCalledTimes(1);
    expect(h.spies.playOutroCinematic).toHaveBeenCalledTimes(1);
  });
});

describe('sceneEvents 解除綁定（shutdown 零殘留）', () => {
  it('unbind 後全部事件靜默且監聽器歸零', () => {
    const h = makeHarness();
    expect(h.bus.listenerCount()).toBeGreaterThan(0);
    h.unbind();
    expect(h.bus.listenerCount()).toBe(0);
    h.emit(GameEvents.PLAYER_DAMAGED, { hp: 1, maxHp: 5, damage: 1 });
    expect(h.spies.setPlayerHp).not.toHaveBeenCalled();
  });
});
