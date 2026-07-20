import { describe, expect, it } from 'vitest';
import type Phaser from 'phaser';
import { GameEvents, emitGameEvent, offGameEvent, onGameEvent } from './events';
import { BOSS, createBossFsm } from '../logic/bossFsm';
import { getLevel } from '../logic/levels';
import { createWaveRunner } from '../systems/waves';
import type { EnemySystem } from '../systems/enemies';

// 事件契約測試（v17 債務列車）：GameEvents 為跨系統唯一溝通管道（GAME_DESIGN §11，凍結）。
// 本檔僅鎖住既有行為契約，不改 events.ts 本體；GameScene 端的勝敗轉場順序
// （GAME_WON/GAME_LOST → Result/Credits）需完整 Phaser Scene，由 e2e smoke 覆蓋。

// 最小事件匯流排：與 Phaser EventEmitter 同語意（同步派發、依註冊序呼叫）。
interface TestBus {
  emit(event: string, ...args: unknown[]): unknown;
  on(event: string, fn: (...args: never[]) => void): unknown;
  off(event: string, fn: (...args: never[]) => void): unknown;
  listenerCount(event: string): number;
}

const bus = (): TestBus => {
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
    listenerCount(event) {
      return (listeners.get(event) ?? []).length;
    },
  };
};

describe('GameEvents 事件名契約', () => {
  it('事件名全檔唯一（匯流排以字串路由，撞名即契約破壞）', () => {
    const names = Object.values(GameEvents);
    expect(new Set(names).size).toBe(names.length);
  });

  it('事件名維持 domain:action 命名（凍結格式）', () => {
    for (const name of Object.values(GameEvents)) {
      expect(name).toMatch(/^[a-z]+:[a-z-]+$/);
    }
  });
});

describe('emitGameEvent / onGameEvent / offGameEvent 對偶契約', () => {
  it('emit 後 handler 收到完整 payload（PLAYER_DAMAGED）', () => {
    const emitter = bus();
    const received: { hp: number; maxHp: number; damage: number }[] = [];
    onGameEvent(emitter, GameEvents.PLAYER_DAMAGED, (payload) => received.push(payload));
    emitGameEvent(emitter, GameEvents.PLAYER_DAMAGED, { hp: 3, maxHp: 5, damage: 2 });
    expect(received).toEqual([{ hp: 3, maxHp: 5, damage: 2 }]);
  });

  it('off 解除後不再收到事件', () => {
    const emitter = bus();
    let count = 0;
    const handler = (): void => {
      count += 1;
    };
    onGameEvent(emitter, GameEvents.GAME_WON, handler);
    emitGameEvent(emitter, GameEvents.GAME_WON, { timeMs: 1000 });
    offGameEvent(emitter, GameEvents.GAME_WON, handler);
    emitGameEvent(emitter, GameEvents.GAME_WON, { timeMs: 2000 });
    expect(count).toBe(1);
  });

  it('事件名互不串線（emit BOSS_PHASE 不觸發 BOSS_DAMAGED handler）', () => {
    const emitter = bus();
    let damaged = 0;
    let phased = 0;
    onGameEvent(emitter, GameEvents.BOSS_DAMAGED, () => {
      damaged += 1;
    });
    onGameEvent(emitter, GameEvents.BOSS_PHASE, () => {
      phased += 1;
    });
    emitGameEvent(emitter, GameEvents.BOSS_PHASE, { phase: 'p2' });
    expect(damaged).toBe(0);
    expect(phased).toBe(1);
  });

  it('同事件多監聽者皆收到（HUD 與 SFX 同源訂閱模式）', () => {
    const emitter = bus();
    const hits: string[] = [];
    onGameEvent(emitter, GameEvents.GAME_LOST, () => hits.push('a'));
    onGameEvent(emitter, GameEvents.GAME_LOST, () => hits.push('b'));
    emitGameEvent(emitter, GameEvents.GAME_LOST, { timeMs: 500 });
    expect(hits).toEqual(['a', 'b']);
  });
});

describe('魔王階段事件契約（FSM 事件源 → BOSS_PHASE）', () => {
  // boss 呈現層（systems/boss.ts applyDamage）將 FSM phase 事件一對一轉發為
  // BOSS_PHASE；此處以同構轉發迴圈鎖住「跨 p3 門檻必發恰一次 p3」的完整鏈。
  const forwardDamage = (
    emitter: TestBus,
    fsm: ReturnType<typeof createBossFsm>,
    amount: number,
  ): void => {
    for (const event of fsm.takeDamage(amount)) {
      if (event.kind === 'phase') {
        emitGameEvent(emitter, GameEvents.BOSS_PHASE, { phase: event.phase });
      }
    }
  };

  it('血量依序跌破 50%/25% 門檻時各發 BOSS_PHASE 恰一次', () => {
    const emitter = bus();
    const fsm = createBossFsm();
    const phases: string[] = [];
    onGameEvent(emitter, GameEvents.BOSS_PHASE, ({ phase }) => phases.push(phase));
    forwardDamage(emitter, fsm, Math.ceil(BOSS.maxHp * 0.5));
    expect(phases).toEqual(['p2']);
    forwardDamage(emitter, fsm, Math.ceil(BOSS.maxHp * 0.25));
    expect(phases).toEqual(['p2', 'p3']);
    // p3 內續傷不再重發 phase 事件。
    forwardDamage(emitter, fsm, 1);
    expect(phases).toEqual(['p2', 'p3']);
  });

  it('單擊跨雙門檻只發最終 phase 恰一次（現行為鎖定：不逐檻補發）', () => {
    const emitter = bus();
    const fsm = createBossFsm();
    const phases: string[] = [];
    onGameEvent(emitter, GameEvents.BOSS_PHASE, ({ phase }) => phases.push(phase));
    forwardDamage(emitter, fsm, BOSS.maxHp - 1);
    expect(phases).toEqual(['p3']);
  });

  it('takeDamage 進 p3 後 FSM phase 唯讀狀態一致', () => {
    const fsm = createBossFsm();
    fsm.takeDamage(BOSS.maxHp - 1);
    expect(fsm.phase).toBe('p3');
    expect(fsm.defeated).toBe(false);
  });
});

describe('waves 關卡事件序列契約（最小 scene harness）', () => {
  // L2（非教學、無 hint、非 boss）之 start/forceQuota/destroy 僅觸 scene.events，
  // 其餘 Phaser 面不進入；enemies 於此路徑零呼叫。
  const LEVEL_ID = 2;
  const harness = (): { scene: Phaser.Scene; emitter: TestBus } => {
    const emitter = bus();
    return { scene: { events: emitter } as unknown as Phaser.Scene, emitter };
  };
  const enemiesStub = {} as EnemySystem;

  it('start() 發 LEVEL_CHANGED 恰一次且 payload 對齊關卡資料', () => {
    const { scene, emitter } = harness();
    const level = getLevel(LEVEL_ID);
    const changed: { levelId: number; nameZh: string; killQuota: number }[] = [];
    onGameEvent(emitter, GameEvents.LEVEL_CHANGED, (payload) => changed.push(payload));
    const runner = createWaveRunner(scene, enemiesStub, LEVEL_ID);
    runner.start();
    expect(changed).toEqual([
      { levelId: level.id, nameZh: level.nameZh, killQuota: level.killQuota },
    ]);
    runner.destroy();
  });

  it('配額補滿：LEVEL_QUOTA 逐殺遞增、LEVEL_GATE_OPENED 於達標瞬間恰發一次', () => {
    const { scene, emitter } = harness();
    const level = getLevel(LEVEL_ID);
    const quotas: number[] = [];
    const gates: number[] = [];
    onGameEvent(emitter, GameEvents.LEVEL_QUOTA, ({ killCount }) => quotas.push(killCount));
    onGameEvent(emitter, GameEvents.LEVEL_GATE_OPENED, ({ levelId }) => gates.push(levelId));
    const runner = createWaveRunner(scene, enemiesStub, LEVEL_ID);
    runner.start();
    runner.forceQuota();
    expect(quotas).toEqual(Array.from({ length: level.killQuota }, (_, i) => i + 1));
    expect(gates).toEqual([level.id]);
    expect(runner.isGateOpen()).toBe(true);
    // 開門後再殺（ENEMY_KILLED）不重發 GATE_OPENED、不再推進配額。
    emitGameEvent(emitter, GameEvents.ENEMY_KILLED, { kind: 'jelly', x: 0, y: 0 });
    expect(gates).toEqual([level.id]);
    expect(quotas.length).toBe(level.killQuota);
    runner.destroy();
  });

  it('擊殺與吞下皆計入配額（ENEMY_KILLED 與 ENEMY_INHALED 同權）', () => {
    const { scene, emitter } = harness();
    const quotas: number[] = [];
    onGameEvent(emitter, GameEvents.LEVEL_QUOTA, ({ killCount }) => quotas.push(killCount));
    const runner = createWaveRunner(scene, enemiesStub, LEVEL_ID);
    runner.start();
    emitGameEvent(emitter, GameEvents.ENEMY_KILLED, { kind: 'jelly', x: 0, y: 0 });
    emitGameEvent(emitter, GameEvents.ENEMY_INHALED, { kind: 'floaty' });
    expect(quotas).toEqual([1, 2]);
    runner.destroy();
  });

  it('BOSS_DEFEATED 後停止推進（勝利演出期不再計配額）', () => {
    const { scene, emitter } = harness();
    const quotas: number[] = [];
    onGameEvent(emitter, GameEvents.LEVEL_QUOTA, ({ killCount }) => quotas.push(killCount));
    const runner = createWaveRunner(scene, enemiesStub, LEVEL_ID);
    runner.start();
    emitGameEvent(emitter, GameEvents.BOSS_DEFEATED, { x: 0, y: 0 });
    emitGameEvent(emitter, GameEvents.ENEMY_KILLED, { kind: 'jelly', x: 0, y: 0 });
    expect(quotas).toEqual([]);
    runner.destroy();
  });

  it('destroy() 解除所有訂閱（跨局監聽不累積）', () => {
    const { scene, emitter } = harness();
    const runner = createWaveRunner(scene, enemiesStub, LEVEL_ID);
    runner.start();
    const before = emitter.listenerCount(GameEvents.ENEMY_KILLED);
    runner.destroy();
    expect(before).toBe(1);
    expect(emitter.listenerCount(GameEvents.ENEMY_KILLED)).toBe(0);
    expect(emitter.listenerCount(GameEvents.BOSS_DEFEATED)).toBe(0);
    expect(emitter.listenerCount(GameEvents.ENEMY_INHALED)).toBe(0);
    expect(emitter.listenerCount(GameEvents.AMMO_CHANGED)).toBe(0);
  });

  it('教學關配額結轉（initialKills）於 start 即補發現值 LEVEL_QUOTA', () => {
    const { scene, emitter } = harness();
    const quotas: number[] = [];
    onGameEvent(emitter, GameEvents.LEVEL_QUOTA, ({ killCount }) => quotas.push(killCount));
    const runner = createWaveRunner(scene, enemiesStub, LEVEL_ID, {}, 3);
    runner.start();
    expect(quotas).toEqual([3]);
    runner.destroy();
  });
});
