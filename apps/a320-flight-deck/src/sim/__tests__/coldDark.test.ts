import { describe, expect, it } from 'vitest';
import { readControl } from '../controlDefs';
import { FIXED_DT, Simulation } from '../simulation';

function run(sim: Simulation, seconds: number): void {
  for (let i = 0; i < seconds * 60; i++) sim.step(FIXED_DT);
}

describe('cold & dark → engines running', () => {
  it('follows real system dependencies', () => {
    const sim = new Simulation('coldDark');
    const s = sim.state;
    expect(s.elec.acBus1).toBe(false);
    expect(readControl(s, 'elec.bat1').lower).toBeNull(); // 無電：燈號全暗
    // 引擎在無電/無氣源時無法啟動
    sim.command({ type: 'set', id: 'eng.mode', value: 2 });
    sim.command({ type: 'set', id: 'eng.master2', value: 1 });
    run(sim, 5);
    expect(s.engines[1].n2).toBeLessThan(1);
    sim.command({ type: 'set', id: 'eng.master2', value: 0 });
    sim.command({ type: 'set', id: 'eng.mode', value: 1 });

    sim.command({ type: 'press', id: 'elec.bat1' });
    sim.command({ type: 'press', id: 'elec.bat2' });
    run(sim, 1);
    expect(s.elec.dcBat).toBe(true);
    expect(s.elec.acBus1).toBe(false); // 只有電瓶：顯示器仍黑
    sim.command({ type: 'press', id: 'apu.master' });
    run(sim, 4);
    sim.command({ type: 'press', id: 'apu.start' });
    run(sim, 45);
    expect(s.apu.state).toBe('AVAILABLE');
    expect(s.elec.acBus1 && s.elec.acBus2).toBe(true);
    sim.command({ type: 'press', id: 'air.apubleed' });
    for (const ir of [1, 2, 3]) sim.command({ type: 'set', id: `adirs.ir${ir}`, value: 1 });
    run(sim, 3);
    expect(s.pneu.ductL).toBeGreaterThan(25);
    sim.command({ type: 'set', id: 'eng.mode', value: 2 });
    sim.command({ type: 'set', id: 'eng.master2', value: 1 });
    run(sim, 50);
    expect(s.engines[1].state).toBe('IDLE');
    expect(s.engines[1].egt).toBeGreaterThan(300);
    expect(s.elec.gen2Online).toBe(true);
    expect(s.hyd.yellow.pressure).toBeGreaterThan(2500);
    sim.command({ type: 'set', id: 'eng.master1', value: 1 });
    run(sim, 50);
    expect(s.engines[0].state).toBe('IDLE');
    expect(s.adirs.ir.every((ir) => ir.aligned)).toBe(true);
  });

  it('gear lever blocked on ground and flaps change lift config', () => {
    const sim = new Simulation('quick');
    sim.command({ type: 'press', id: 'gear.lever' });
    expect(sim.state.gear.lever).toBe('DOWN');
    sim.command({ type: 'set', id: 'flaps', value: 3 });
    run(sim, 20);
    expect(sim.state.controls.flapConfig).toBe('3');
    expect(sim.state.controls.flapsAngle).toBeCloseTo(20, 0);
  });
});
