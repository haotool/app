/**
 * 液壓系統：GREEN（ENG1 泵）、BLUE（電動泵，需 AC 且任一發動機運轉）、YELLOW（ENG2 泵 / 電動泵），PTU 於 G/Y 壓差時互補。
 */
import type { HydSystem, SimState } from '../types';

function drive(sys: HydSystem, source: number, dt: number): void {
  const target = sys.quantity > 0.05 ? source : 0;
  sys.pressure += (target - sys.pressure) * Math.min(1, dt / (target > sys.pressure ? 0.8 : 3));
}

export function updateHydraulic(s: SimState, dt: number): void {
  const h = s.hyd;
  const e1 = s.engines[0].n2 > 50 && !s.engines[0].firePushed;
  const e2 = s.engines[1].n2 > 50 && !s.engines[1].firePushed;
  const ac = s.elec.acBus1 || s.elec.acBus2;
  if (s.failures.hydGreenLeak) h.green.quantity = Math.max(0, h.green.quantity - 0.02 * dt);

  let g = h.eng1Pump && e1 ? 3000 : 0;
  let y = (h.eng2Pump && e2) || (h.yellowElecPump && ac) ? 3000 : 0;
  const b = h.elecPump && ac && (e1 || e2 || !s.flight.onGround) ? 3000 : 0;
  // PTU：一側低壓且另一側正常
  h.ptuActive = false;
  if (h.ptu) {
    if (g < 1500 && y > 2500) {
      g = 2800;
      h.ptuActive = true;
    } else if (y < 1500 && g > 2500) {
      y = 2800;
      h.ptuActive = true;
    }
  }
  drive(h.green, g, dt);
  drive(h.blue, b, dt);
  drive(h.yellow, y, dt);
}
