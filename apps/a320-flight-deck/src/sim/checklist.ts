/**
 * Cold & Dark 檢查單輔助：每步列出應操作的控制項（座艙以克制外框標示）與完成條件；使用者仍需親手操作。
 */
import { TLA } from './constants';
import type { SimState } from './types';

export interface ChecklistStep {
  key: string; // i18n assist.<key>
  ids: string[];
  done: (s: SimState) => boolean;
}

export const COLD_DARK_CHECKLIST: ChecklistStep[] = [
  { key: 'bat', ids: ['elec.bat1', 'elec.bat2'], done: (s) => s.elec.bat1 && s.elec.bat2 },
  { key: 'apuMaster', ids: ['apu.master'], done: (s) => s.apu.master },
  { key: 'apuStart', ids: ['apu.start'], done: (s) => s.apu.state === 'AVAILABLE' },
  {
    key: 'adirs',
    ids: ['adirs.ir1', 'adirs.ir2', 'adirs.ir3'],
    done: (s) => s.adirs.ir.every((ir) => ir.mode === 'NAV'),
  },
  {
    key: 'lights',
    ids: ['lt.beacon', 'lt.navlogo'],
    done: (s) => s.lights.beacon && s.lights.navLogo,
  },
  {
    key: 'fuel',
    ids: ['fuel.l1', 'fuel.l2', 'fuel.c1', 'fuel.c2', 'fuel.r1', 'fuel.r2'],
    done: (s) => Object.values(s.fuel.pumps).every(Boolean),
  },
  { key: 'apuBleed', ids: ['air.apubleed'], done: (s) => s.pneu.apuBleed },
  { key: 'mcdu', ids: ['mcdu1.INIT', 'mcdu1.R1'], done: (s) => s.fplan.initialized },
  { key: 'signs', ids: ['sign.seatbelts'], done: (s) => s.lights.seatBelts === 'ON' },
  {
    key: 'engMode',
    ids: ['eng.mode'],
    done: (s) =>
      s.mech.engMode === 'IGN/START' ||
      (s.engines[0].state === 'IDLE' && s.engines[1].state === 'IDLE'),
  },
  {
    key: 'eng2',
    ids: ['eng.master2'],
    done: (s) => s.engines[1].state === 'IDLE' || s.engines[1].state === 'RUNNING',
  },
  {
    key: 'eng1',
    ids: ['eng.master1'],
    done: (s) => s.engines[0].state === 'IDLE' || s.engines[0].state === 'RUNNING',
  },
  { key: 'engNorm', ids: ['eng.mode'], done: (s) => s.mech.engMode === 'NORM' },
  {
    key: 'apuOff',
    ids: ['air.apubleed', 'apu.master'],
    done: (s) => !s.pneu.apuBleed && !s.apu.master,
  },
  {
    key: 'flaps',
    ids: ['flaps', 'spdbrk', 'abrk.max'],
    done: (s) =>
      s.controls.flapHandle >= 1 && s.controls.spoilersArmed && s.gear.autobrake === 'MAX',
  },
  {
    key: 'toConfig',
    ids: ['ecp.TO CONF'],
    done: (s) =>
      s.warnings.toConfigTest > 0 || Math.max(s.engines[0].tla, s.engines[1].tla) > TLA.CL,
  },
  {
    key: 'extLights',
    ids: ['lt.strobe', 'lt.landL', 'lt.landR', 'lt.nose'],
    done: (s) =>
      s.lights.strobe === 'ON' &&
      s.lights.landL === 'ON' &&
      s.lights.landR === 'ON' &&
      s.lights.nose === 'TO',
  },
];
