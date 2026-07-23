import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { SLAM, STARSTORM, STAR_FLAVORS, getMix } from '../core/config';
import { createBuffState, pickupBuff, BUFF_SPECS } from '../logic/buffs';
import { SHELL_SHIELD } from '../logic/skills';
import { GALE_FLIGHT, VOLT_BEAM, TRANSFORM_FORMS } from '../logic/transform';
import { createStarCombat, type StarCombatHooks } from './starCombat';
import type { BossHandle } from './boss';
import type { EnemySystem } from './enemies';
import type { FxSystem } from './fx';
import type { PlayerHandle } from './player';
import { playSfx } from '../audio/sfx';

// characterization（v17 債務列車）：鎖住自 GameScene 抽出的星彈規格解析與技能
// 世界結算現行為；幾何選敵數學由 combat/skills 單測覆蓋，此處鎖委派與結算路徑。

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

interface FakeStarData {
  flavor?: string;
  mix?: string | null;
  damage?: number;
}

function makeStar(data: FakeStarData): Phaser.Physics.Arcade.Sprite {
  return {
    getData: (key: string) => (data as Record<string, unknown>)[key],
  } as unknown as Phaser.Physics.Arcade.Sprite;
}

interface FakeEnemy {
  x: number;
  y: number;
  active: boolean;
  setVelocity: ReturnType<typeof vi.fn>;
}

function makeEnemy(x: number, y: number, active = true): FakeEnemy {
  return { x, y, active, setVelocity: vi.fn() };
}

function chainable(): Record<string, ReturnType<typeof vi.fn>> {
  const target: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const key of [
    'setDepth',
    'setScale',
    'setStrokeStyle',
    'lineStyle',
    'beginPath',
    'moveTo',
    'lineTo',
    'strokePath',
    'destroy',
  ]) {
    target[key] = vi.fn(() => target);
  }
  return target;
}

function makeHarness(overrides: {
  enemies?: FakeEnemy[];
  bossActive?: boolean;
  form?: 'volt' | 'shell' | 'gale' | null;
  playerAt?: { x: number; y: number };
}): {
  combat: ReturnType<typeof createStarCombat>;
  hooks: StarCombatHooks;
  damage: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  applySlow: ReturnType<typeof vi.fn>;
  freeze: ReturnType<typeof vi.fn>;
  damageBossAt: ReturnType<typeof vi.fn>;
  fx: {
    burstSmall: ReturnType<typeof vi.fn>;
    shake: ReturnType<typeof vi.fn>;
    starBurst: ReturnType<typeof vi.fn>;
  };
  flash: ReturnType<typeof vi.fn>;
  delayedCall: ReturnType<typeof vi.fn>;
  setBuff: (next: ReturnType<typeof createBuffState>) => void;
} {
  const enemies = overrides.enemies ?? [];
  const damage = vi.fn(() => 'hurt');
  const kill = vi.fn();
  const applySlow = vi.fn();
  const freeze = vi.fn();
  const damageBossAt = vi.fn();
  const fx = { burstSmall: vi.fn(), shake: vi.fn(), starBurst: vi.fn() };
  const flash = vi.fn();
  const delayedCall = vi.fn();
  let buff = createBuffState();
  const scene = {
    add: { graphics: () => chainable(), circle: () => chainable() },
    tweens: { add: vi.fn() },
    cameras: { main: { flash, worldView: { x: 0, y: 0, width: 854, height: 480 } } },
    time: { delayedCall },
  } as unknown as Phaser.Scene;
  const hooks: StarCombatHooks = {
    enemies: () =>
      ({
        getGroup: () => ({ getChildren: () => enemies }),
        damage,
        applySlow,
        kill,
        freeze,
      }) as unknown as EnemySystem,
    fx: () => fx as unknown as FxSystem,
    boss: () =>
      ({
        isActive: () => overrides.bossActive ?? false,
        getShields: undefined,
      }) as unknown as BossHandle,
    player: () =>
      ({
        sprite: overrides.playerAt ?? { x: 100, y: 300 },
        getTransformState: () => ({ form: overrides.form ?? null, remainingMs: 0 }),
      }) as unknown as PlayerHandle,
    buff: () => buff,
    bossBodies: () => [],
    damageBossAt,
  };
  return {
    combat: createStarCombat(scene, hooks),
    hooks,
    damage,
    kill,
    applySlow,
    freeze,
    damageBossAt,
    fx,
    flash,
    delayedCall,
    setBuff: (next) => {
      buff = next;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('星彈規格解析（§46 單一出口）', () => {
  it('無 data 回預設 jelly 屬性表', () => {
    const { combat } = makeHarness({});
    expect(combat.specOf(makeStar({}))).toBe(STAR_FLAVORS.jelly);
    expect(combat.mixOf(makeStar({}))).toBeNull();
  });

  it('flavor data 讀對應屬性表', () => {
    const { combat } = makeHarness({});
    expect(combat.specOf(makeStar({ flavor: 'puffy' }))).toBe(STAR_FLAVORS.puffy);
  });

  it('mix data 優先於 flavor（混合彈讀配方表）', () => {
    const { combat } = makeHarness({});
    const star = makeStar({ flavor: 'jelly', mix: 'thunderburst' });
    expect(combat.mixOf(star)).toBe(getMix('thunderburst'));
    expect(combat.specOf(star)).toBe(getMix('thunderburst'));
  });

  it('damageOf：data damage 優先、缺省讀 spec，星力果倍率疊乘', () => {
    const { combat, setBuff } = makeHarness({});
    expect(combat.damageOf(makeStar({ flavor: 'jelly', damage: 20 }))).toBe(20);
    expect(combat.damageOf(makeStar({ flavor: 'jelly' }))).toBe(STAR_FLAVORS.jelly.damage);
    setBuff(pickupBuff(createBuffState(), 'power'));
    expect(combat.damageOf(makeStar({ flavor: 'jelly', damage: 10 }))).toBe(
      10 * BUFF_SPECS.power.damageMul,
    );
  });

  it('playerFormSpec/slamRadiusPx：未變身走基礎半徑、殼化下砸範圍加倍', () => {
    const base = makeHarness({});
    expect(base.combat.playerFormSpec()).toBeNull();
    expect(base.combat.slamRadiusPx()).toBe(SLAM.radiusPx);
    const shell = makeHarness({ form: 'shell' });
    expect(shell.combat.playerFormSpec()).toBe(TRANSFORM_FORMS.shell);
    expect(shell.combat.slamRadiusPx()).toBe(SLAM.radiusPx * TRANSFORM_FORMS.shell.slamRadiusMul);
  });
});

describe('explodeStar 爆裂波及（§20/§53）', () => {
  it('半徑內結算 aoeDamage、主目標排除、半徑外不波及', () => {
    const inner = makeEnemy(120, 300);
    const outer = makeEnemy(500, 300);
    const excluded = makeEnemy(100, 300);
    const { combat, damage } = makeHarness({ enemies: [inner, outer, excluded] });
    const spec = STAR_FLAVORS.puffy;
    combat.explodeStar(100, 300, spec, excluded as unknown as Phaser.GameObjects.GameObject);
    expect(damage).toHaveBeenCalledTimes(1);
    expect(damage).toHaveBeenCalledWith(inner, spec.aoeDamage);
  });

  it('毒爆雲（slowMs>0）對 hurt 未死者加套緩速持續傷', () => {
    const target = makeEnemy(120, 300);
    const { combat, applySlow } = makeHarness({ enemies: [target] });
    const spore = getMix('sporeblast');
    combat.explodeStar(100, 300, spore, null);
    expect(applySlow).toHaveBeenCalledWith(target, spore.slowMs, spore.dotDamage);
  });
});

describe('chainLightning 雷鏈跳電（§40）', () => {
  it('半徑內依 chainCount 跳電、主目標排除、無候選零結算', () => {
    const a = makeEnemy(140, 300);
    const b = makeEnemy(180, 300);
    const c = makeEnemy(2000, 300);
    const excluded = makeEnemy(100, 300);
    const { combat, damage } = makeHarness({ enemies: [a, b, c, excluded] });
    const spec = STAR_FLAVORS.zappy;
    combat.chainLightning(100, 300, spec, excluded as unknown as Phaser.GameObjects.GameObject);
    expect(damage.mock.calls.map((call) => call[0])).toEqual([a, b]);
    expect(damage).toHaveBeenCalledWith(a, spec.chainDamage);
    expect(vi.mocked(playSfx)).toHaveBeenCalledWith('zap');
  });

  it('無候選時不放音效不結算', () => {
    const { combat, damage } = makeHarness({ enemies: [] });
    combat.chainLightning(100, 300, STAR_FLAVORS.zappy, null);
    expect(damage).not.toHaveBeenCalled();
    expect(vi.mocked(playSfx)).not.toHaveBeenCalled();
  });
});

describe('freezeField 凝光凍結場（§46）', () => {
  it('域內（半徑+20 放寬）小怪凍結、域外不受影響', () => {
    const mix = getMix('gleamfield');
    const inner = makeEnemy(100 + mix.freezeRadiusPx + 10, 300);
    const outer = makeEnemy(100 + mix.freezeRadiusPx + 60, 300);
    const { combat, freeze } = makeHarness({ enemies: [inner, outer] });
    combat.freezeField(100, 300, mix);
    expect(freeze).toHaveBeenCalledTimes(1);
    expect(freeze).toHaveBeenCalledWith(inner, mix.freezeMs);
  });
});

describe('resolveStarstorm 星暴（§23）', () => {
  it('白閃＋震屏＋清場全小怪；魔王未活動不結算魔王傷', () => {
    const a = makeEnemy(100, 300);
    const dead = makeEnemy(200, 300, false);
    const { combat, kill, flash, fx, damageBossAt, delayedCall } = makeHarness({
      enemies: [a, dead],
    });
    combat.resolveStarstorm();
    expect(flash).toHaveBeenCalled();
    expect(fx.shake).toHaveBeenCalledWith(12);
    expect(kill).toHaveBeenCalledTimes(1);
    expect(kill).toHaveBeenCalledWith(a);
    expect(delayedCall).toHaveBeenCalledTimes(6);
    expect(damageBossAt).not.toHaveBeenCalled();
  });

  it('魔王活動中：固定傷結算至玩家位置歸屬的存活本體（star 歸因）', () => {
    const { combat, damageBossAt } = makeHarness({ bossActive: true, playerAt: { x: 77, y: 88 } });
    combat.resolveStarstorm();
    // 星暴屬星彈來源（審查修復）：缺 source 會在滿盾＋虹吸窗下被護盾吸收為 0 傷。
    expect(damageBossAt).toHaveBeenCalledWith(STARSTORM.bossDamage, 77, 88, 'star');
  });
});

describe('resolveSlamImpact 下衝擊落地（§23/§57）', () => {
  it('半徑內傷害＋hurt 擊退；半徑外不結算', () => {
    const near = makeEnemy(130, 300);
    const far = makeEnemy(400, 300);
    const { combat, damage } = makeHarness({ enemies: [near, far] });
    combat.resolveSlamImpact(100, 300);
    expect(damage).toHaveBeenCalledTimes(1);
    expect(damage).toHaveBeenCalledWith(near, SLAM.damage);
    expect(near.setVelocity).toHaveBeenCalledTimes(1);
  });

  it('殼化形態下砸半徑加倍（§57）', () => {
    const midRange = makeEnemy(100 + SLAM.radiusPx + 20, 300);
    const { combat, damage } = makeHarness({ enemies: [midRange], form: 'shell' });
    combat.resolveSlamImpact(100, 300);
    expect(damage).toHaveBeenCalledWith(midRange, SLAM.damage);
  });
});

describe('resolveShieldCounter 殼盾反擊（§40）', () => {
  it('盾面前 30px 定點星爆、counterRadiusPx 內結算反擊傷', () => {
    const near = makeEnemy(130 + 50, 300);
    const behind = makeEnemy(-100, 300);
    const { combat, damage, fx } = makeHarness({ enemies: [near, behind] });
    combat.resolveShieldCounter(100, 300, 1);
    expect(fx.starBurst).toHaveBeenCalledWith(130, 300);
    expect(damage).toHaveBeenCalledTimes(1);
    expect(damage).toHaveBeenCalledWith(near, SHELL_SHIELD.counterDamage);
  });
});

describe('resolveVoltBeam 雷化鏈電束（§57/§68）', () => {
  it('面向側最近目標主傷（星力果倍率疊乘）、反向目標不取', () => {
    const front = makeEnemy(200, 300);
    const back = makeEnemy(50, 300);
    const { combat, damage, setBuff } = makeHarness({ enemies: [front, back] });
    setBuff(pickupBuff(createBuffState(), 'power'));
    combat.resolveVoltBeam(100, 300, 1);
    expect(damage.mock.calls[0]).toEqual([front, VOLT_BEAM.damage * BUFF_SPECS.power.damageMul]);
  });

  it('主目標後沿雷鏈波及最近候選（chainDamage）', () => {
    const first = makeEnemy(150, 300);
    const second = makeEnemy(190, 300);
    const { combat, damage } = makeHarness({ enemies: [first, second] });
    combat.resolveVoltBeam(100, 300, 1);
    expect(damage.mock.calls).toEqual([
      [first, VOLT_BEAM.damage],
      [second, VOLT_BEAM.chainDamage],
    ]);
  });

  it('無面向側候選時零結算', () => {
    const back = makeEnemy(50, 300);
    const { combat, damage } = makeHarness({ enemies: [back] });
    combat.resolveVoltBeam(100, 300, 1);
    expect(damage).not.toHaveBeenCalled();
  });

  it('魔王活動中本體入候選：無小怪時主傷走 damageBossAt（volt 歸因）', () => {
    const { combat, damageBossAt, hooks } = makeHarness({ bossActive: true });
    const body = {
      x: 200,
      y: 300,
      body: { enable: true },
    } as unknown as Phaser.Physics.Arcade.Sprite;
    vi.spyOn(hooks, 'bossBodies').mockReturnValue([body]);
    combat.resolveVoltBeam(100, 300, 1);
    expect(damageBossAt).toHaveBeenCalledWith(VOLT_BEAM.damage, 200, 300, 'volt');
  });
});

describe('resolveGaleLanding 風化落地衝擊（§57）', () => {
  it('landingRadiusPx 內傷害＋輕擊退（0.7 倍擊退速度）', () => {
    const near = makeEnemy(100 + GALE_FLIGHT.landingRadiusPx - 5, 300);
    const far = makeEnemy(100 + GALE_FLIGHT.landingRadiusPx + 50, 300);
    const { combat, damage } = makeHarness({ enemies: [near, far] });
    combat.resolveGaleLanding(100, 300);
    expect(damage).toHaveBeenCalledTimes(1);
    expect(damage).toHaveBeenCalledWith(near, GALE_FLIGHT.landingDamage);
    expect(near.setVelocity).toHaveBeenCalledTimes(1);
  });
});
