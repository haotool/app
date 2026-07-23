import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CARAMEL } from '../logic/caramel';
import { createCaramelStatus, type CaramelStatusDeps } from './caramelStatus';
import type { FxSystem } from './fx';
import type { PlayerHandle } from './player';

// 焦糖化呈現層行為測試（#813 W2 審查補強）：apply/update/clear/sync 契約——
// 雷化免疫與瞬除、vent 反制清除、再沾波僅刷新計時（FX/浮字防轟炸）。

function makeHarness(): {
  status: ReturnType<typeof createCaramelStatus>;
  spies: {
    setBuffMoveMods: ReturnType<typeof vi.fn>;
    burstSmall: ReturnType<typeof vi.fn>;
    toast: ReturnType<typeof vi.fn>;
  };
  setForm: (form: string | null) => void;
  setBuffMods: (mods: readonly [number, number]) => void;
} {
  let form: string | null = null;
  let buffMods: readonly [number, number] = [1, 1];
  const setBuffMoveMods = vi.fn();
  const burstSmall = vi.fn();
  const toast = vi.fn();
  const player = {
    sprite: { x: 100, y: 300 },
    getTransformState: () => ({ form, remainingMs: 0 }),
    setBuffMoveMods,
  } as unknown as PlayerHandle;
  const deps: CaramelStatusDeps = {
    player: () => player,
    fx: () => ({ burstSmall }) as unknown as FxSystem,
    toast,
    buffMods: () => buffMods,
  };
  return {
    status: createCaramelStatus(deps),
    spies: { setBuffMoveMods, burstSmall, toast },
    setForm: (next) => {
      form = next;
    },
    setBuffMods: (mods) => {
      buffMods = mods;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('apply（沾身）', () => {
  it('套用減速倍率＋沾身爆點＋首次教學浮字', () => {
    const { status, spies } = makeHarness();
    status.apply();
    expect(spies.setBuffMoveMods).toHaveBeenCalledWith(CARAMEL.slowMul, 1);
    expect(spies.burstSmall).toHaveBeenCalledWith(100, 318, CARAMEL.tint);
    expect(spies.toast).toHaveBeenCalledTimes(1);
  });

  it('雷化免疫：volt 態沾波零副作用（不沾糖）', () => {
    const { status, spies, setForm } = makeHarness();
    setForm('volt');
    status.apply();
    expect(spies.setBuffMoveMods).not.toHaveBeenCalled();
    expect(spies.burstSmall).not.toHaveBeenCalled();
    expect(spies.toast).not.toHaveBeenCalled();
  });

  it('沾身中再沾波：僅刷新計時，不再爆點/浮字（防重疊波逐幀轟炸）', () => {
    const { status, spies } = makeHarness();
    status.apply();
    // 300ms < 粒子節拍 400ms：期間無 drip burst，計數只含沾身爆點。
    status.update(300);
    status.apply();
    expect(spies.burstSmall).toHaveBeenCalledTimes(1);
    expect(spies.toast).toHaveBeenCalledTimes(1);
    // 刷新驗證：自再沾波起算滿窗仍存活，過窗才解除。
    spies.setBuffMoveMods.mockClear();
    status.update(CARAMEL.durationMs - 50);
    expect(spies.setBuffMoveMods).not.toHaveBeenCalledWith(1, 1);
    status.update(100);
    expect(spies.setBuffMoveMods).toHaveBeenCalledWith(1, 1);
  });

  it('解除後再沾身：教學浮字不重播、爆點重播', () => {
    const { status, spies } = makeHarness();
    status.apply();
    status.clear();
    status.apply();
    expect(spies.toast).toHaveBeenCalledTimes(1);
    expect(spies.burstSmall).toHaveBeenCalledTimes(2);
  });
});

describe('update（計時與反制）', () => {
  it('未沾身：純 no-op', () => {
    const { status, spies } = makeHarness();
    status.update(1000);
    expect(spies.setBuffMoveMods).not.toHaveBeenCalled();
    expect(spies.burstSmall).not.toHaveBeenCalled();
  });

  it('計時期滿自然解除：倍率回 1', () => {
    const { status, spies } = makeHarness();
    status.apply();
    status.update(CARAMEL.durationMs);
    expect(spies.setBuffMoveMods).toHaveBeenLastCalledWith(1, 1);
  });

  it('雷化放電瞬除：沾身中變身 volt 當幀清除', () => {
    const { status, spies, setForm } = makeHarness();
    status.apply();
    setForm('volt');
    status.update(16);
    expect(spies.setBuffMoveMods).toHaveBeenLastCalledWith(1, 1);
    // 已清除：後續 update 不再結算。
    spies.setBuffMoveMods.mockClear();
    status.update(1000);
    expect(spies.setBuffMoveMods).not.toHaveBeenCalled();
  });

  it('腳部沾糖粒子低頻節拍：累積滿 400ms 才補一發', () => {
    const { status, spies } = makeHarness();
    status.apply();
    spies.burstSmall.mockClear();
    status.update(200);
    expect(spies.burstSmall).not.toHaveBeenCalled();
    status.update(200);
    expect(spies.burstSmall).toHaveBeenCalledTimes(1);
    expect(spies.burstSmall).toHaveBeenCalledWith(100, 320, CARAMEL.tint);
  });
});

describe('clear（vent 反制）與 sync（倍率合成）', () => {
  it('vent 清除路徑：沾身中 clear 即回 1；未沾身 clear 零副作用', () => {
    const { status, spies } = makeHarness();
    status.clear();
    expect(spies.setBuffMoveMods).not.toHaveBeenCalled();
    status.apply();
    status.clear();
    expect(spies.setBuffMoveMods).toHaveBeenLastCalledWith(1, 1);
  });

  it('sync：焦糖倍率與 buff 倍率單點疊乘注入', () => {
    const { status, spies, setBuffMods } = makeHarness();
    setBuffMods([1.3, 0.8]);
    status.apply();
    expect(spies.setBuffMoveMods).toHaveBeenLastCalledWith(1.3 * CARAMEL.slowMul, 0.8);
    status.clear();
    expect(spies.setBuffMoveMods).toHaveBeenLastCalledWith(1.3, 0.8);
  });
});
