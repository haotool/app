import { describe, expect, it } from 'vitest';
import { buildMcduScreen } from '../autoflight/mcdu';
import { FIXED_DT, Simulation } from '../simulation';

function run(sim: Simulation, seconds: number): void {
  for (let i = 0; i < seconds * 60; i++) sim.step(FIXED_DT);
}

describe('doors', () => {
  it('open at the gate and close before pushback', () => {
    const sim = new Simulation('free');
    const d = sim.state.doors;
    expect(d.cabinFwdL).toBe(1);
    sim.command({ type: 'set', id: 'lt.beacon', value: 1 });
    run(sim, 6);
    expect(d.cabinFwdL).toBe(0);
    expect(d.cargoFwd).toBe(0);
  });

  it('raise an ECAM caution when moving with a door open', () => {
    const sim = new Simulation('quick');
    sim.state.doors.cargoAft = 1;
    sim.state.lights.beacon = false;
    sim.command({ type: 'set', id: 'thr.lever1', value: 45 });
    sim.command({ type: 'set', id: 'thr.lever2', value: 45 });
    run(sim, 0.2);
    expect(sim.state.warnings.messages.some((m) => m.id === 'DOOR_cargoAft')).toBe(true);
  });
});

describe('radio', () => {
  it('tunes VOR1 through the MCDU RADNAV page', () => {
    const sim = new Simulation('quick');
    for (const k of ['RADNAV', 'N', 'T', 'H', 'L1'])
      sim.command({ type: 'press', id: `mcdu1.${k}` });
    expect(sim.state.radio.vor1).toBe('NTH');
    const screen = buildMcduScreen(sim.state, 0);
    expect(screen.rows[2].some((seg) => seg.text.startsWith('NTH/116.40'))).toBe(true);
    for (const k of ['X', 'X', 'L1']) sim.command({ type: 'press', id: `mcdu1.${k}` });
    expect(sim.state.mcdu[0].message).toBe('NOT IN DATABASE');
  });
});

describe('reset', () => {
  it('rebuilds subsystem timers so ECAM pages do not leak between sessions', () => {
    const sim = new Simulation('quick');
    sim.user.pitch = 1;
    run(sim, 1);
    expect(sim.state.ecam.sdPage).toBe('F/CTL');
    sim.user.pitch = 0;
    sim.reset('free', 'CLEAR', 11);
    run(sim, 12);
    expect(sim.state.ecam.sdPage).toBe('DOOR');
  });
});
