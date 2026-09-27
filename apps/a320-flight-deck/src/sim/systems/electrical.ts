/**
 * 電力系統：BAT 1/2、GEN 1/2、APU GEN、EXT PWR、BUS TIE → AC BUS 1/2、AC ESS、DC 匯流排。
 * 只有電瓶時地面僅 DC BAT / HOT BUS 有電（顯示器黑屏），接上外電/APU/發動機發電機後 AC 匯流排才有電。
 */
import type { AcSource, SimState } from '../types';

export function updateElectrical(s: SimState, dt: number): void {
  const e = s.elec;
  // 外電：飛機移動即斷開（地勤拔除）
  if (s.flight.gs > 3 || !s.flight.onGround) {
    e.extPwrAvail = false;
    e.extPwrOn = false;
  }
  if (!e.extPwrAvail) e.extPwrOn = false;

  e.gen1Online = e.gen1 && !s.failures.gen1Fail && s.engines[0].n2 > 57 && !s.engines[0].firePushed;
  e.gen2Online = e.gen2 && s.engines[1].n2 > 57 && !s.engines[1].firePushed;
  e.apuGenOnline = e.apuGen && s.apu.state === 'AVAILABLE' && s.apu.n > 95;
  const ext = e.extPwrOn;

  const pick = (own: boolean, ownName: AcSource, other: boolean, otherName: AcSource): AcSource => {
    if (own) return ownName;
    if (ext && e.busTie) return 'EXT';
    if (e.apuGenOnline && e.busTie) return 'APU';
    if (other && e.busTie) return otherName;
    return null;
  };
  e.ac1Source = pick(e.gen1Online, 'GEN1', e.gen2Online, 'GEN2');
  e.ac2Source = pick(e.gen2Online, 'GEN2', e.gen1Online, 'GEN1');
  // 外電/APU 優先於跨側發電機（當本側發電機不可用時）
  if (!e.gen1Online && ext) e.ac1Source = 'EXT';
  if (!e.gen2Online && ext) e.ac2Source = 'EXT';
  e.acBus1 = e.ac1Source !== null;
  e.acBus2 = e.ac2Source !== null;
  e.acEss = e.acBus1 || e.acBus2;
  e.dcBus1 = e.acBus1;
  e.dcBus2 = e.acBus2;
  const batAvail = (e.bat1 && e.bat1Charge > 0.02) || (e.bat2 && e.bat2Charge > 0.02);
  e.dcBat = e.dcBus1 || e.dcBus2 || batAvail;
  // 空中喪失所有 AC：電瓶供 DC ESS（緊急）
  e.dcEss = e.dcBus1 || e.dcBus2 || (batAvail && !s.flight.onGround);
  e.hotBus = e.bat1Charge > 0.02 || e.bat2Charge > 0.02;

  // 電瓶充放電
  const charging = e.dcBus1 || e.dcBus2;
  for (const k of [1, 2] as const) {
    const on = k === 1 ? e.bat1 : e.bat2;
    let ch = k === 1 ? e.bat1Charge : e.bat2Charge;
    if (on && charging) ch = Math.min(1, ch + 0.002 * dt);
    else if (on && !charging) ch = Math.max(0, ch - 0.00025 * dt);
    const v = !on ? 25.2 + ch * 0.6 : charging ? 27.8 + (1 - ch) * 0.4 : 23.4 + ch * 2.1;
    if (k === 1) {
      e.bat1Charge = ch;
      e.bat1V += (v - e.bat1V) * Math.min(1, dt);
    } else {
      e.bat2Charge = ch;
      e.bat2V += (v - e.bat2V) * Math.min(1, dt);
    }
  }
  // 負載（ECAM 顯示用）：依用電設備
  const base =
    18 +
    (s.pneu.pack1 ? 4 : 0) +
    (s.pneu.pack2 ? 4 : 0) +
    (s.hyd.elecPump && s.hyd.blue.pressure > 1000 ? 8 : 0) +
    (s.antiIce.probe ? 3 : 0);
  const sources = [e.ac1Source, e.ac2Source];
  const count = (src: AcSource): number => sources.filter((x) => x === src).length;
  e.loads.load1 = e.gen1Online ? count('GEN1') * base : 0;
  e.loads.load2 = e.gen2Online ? count('GEN2') * base : 0;
  e.loads.apuLoad = e.apuGenOnline ? count('APU') * base : 0;
}

/** 任一 DC 可用（按鈕燈號、FCU 等） */
export function dcAvailable(s: SimState): boolean {
  return s.elec.dcBat || s.elec.dcEss;
}
