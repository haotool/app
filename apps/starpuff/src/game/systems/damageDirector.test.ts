import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { BUFF_SPECS } from '../logic/buffs';
import { TIDE } from '../logic/tide';
import { PLAYER } from '../core/config';
import { createDamageDirector, type DamageDirectorHooks } from './damageDirector';
import type { BossHandle } from './boss';
import type { BossRoomHandle } from './bossRoom';
import type { CaramelStatus } from './caramelStatus';
import type { FxSystem } from './fx';
import type { MeteorSystem } from './meteor';
import type { PlayerHandle } from './player';
import type { TideHandle } from './tide';
import type { ToastSystem } from './toasts';

// characterization（W2 前置債務車）：鎖住自 GameScene 抽出的受擊單一入口與
// 短期增益/環境場效結算現行為——護盾格擋管線、buff 拾取/到期同步、潮汐浸水
// 三聯結算（傷害/甦醒窗/速度）、隕星視窗參數、噴口升力與 P3 震落彈起。

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

const { playSfx } = await import('../audio/sfx');

interface HarnessConfig {
  hp?: number;
  tide?: { submerged: boolean } | null;
  meteor?: boolean;
  ventLift?: number | null | 'none';
  settled?: boolean;
  grounded?: boolean;
}

function makeHarness(config: HarnessConfig = {}): {
  director: ReturnType<typeof createDamageDirector>;
  spies: {
    takeDamage: ReturnType<typeof vi.fn>;
    grantInvulnerability: ReturnType<typeof vi.fn>;
    setVelocity: ReturnType<typeof vi.fn>;
    setVelocityY: ReturnType<typeof vi.fn>;
    spriteSetVelocityY: ReturnType<typeof vi.fn>;
    burstSmall: ReturnType<typeof vi.fn>;
    shake: ReturnType<typeof vi.fn>;
    caramelSync: ReturnType<typeof vi.fn>;
    caramelClear: ReturnType<typeof vi.fn>;
    flavor: ReturnType<typeof vi.fn>;
    updateBuffHud: ReturnType<typeof vi.fn>;
    tideUpdate: ReturnType<typeof vi.fn>;
    meteorUpdate: ReturnType<typeof vi.fn>;
  };
} {
  const takeDamage = vi.fn((damage: number) => {
    hp -= damage;
  });
  const grantInvulnerability = vi.fn();
  const setVelocity = vi.fn();
  const setVelocityY = vi.fn();
  const spriteSetVelocityY = vi.fn();
  const burstSmall = vi.fn();
  const shake = vi.fn();
  const caramelSync = vi.fn();
  const caramelClear = vi.fn();
  const flavor = vi.fn();
  const updateBuffHud = vi.fn();
  const tideUpdate = vi.fn();
  const meteorUpdate = vi.fn();
  let hp = config.hp ?? 5;
  const body = {
    bottom: 380,
    velocity: { x: 200, y: 120 },
    blocked: { up: false, down: config.grounded ?? false },
    touching: { down: false },
    setVelocity,
    setVelocityY,
  };
  const playerSprite = { x: 100, y: 300, body, setVelocityY: spriteSetVelocityY };
  const player = {
    sprite: playerSprite,
    takeDamage,
    grantInvulnerability,
  } as unknown as PlayerHandle;
  const tide =
    config.tide === null || config.tide === undefined
      ? null
      : ({
          update: tideUpdate,
          isSubmerged: () => config.tide?.submerged ?? false,
        } as unknown as TideHandle);
  const meteor = config.meteor ? ({ update: meteorUpdate } as unknown as MeteorSystem) : null;
  const boss = (config.ventLift === 'none' || config.ventLift === undefined
    ? {}
    : { getVentLift: vi.fn(() => config.ventLift) }) as unknown as BossHandle;
  const scene = {
    cameras: { main: { worldView: { x: 40, right: 894 } } },
  } as unknown as Phaser.Scene;
  const hooks: DamageDirectorHooks = {
    player: () => player,
    playerHp: () => hp,
    fx: () => ({ burstSmall, shake }) as unknown as FxSystem,
    caramel: () => ({ sync: caramelSync, clear: caramelClear }) as unknown as CaramelStatus,
    toasts: () => ({ flavor }) as unknown as ToastSystem,
    tide: () => tide,
    meteor: () => meteor,
    boss: () => boss,
    bossRoom: () => ({ updateBuffHud }) as unknown as BossRoomHandle,
    jumpHeld: () => false,
    gateX: () => 780,
    isSettled: () => config.settled ?? false,
  };
  const director = createDamageDirector(scene, hooks);
  return {
    director,
    spies: {
      takeDamage,
      grantInvulnerability,
      setVelocity,
      setVelocityY,
      spriteSetVelocityY,
      burstSmall,
      shake,
      caramelSync,
      caramelClear,
      flavor,
      updateBuffHud,
      tideUpdate,
      meteorUpdate,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('damageDirector 受擊單一入口（§69 護盾泡）', () => {
  it('無盾直通 player.takeDamage（傷害與來源 x 原樣轉發）', () => {
    const h = makeHarness();
    h.director.damagePlayer(2, 340);
    expect(h.spies.takeDamage).toHaveBeenCalledWith(2, 340);
  });

  it('持盾吸收一次：盾色星爆＋metal 音＋0 傷受擊管線取得擊退與 i-frame', () => {
    const h = makeHarness();
    h.director.applyBuff('shield');
    h.director.damagePlayer(3, 340);
    expect(h.spies.burstSmall).toHaveBeenCalledWith(100, 300, BUFF_SPECS.shield.tint);
    expect(playSfx).toHaveBeenCalledWith('metal');
    expect(h.spies.takeDamage).toHaveBeenCalledWith(0, 340);
    expect(h.director.buffState().id).toBeNull();
    // 破盾後第二擊照常結算。
    h.director.damagePlayer(3, 340);
    expect(h.spies.takeDamage).toHaveBeenLastCalledWith(3, 340);
  });
});

describe('damageDirector 短期增益（§69）', () => {
  it('拾取單點：nameZh 浮字、caramel.sync、拾取數累計、後拾覆蓋', () => {
    const h = makeHarness();
    h.director.applyBuff('swift');
    expect(h.spies.flavor).toHaveBeenCalledWith('疾風靴！短暫強化');
    expect(h.spies.caramelSync).toHaveBeenCalledTimes(1);
    h.director.applyBuff('power');
    expect(h.director.buffState()).toMatchObject({ id: 'power', pickups: 2 });
    expect(h.director.buff().remainingMs).toBe(BUFF_SPECS.power.durationMs);
  });

  it('advanceBuff 無增益：只同步前室 HUD 不 tick', () => {
    const h = makeHarness();
    h.director.advanceBuff(500);
    expect(h.spies.updateBuffHud).toHaveBeenCalledWith(h.director.buff());
    expect(h.director.buffState().id).toBeNull();
  });

  it('advanceBuff 到期：caramel.sync 重算移速、HUD 逐幀同步', () => {
    const h = makeHarness();
    h.director.applyBuff('swift');
    h.spies.caramelSync.mockClear();
    h.director.advanceBuff(BUFF_SPECS.swift.durationMs - 1);
    expect(h.spies.caramelSync).not.toHaveBeenCalled();
    h.director.advanceBuff(1);
    expect(h.spies.caramelSync).toHaveBeenCalledTimes(1);
    expect(h.director.buffState().id).toBeNull();
    expect(h.spies.updateBuffHud).toHaveBeenCalledTimes(2);
  });
});

describe('damageDirector 糖漿潮汐逐幀結算（§71/§107）', () => {
  it('無潮汐關 noop', () => {
    const h = makeHarness({ tide: null });
    h.director.advanceTide(16);
    expect(h.spies.takeDamage).not.toHaveBeenCalled();
  });

  it('未浸水：只推進水位不結算', () => {
    const h = makeHarness({ tide: { submerged: false } });
    h.director.advanceTide(16);
    expect(h.spies.tideUpdate).toHaveBeenCalledWith(16);
    expect(h.spies.takeDamage).not.toHaveBeenCalled();
  });

  it('浸水三聯結算：接觸傷→實際掉血追加甦醒窗→水平封頂/垂直鎖上推', () => {
    const h = makeHarness({ tide: { submerged: true }, hp: 5 });
    h.director.advanceTide(16);
    expect(h.spies.takeDamage).toHaveBeenCalledWith(TIDE.contactDamage, 100);
    expect(h.spies.grantInvulnerability).toHaveBeenCalledWith(
      PLAYER.invulnerableMs + TIDE.soakWakeInvulnMs,
    );
    expect(h.spies.setVelocity).toHaveBeenCalledWith(TIDE.soakSlowCapPxPerSec, TIDE.soakRiseSpeed);
  });

  it('浸水持盾格擋（未實際掉血）：甦醒窗回 0 杜絕無成本刷無敵', () => {
    const h = makeHarness({ tide: { submerged: true }, hp: 5 });
    h.director.applyBuff('shield');
    h.director.advanceTide(16);
    expect(h.spies.takeDamage).toHaveBeenCalledWith(0, 100);
    expect(h.spies.grantInvulnerability).toHaveBeenCalledWith(0);
  });
});

describe('damageDirector 流星雨/噴口/震落（§79/§74/§30）', () => {
  it('advanceMeteors：無配置 noop；有配置轉發相機視窗/玩家/門排除帶', () => {
    const none = makeHarness({ meteor: false });
    none.director.advanceMeteors(16);
    expect(none.spies.meteorUpdate).not.toHaveBeenCalled();
    const h = makeHarness({ meteor: true });
    h.director.advanceMeteors(16);
    expect(h.spies.meteorUpdate).toHaveBeenCalledWith(16, {
      viewLeft: 40,
      viewRight: 894,
      playerX: 100,
      gateX: 780,
    });
  });

  it('applyBossVents：品種未實作 noop；升力非 null 改寫縱速並吹乾焦糖化', () => {
    const none = makeHarness({ ventLift: 'none' });
    none.director.applyBossVents(16);
    expect(none.spies.setVelocityY).not.toHaveBeenCalled();
    const idle = makeHarness({ ventLift: null });
    idle.director.applyBossVents(16);
    expect(idle.spies.setVelocityY).not.toHaveBeenCalled();
    expect(idle.spies.caramelClear).not.toHaveBeenCalled();
    const h = makeHarness({ ventLift: -300 });
    h.director.applyBossVents(16);
    expect(h.spies.setVelocityY).toHaveBeenCalledWith(-300);
    expect(h.spies.caramelClear).toHaveBeenCalledTimes(1);
  });

  it('resolveBossQuake：轉場窗靜默；站地強制彈起 -360；空中僅震屏', () => {
    const settled = makeHarness({ settled: true, grounded: true });
    settled.director.resolveBossQuake();
    expect(settled.spies.shake).not.toHaveBeenCalled();
    const grounded = makeHarness({ grounded: true });
    grounded.director.resolveBossQuake();
    expect(grounded.spies.shake).toHaveBeenCalledWith(10);
    expect(grounded.spies.spriteSetVelocityY).toHaveBeenCalledWith(-360);
    const airborne = makeHarness({ grounded: false });
    airborne.director.resolveBossQuake();
    expect(airborne.spies.shake).toHaveBeenCalledWith(10);
    expect(airborne.spies.spriteSetVelocityY).not.toHaveBeenCalled();
  });
});
