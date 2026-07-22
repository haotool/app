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
