/**
 * FlightPhaseManager：由狀態推導飛行階段，供攝影機、音效、檢查單、環境讀取。
 */
import { TLA } from './constants';
import type { FlightPhase, SimEvent, SimState } from './types';

export class FlightPhaseManager {
  private landed = false;
  private touchdownTime = -99;

  reset(): void {
    this.landed = false;
    this.touchdownTime = -99;
  }

  onTouchdown(t: number): void {
    this.landed = true;
    this.touchdownTime = t;
  }

  update(s: SimState, emit: (e: SimEvent) => void): void {
    const f = s.flight;
    const e = s.engines;
    const t = s.meta.time;
    const ac = s.elec.acBus1 || s.elec.acBus2;
    const running = e[0].state !== 'OFF' || e[1].state !== 'OFF';
    const starting = e[0].state === 'STARTING' || e[1].state === 'STARTING';
    const tla = Math.max(e[0].tla, e[1].tla);
    let p: FlightPhase;
    if (f.onGround) {
      if (this.landed && t - this.touchdownTime < 2) p = 'TOUCHDOWN';
      else if (this.landed && f.gs > 35) p = 'ROLLOUT';
      else if (this.landed && f.gs < 1 && (s.gear.parkingBrake || !running)) p = 'PARKED';
      else if (this.landed) p = 'TAXI_IN';
      else if (starting) p = 'ENGINE_START';
      else if (!running) p = ac ? 'POWERED' : 'COLD_DARK';
      else if (tla >= TLA.FLX - 0.5 || (f.ias > 40 && tla > TLA.CL))
        p = f.pitch > 2.5 && f.ias > s.afs.vr - 10 ? 'ROTATION' : 'TAKEOFF_ROLL';
      else if (f.pitch > 2.5 && f.ias > 100) p = 'ROTATION';
      else p = 'TAXI';
    } else {
      this.landed = false;
      const ra = f.radioAltitude;
      const a = s.afs.phase;
      if (a === 'TAKEOFF' || (a === 'PREFLIGHT' && ra < 1500)) p = 'INITIAL_CLIMB';
      else if (ra < 50 && f.vs < 0 && s.gear.lever === 'DOWN') p = 'FLARE';
      else if (ra < 1000 && s.gear.lever === 'DOWN' && f.vs < 200) p = 'FINAL';
      else if (a === 'APPROACH' || a === 'GO AROUND') p = 'APPROACH';
      else if (a === 'DESCENT') p = 'DESCENT';
      else if (a === 'CRUISE') p = 'CRUISE';
      else p = ra < 1500 && f.vs > 0 ? 'INITIAL_CLIMB' : 'CLIMB';
    }
    if (p !== s.meta.phase) {
      s.meta.phase = p;
      s.meta.phaseSince = t;
      emit({ type: 'PHASE', phase: p });
    }
  }
}
