import { describe, expect, it } from 'vitest';
import { Simulation, FIXED_DT } from '../simulation';

const log = (t: string): void => {
  if (process.env.SIM_TRACE) process.stdout.write(t + '\n');
};

describe('autopilot demo flight', () => {
  it('flies takeoff → cruise → ILS autoland → taxi purely through physics', () => {
    const sim = new Simulation('demo', 'CLEAR', 10.5);
    const s = sim.state;
    const events: string[] = [];
    sim.on((e) => {
      if (
        e.type === 'PHASE' ||
        e.type === 'LOC_CAPTURE' ||
        e.type === 'GS_CAPTURE' ||
        e.type === 'TOUCHDOWN' ||
        e.type === 'LIFTOFF' ||
        e.type === 'AP_ENGAGED' ||
        e.type === 'TOP_OF_DESCENT'
      ) {
        events.push(
          `${s.meta.time.toFixed(0)}s ${e.type}${'phase' in e ? ' ' + e.phase : ''}${'vs' in e ? ' vs=' + e.vs.toFixed(0) + ' x=' + s.aircraft.position.x.toFixed(0) : ''}`,
        );
      }
    });
    let nextLog = 0;
    const maxT = 2400;
    while (s.meta.time < maxT && s.meta.phase !== 'PARKED' && !s.meta.crashed) {
      sim.step(FIXED_DT);
      if (s.meta.time >= nextLog) {
        nextLog += 10;
        const f = s.flight;
        const a = s.afs;
        log(
          `t=${s.meta.time.toFixed(0)} ${s.meta.phase} ias=${f.ias.toFixed(0)} alt=${f.altitudeMsl.toFixed(0)} ra=${f.radioAltitude.toFixed(0)} vs=${f.vs.toFixed(0)} p=${f.pitch.toFixed(1)} r=${f.roll.toFixed(1)} hdg=${f.heading.toFixed(0)} aoa=${f.aoa.toFixed(1)} n1=${s.engines[0].n1.toFixed(0)} ` +
            `${a.athrMode ?? '-'}|${a.vertical ?? '-'}|${a.lateral ?? '-'} arm=${a.lateralArmed ?? ''}${a.verticalArmed.join(',')} tgt=${a.targetSpeed.toFixed(0)} fcuAlt=${s.fcu.alt} leg=${s.fplan.activeLeg} xtk=${s.fplan.xtk.toFixed(2)} d=${s.fplan.distToDest.toFixed(1)} tod=${s.fplan.todDist.toFixed(1)} flap=${s.controls.flapHandle} gear=${s.gear.lever} ths=${s.controls.ths.toFixed(1)} el=${s.controls.elevator.toFixed(1)} x=${s.aircraft.position.x.toFixed(0)} z=${s.aircraft.position.z.toFixed(0)} loc=${s.ils.locDev.toFixed(2)} gs=${s.ils.gsDev.toFixed(2)}`,
        );
      }
    }
    for (const e of events) log(e);
    expect(s.meta.crashed).toBe(false);
    expect(events.some((e) => e.includes('LIFTOFF'))).toBe(true);
    expect(events.some((e) => e.includes('GS_CAPTURE'))).toBe(true);
    expect(s.meta.lastTouchdown).not.toBeNull();
    expect(s.meta.lastTouchdown?.vs ?? 999).toBeLessThan(600);
    expect(Math.abs(s.aircraft.position.z)).toBeLessThan(400);
  });
});
