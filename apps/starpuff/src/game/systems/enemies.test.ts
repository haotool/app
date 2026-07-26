import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { RESCUE_REACH_PX, RESCUE_REACH_Y_TOP } from '../logic/levels';
import { createEnemySystem } from './enemies';

// aliveInhalableCount 近域可及口徑（#812 審查 nit 補測）：鎖住 enemies.ts 的
// RESCUE_REACH_Y_TOP 頂線分支——高於可及頂線（y < 280）的存活可吸個體不計入近域
// 供給；全域口徑（無參數）不受任何近域過濾影響。fake group 僅承載 children 讀取。

vi.mock('phaser', () => ({
  default: {
    Physics: { Arcade: { Sprite: class {} } },
    TintModes: { FILL: 1, MULTIPLY: 0 },
  },
}));
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));
vi.mock('./fx', () => ({ popIn: vi.fn(), spawnTelegraph: vi.fn() }));
// visualScale 通道替身：本檔僅驗 aliveInhalableCount 純邏輯，不需要真實 scene 事件。
vi.mock('./visualScale', () => ({
  getVisualScale: () => ({
    register: vi.fn(),
    rebase: vi.fn(),
    setBase: vi.fn(),
    fx: () => ({ sx: 1, sy: 1 }),
    mod: () => ({ sx: 1, sy: 1 }),
    killFxTweens: vi.fn(),
    resetFx: vi.fn(),
    isFxTweening: () => false,
    unregister: vi.fn(),
  }),
}));

interface FakeFoe {
  active: boolean;
  x: number;
  y: number;
  getData(key: string): unknown;
}

function foe(kind: string, x: number, y: number, state = 'idle'): FakeFoe {
  const data: Record<string, unknown> = { kind, state, elite: false };
  return { active: true, x, y, getData: (key: string) => data[key] };
}

function makeSystem(children: FakeFoe[]): ReturnType<typeof createEnemySystem> {
  // createEnemySystem 依序建 enemies 與 hazards 兩個 group；children 只注入前者。
  const groups = [{ getChildren: () => children }, { getChildren: () => [] }];
  const scene = {
    textures: { exists: () => true },
    physics: { add: { group: () => groups.shift() ?? { getChildren: () => [] } } },
  } as unknown as Phaser.Scene;
  return createEnemySystem(scene);
}

describe('enemies.aliveInhalableCount 近域可及口徑（#812）', () => {
  it('RESCUE_REACH_Y_TOP 頂線：高空定飄（y<280）不計近域供給、頂線上（y≥280）計入', () => {
    const system = makeSystem([
      // 近域帶內地面可吸：計入。
      foe('jelly', 1100, 330),
      // 高空定飄（y=240 < 頂線 280）：近域不計（跳拍追擊不可及）、全域仍計。
      foe('jelly', 1000, 240),
      // 頂線邊界（y=280）：計入（僅嚴格高於頂線者排除）。
      foe('jelly', 1000, RESCUE_REACH_Y_TOP),
      // ranged 威脅型（zappy）：近域不計、全域仍計。
      foe('zappy', 1050, 330),
      // 水平超出可及半徑（>400px）：近域不計、全域仍計。
      foe('jelly', 1600, 330),
    ]);
    expect(system.aliveInhalableCount(1000, RESCUE_REACH_PX)).toBe(2);
    expect(system.aliveInhalableCount()).toBe(5);
  });
});

// 潮環撥開→回收→再命中完整循環（PR #886 Blocking）：hazard 被撥開後寫入
// tideDeflected=true 且不回收 body；物件出界回池後被 spawnHazard 復用，殘留
// 旗標會讓潮化對「新」hazard 靜默免疫（不推離也不結算）。池取出必經
// poolFlags 單點復位，本測鎖完整循環。
describe('hazards 池瞬時旗標循環（§119 潮環，PR #886）', () => {
  interface FakeHazard {
    active: boolean;
    x: number;
    y: number;
    width: number;
    displayWidth: number;
    height: number;
    body: Record<string, unknown>;
    setActive(value: boolean): FakeHazard;
    setData(key: string, value: unknown): FakeHazard;
    getData(key: string): unknown;
    [key: string]: unknown;
  }

  function makeFakeHazard(): FakeHazard {
    const data = new Map<string, unknown>();
    const hazard: FakeHazard = {
      active: false,
      x: 0,
      y: 0,
      width: 20,
      displayWidth: 20,
      height: 20,
      body: {
        enable: false,
        reset: vi.fn(),
        setAllowGravity: vi.fn(),
        setSize: vi.fn(),
        setCircle: vi.fn(),
        setVelocity: vi.fn(),
      },
      setActive(value: boolean) {
        hazard.active = value;
        return hazard;
      },
      setVisible: () => hazard,
      setAlpha: () => hazard,
      setRotation: () => hazard,
      setTexture: () => hazard,
      setDisplaySize: () => hazard,
      setTint: () => hazard,
      setData(key: string, value: unknown) {
        data.set(key, value);
        return hazard;
      },
      getData: (key: string) => data.get(key),
    };
    return hazard;
  }

  // 擊殺 puffy 走 burstSpikes → spawnHazard ×4：以公開 damage API 驅動 hazards 池。
  function makePuffy(x: number, y: number): FakeFoe & Record<string, unknown> {
    const data: Record<string, unknown> = {
      kind: 'puffy',
      state: 'idle',
      hp: 1,
      dmgCdMs: 0,
      elite: false,
    };
    const puffy = {
      active: true,
      x,
      y,
      getData: (key: string) => data[key],
      setData(key: string, value: unknown) {
        data[key] = value;
        return puffy;
      },
      setActive(value: boolean) {
        puffy.active = value;
        return puffy;
      },
      setVisible: () => puffy,
      body: { stop: vi.fn(), enable: true },
    };
    return puffy;
  }

  function makePooledSystem(): {
    system: ReturnType<typeof createEnemySystem>;
    hazardChildren: FakeHazard[];
  } {
    const hazardChildren: FakeHazard[] = [];
    const hazardGroup = {
      getChildren: () => hazardChildren,
      get(x: number, y: number) {
        const idle = hazardChildren.find((child) => !child.active);
        if (idle) {
          idle.x = x;
          idle.y = y;
          return idle;
        }
        const hazard = makeFakeHazard();
        hazard.x = x;
        hazard.y = y;
        hazardChildren.push(hazard);
        return hazard;
      },
    };
    const groups = [{ getChildren: () => [] }, hazardGroup];
    const scene = {
      textures: { exists: () => true },
      physics: { add: { group: () => groups.shift() ?? { getChildren: () => [] } } },
      tweens: { killTweensOf: vi.fn(), add: vi.fn() },
      events: { emit: vi.fn() },
    } as unknown as Phaser.Scene;
    return { system: createEnemySystem(scene), hazardChildren };
  }

  it('撥開旗標殘留的 hazard 回池復用後 tideDeflected 必為 false（reflected/burn 同步歸位）', () => {
    const { system, hazardChildren } = makePooledSystem();
    const first = makePuffy(100, 300) as unknown as Phaser.GameObjects.GameObject;
    expect(system.damage(first, 1)).toBe('killed');
    expect(hazardChildren).toHaveLength(4);
    // 潮環撥開現場（overlaps 語意）：寫入 tideDeflected 且不回收 body；
    // 之後 hazard 壽命到期回池。
    for (const hazard of hazardChildren) {
      hazard.setData('tideDeflected', true);
      hazard.setActive(false);
    }
    // 復用同一批物件：旗標必須歸位，否則潮化對「新」hazard 靜默免疫。
    const second = makePuffy(400, 320) as unknown as Phaser.GameObjects.GameObject;
    expect(system.damage(second, 1)).toBe('killed');
    expect(hazardChildren).toHaveLength(4);
    for (const hazard of hazardChildren) {
      expect(hazard.getData('tideDeflected')).toBe(false);
      expect(hazard.getData('reflected')).toBe(false);
      expect(hazard.getData('burn')).toBe(false);
    }
  });
});
