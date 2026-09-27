/**
 * 座艙控制項註冊表（SSOT）：3D 座艙依此建立可互動元件，模擬依 Command 改變系統狀態，
 * 燈號/位置一律由 readControl(state, id) 從 SimState 推導，元件本身不保存狀態。
 */
import type { SimState } from './types';

export type ControlKind =
  | 'pb' // 自鎖按鈕（含上下燈號）
  | 'momentary' // 瞬時按鈕
  | 'switch' // 撥桿（positions）
  | 'selector' // 旋轉選擇器（positions）
  | 'knob' // 無限旋鈕，可 push/pull（FCU、BARO）
  | 'pot' // 亮度電位器 0..1
  | 'lever' // 桿（油門、襟翼、減速板、起落架、停機剎車）
  | 'guard' // 保護蓋
  | 'key'; // MCDU 按鍵

export type PanelId =
  | 'OVHD_ADIRS'
  | 'OVHD_ELEC'
  | 'OVHD_FUEL'
  | 'OVHD_HYD'
  | 'OVHD_APU'
  | 'OVHD_AIR'
  | 'OVHD_ANTIICE'
  | 'OVHD_PRESS'
  | 'OVHD_FIRE'
  | 'OVHD_EXTLT'
  | 'OVHD_INTLT'
  | 'OVHD_SIGNS'
  | 'GLARE_FCU'
  | 'GLARE_EFIS1'
  | 'GLARE_EFIS2'
  | 'GLARE_WARN1'
  | 'GLARE_WARN2'
  | 'MAIN_CAPT'
  | 'MAIN_CENTER'
  | 'MAIN_FO'
  | 'PED_MCDU1'
  | 'PED_MCDU2'
  | 'PED_ECP'
  | 'PED_ENG'
  | 'PED_THR'
  | 'PED_FLAPS'
  | 'PED_SPDBRK'
  | 'PED_PBRK'
  | 'PED_RUDTRIM'
  | 'SIDESTICK';

export interface ControlDef {
  id: string;
  kind: ControlKind;
  panel: PanelId;
  /** 面板印字（英文，真實 Airbus 標示） */
  label: string;
  /** switch/selector/lever 的位置名稱（索引即 value） */
  positions?: string[];
  /** pb 上半/下半印字（未亮時為暗色印字，亮時依 readControl 顏色） */
  upper?: string;
  lower?: string;
  /** 受 guard 保護的按鈕 id（guard 自身 def 指向被保護對象） */
  guards?: string;
  /** 對應系統（除錯與 ECAM 關聯） */
  system: string;
}

export type LegendColor = 'amber' | 'white' | 'blue' | 'green' | 'red' | 'cyan';

export interface Legend {
  text: string;
  color: LegendColor;
}

export interface ControlView {
  value: number; // 位置索引、連續值或開關（0/1）
  upper: Legend | null;
  lower: Legend | null;
  /** FCU/EFIS 按鈕中央綠色 LED 條 */
  led: boolean;
  enabled: boolean;
  guardOpen?: boolean;
}

export type Command =
  | { type: 'press'; id: string } // pb/momentary/key：切換或觸發
  | { type: 'set'; id: string; value: number } // switch/selector/lever/pot：設定位置或連續值
  | { type: 'rotate'; id: string; delta: number } // knob/selector：以卡位步數旋轉
  | { type: 'push'; id: string } // knob push（managed / STD）
  | { type: 'pull'; id: string } // knob pull（selected / QNH）
  | { type: 'guard'; id: string; open: boolean }
  | { type: 'release'; id: string }; // 彈簧回位（例如 MAN V/S）

const defs: ControlDef[] = [];
const add = (d: ControlDef): void => {
  defs.push(d);
};
const pb = (
  id: string,
  panel: PanelId,
  label: string,
  upper: string,
  lower: string,
  system: string,
): void => add({ id, kind: 'pb', panel, label, upper, lower, system });

// ---- ADIRS ----
for (const n of [1, 2, 3]) {
  add({
    id: `adirs.ir${n}`,
    kind: 'selector',
    panel: 'OVHD_ADIRS',
    label: `IR ${n}`,
    positions: ['OFF', 'NAV', 'ATT'],
    system: 'ADIRS',
  });
}
// ---- ELEC ----
pb('elec.bat1', 'OVHD_ELEC', 'BAT 1', 'FAULT', 'OFF', 'ELEC');
pb('elec.bat2', 'OVHD_ELEC', 'BAT 2', 'FAULT', 'OFF', 'ELEC');
pb('elec.extpwr', 'OVHD_ELEC', 'EXT PWR', 'AVAIL', 'ON', 'ELEC');
pb('elec.gen1', 'OVHD_ELEC', 'GEN 1', 'FAULT', 'OFF', 'ELEC');
pb('elec.gen2', 'OVHD_ELEC', 'GEN 2', 'FAULT', 'OFF', 'ELEC');
pb('elec.apugen', 'OVHD_ELEC', 'APU GEN', 'FAULT', 'OFF', 'ELEC');
pb('elec.bustie', 'OVHD_ELEC', 'BUS TIE', '', 'OFF', 'ELEC');
// ---- FUEL ----
for (const [id, label] of [
  ['l1', 'L TK PUMPS 1'],
  ['l2', 'L TK PUMPS 2'],
  ['c1', 'CTR TK PUMP 1'],
  ['c2', 'CTR TK PUMP 2'],
  ['r1', 'R TK PUMPS 1'],
  ['r2', 'R TK PUMPS 2'],
] as const) {
  pb(`fuel.${id}`, 'OVHD_FUEL', label, 'FAULT', 'OFF', 'FUEL');
}
pb('fuel.xfeed', 'OVHD_FUEL', 'X FEED', 'OPEN', 'ON', 'FUEL');
// ---- HYD ----
pb('hyd.eng1pump', 'OVHD_HYD', 'ENG 1 PUMP', 'FAULT', 'OFF', 'HYD');
pb('hyd.elecpump', 'OVHD_HYD', 'BLUE ELEC PUMP', 'FAULT', 'OFF', 'HYD');
pb('hyd.ptu', 'OVHD_HYD', 'PTU', 'FAULT', 'OFF', 'HYD');
pb('hyd.yelecpump', 'OVHD_HYD', 'YELLOW ELEC PUMP', 'FAULT', 'ON', 'HYD');
pb('hyd.eng2pump', 'OVHD_HYD', 'ENG 2 PUMP', 'FAULT', 'OFF', 'HYD');
// ---- APU ----
pb('apu.master', 'OVHD_APU', 'APU MASTER SW', 'FAULT', 'ON', 'APU');
pb('apu.start', 'OVHD_APU', 'APU START', '', 'ON', 'APU');
// ---- AIR / BLEED ----
pb('air.pack1', 'OVHD_AIR', 'PACK 1', 'FAULT', 'OFF', 'BLEED');
pb('air.pack2', 'OVHD_AIR', 'PACK 2', 'FAULT', 'OFF', 'BLEED');
pb('air.eng1bleed', 'OVHD_AIR', 'ENG 1 BLEED', 'FAULT', 'OFF', 'BLEED');
pb('air.eng2bleed', 'OVHD_AIR', 'ENG 2 BLEED', 'FAULT', 'OFF', 'BLEED');
pb('air.apubleed', 'OVHD_AIR', 'APU BLEED', 'FAULT', 'ON', 'BLEED');
add({
  id: 'air.xbleed',
  kind: 'selector',
  panel: 'OVHD_AIR',
  label: 'X BLEED',
  positions: ['SHUT', 'AUTO', 'OPEN'],
  system: 'BLEED',
});
add({
  id: 'air.packflow',
  kind: 'selector',
  panel: 'OVHD_AIR',
  label: 'PACK FLOW',
  positions: ['LO', 'NORM', 'HI'],
  system: 'BLEED',
});
// ---- ANTI ICE ----
pb('ai.wing', 'OVHD_ANTIICE', 'WING', 'FAULT', 'ON', 'ANTI ICE');
pb('ai.eng1', 'OVHD_ANTIICE', 'ENG 1', 'FAULT', 'ON', 'ANTI ICE');
pb('ai.eng2', 'OVHD_ANTIICE', 'ENG 2', 'FAULT', 'ON', 'ANTI ICE');
pb('ai.probe', 'OVHD_ANTIICE', 'PROBE/WINDOW HEAT', '', 'ON', 'ANTI ICE');
// ---- PRESS ----
pb('press.modesel', 'OVHD_PRESS', 'MODE SEL', 'FAULT', 'MAN', 'PRESS');
add({
  id: 'press.manvs',
  kind: 'switch',
  panel: 'OVHD_PRESS',
  label: 'MAN V/S CTL',
  positions: ['UP', 'NEUTRAL', 'DN'],
  system: 'PRESS',
});
pb('press.ditching', 'OVHD_PRESS', 'DITCHING', '', 'ON', 'PRESS');
// ---- FIRE（受保護） ----
for (const [id, label] of [
  ['fire.eng1', 'ENG 1 FIRE'],
  ['fire.apu', 'APU FIRE'],
  ['fire.eng2', 'ENG 2 FIRE'],
] as const) {
  add({ id: `${id}.guard`, kind: 'guard', panel: 'OVHD_FIRE', label, guards: id, system: 'FIRE' });
  add({ id, kind: 'pb', panel: 'OVHD_FIRE', label, upper: 'FIRE', lower: 'PUSH', system: 'FIRE' });
}
add({ id: 'fire.test', kind: 'momentary', panel: 'OVHD_FIRE', label: 'TEST', system: 'FIRE' });
// ---- EXT LT ----
add({
  id: 'lt.strobe',
  kind: 'switch',
  panel: 'OVHD_EXTLT',
  label: 'STROBE',
  positions: ['OFF', 'AUTO', 'ON'],
  system: 'LIGHTS',
});
add({
  id: 'lt.beacon',
  kind: 'switch',
  panel: 'OVHD_EXTLT',
  label: 'BEACON',
  positions: ['OFF', 'ON'],
  system: 'LIGHTS',
});
add({
  id: 'lt.wing',
  kind: 'switch',
  panel: 'OVHD_EXTLT',
  label: 'WING',
  positions: ['OFF', 'ON'],
  system: 'LIGHTS',
});
add({
  id: 'lt.navlogo',
  kind: 'switch',
  panel: 'OVHD_EXTLT',
  label: 'NAV & LOGO',
  positions: ['OFF', 'ON'],
  system: 'LIGHTS',
});
add({
  id: 'lt.rwyturnoff',
  kind: 'switch',
  panel: 'OVHD_EXTLT',
  label: 'RWY TURN OFF',
  positions: ['OFF', 'ON'],
  system: 'LIGHTS',
});
add({
  id: 'lt.landL',
  kind: 'switch',
  panel: 'OVHD_EXTLT',
  label: 'LAND L',
  positions: ['RETRACT', 'OFF', 'ON'],
  system: 'LIGHTS',
});
add({
  id: 'lt.landR',
  kind: 'switch',
  panel: 'OVHD_EXTLT',
  label: 'LAND R',
  positions: ['RETRACT', 'OFF', 'ON'],
  system: 'LIGHTS',
});
add({
  id: 'lt.nose',
  kind: 'switch',
  panel: 'OVHD_EXTLT',
  label: 'NOSE',
  positions: ['OFF', 'TAXI', 'T.O'],
  system: 'LIGHTS',
});
// ---- INT LT / SIGNS ----
add({
  id: 'lt.dome',
  kind: 'switch',
  panel: 'OVHD_INTLT',
  label: 'DOME',
  positions: ['OFF', 'DIM', 'BRT'],
  system: 'LIGHTS',
});
add({
  id: 'lt.annun',
  kind: 'switch',
  panel: 'OVHD_INTLT',
  label: 'ANN LT',
  positions: ['TEST', 'BRT', 'DIM'],
  system: 'LIGHTS',
});
add({
  id: 'lt.integral',
  kind: 'pot',
  panel: 'OVHD_INTLT',
  label: 'OVHD INTEG LT',
  system: 'LIGHTS',
});
add({
  id: 'lt.flood',
  kind: 'pot',
  panel: 'MAIN_CENTER',
  label: 'FLOOD LT MAIN PNL',
  system: 'LIGHTS',
});
add({
  id: 'sign.seatbelts',
  kind: 'switch',
  panel: 'OVHD_SIGNS',
  label: 'SEAT BELTS',
  positions: ['OFF', 'AUTO', 'ON'],
  system: 'SIGNS',
});
add({
  id: 'sign.nosmoking',
  kind: 'switch',
  panel: 'OVHD_SIGNS',
  label: 'NO SMOKING',
  positions: ['OFF', 'AUTO', 'ON'],
  system: 'SIGNS',
});
// ---- FCU ----
for (const k of ['spd', 'hdg', 'alt', 'vs'] as const) {
  add({ id: `fcu.${k}`, kind: 'knob', panel: 'GLARE_FCU', label: k.toUpperCase(), system: 'FCU' });
}
add({ id: 'fcu.spdmach', kind: 'momentary', panel: 'GLARE_FCU', label: 'SPD MACH', system: 'FCU' });
add({
  id: 'fcu.hdgtrk',
  kind: 'momentary',
  panel: 'GLARE_FCU',
  label: 'HDG-V/S TRK-FPA',
  system: 'FCU',
});
add({
  id: 'fcu.metric',
  kind: 'momentary',
  panel: 'GLARE_FCU',
  label: 'METRIC ALT',
  system: 'FCU',
});
add({
  id: 'fcu.altinc',
  kind: 'selector',
  panel: 'GLARE_FCU',
  label: 'ALT INC',
  positions: ['100', '1000'],
  system: 'FCU',
});
for (const [id, label] of [
  ['fcu.loc', 'LOC'],
  ['fcu.ap1', 'AP 1'],
  ['fcu.ap2', 'AP 2'],
  ['fcu.athr', 'A/THR'],
  ['fcu.exped', 'EXPED'],
  ['fcu.appr', 'APPR'],
] as const) {
  add({ id, kind: 'pb', panel: 'GLARE_FCU', label, system: 'FCU' });
}
// ---- EFIS（1 = 機長、2 = 副駕駛） ----
for (const s of [1, 2] as const) {
  const panel: PanelId = s === 1 ? 'GLARE_EFIS1' : 'GLARE_EFIS2';
  for (const [k, label] of [
    ['fd', 'FD'],
    ['ls', 'LS'],
    ['cstr', 'CSTR'],
    ['wpt', 'WPT'],
    ['vord', 'VOR.D'],
    ['ndb', 'NDB'],
    ['arpt', 'ARPT'],
  ] as const) {
    add({ id: `efis${s}.${k}`, kind: 'pb', panel, label, system: 'EFIS' });
  }
  add({
    id: `efis${s}.mode`,
    kind: 'selector',
    panel,
    label: 'ND MODE',
    positions: ['LS', 'VOR', 'NAV', 'ARC', 'PLAN'],
    system: 'EFIS',
  });
  add({
    id: `efis${s}.range`,
    kind: 'selector',
    panel,
    label: 'ND RANGE',
    positions: ['10', '20', '40', '80', '160', '320'],
    system: 'EFIS',
  });
  add({ id: `efis${s}.baro`, kind: 'knob', panel, label: 'BARO', system: 'EFIS' });
  add({
    id: `efis${s}.barounit`,
    kind: 'selector',
    panel,
    label: 'inHg / hPa',
    positions: ['inHg', 'hPa'],
    system: 'EFIS',
  });
  const warn: PanelId = s === 1 ? 'GLARE_WARN1' : 'GLARE_WARN2';
  add({
    id: `warn${s}.mw`,
    kind: 'momentary',
    panel: warn,
    label: 'MASTER WARN',
    upper: 'MASTER',
    lower: 'WARN',
    system: 'FWS',
  });
  add({
    id: `warn${s}.mc`,
    kind: 'momentary',
    panel: warn,
    label: 'MASTER CAUT',
    upper: 'MASTER',
    lower: 'CAUT',
    system: 'FWS',
  });
  add({
    id: `sidestick${s}`,
    kind: 'lever',
    panel: 'SIDESTICK',
    label: s === 1 ? 'CAPT SIDESTICK' : 'F/O SIDESTICK',
    system: 'FCTL',
  });
  add({
    id: `sidestick${s}.apdisc`,
    kind: 'momentary',
    panel: 'SIDESTICK',
    label: 'AP DISC / TAKEOVER',
    system: 'FCU',
  });
}
// ---- MAIN PANEL ----
add({
  id: 'gear.lever',
  kind: 'lever',
  panel: 'MAIN_CENTER',
  label: 'LDG GEAR',
  positions: ['UP', 'DOWN'],
  system: 'WHEEL',
});
pb('abrk.lo', 'MAIN_CENTER', 'AUTO/BRK LO', 'DECEL', 'ON', 'WHEEL');
pb('abrk.med', 'MAIN_CENTER', 'AUTO/BRK MED', 'DECEL', 'ON', 'WHEEL');
pb('abrk.max', 'MAIN_CENTER', 'AUTO/BRK MAX', 'DECEL', 'ON', 'WHEEL');
add({
  id: 'brk.antiskid',
  kind: 'switch',
  panel: 'MAIN_CENTER',
  label: 'A/SKID & N/W STRG',
  positions: ['OFF', 'ON'],
  system: 'WHEEL',
});
for (const du of ['pfd1', 'nd1', 'ewd', 'sd', 'nd2', 'pfd2'] as const) {
  const panel: PanelId = du.endsWith('1') ? 'MAIN_CAPT' : du.endsWith('2') ? 'MAIN_FO' : 'PED_ECP';
  add({ id: `brt.${du}`, kind: 'pot', panel, label: `${du.toUpperCase()} BRT`, system: 'EIS' });
}
// ---- PEDESTAL ----
for (const p of [
  'ENG',
  'BLEED',
  'PRESS',
  'ELEC',
  'HYD',
  'FUEL',
  'APU',
  'COND',
  'DOOR',
  'WHEEL',
  'F/CTL',
  'STS',
  'ALL',
  'CLR',
  'RCL',
  'TO CONF',
  'EMER CANC',
] as const) {
  add({ id: `ecp.${p}`, kind: 'momentary', panel: 'PED_ECP', label: p, system: 'ECAM' });
}
add({
  id: 'eng.mode',
  kind: 'selector',
  panel: 'PED_ENG',
  label: 'MODE',
  positions: ['CRANK', 'NORM', 'IGN/START'],
  system: 'ENG',
});
add({
  id: 'eng.master1',
  kind: 'switch',
  panel: 'PED_ENG',
  label: 'ENG 1 MASTER',
  positions: ['OFF', 'ON'],
  system: 'ENG',
});
add({
  id: 'eng.master2',
  kind: 'switch',
  panel: 'PED_ENG',
  label: 'ENG 2 MASTER',
  positions: ['OFF', 'ON'],
  system: 'ENG',
});
add({
  id: 'thr.lever1',
  kind: 'lever',
  panel: 'PED_THR',
  label: 'THR LVR 1',
  positions: ['MAX REV', 'REV IDLE', 'IDLE', 'CL', 'FLX/MCT', 'TOGA'],
  system: 'ENG',
});
add({
  id: 'thr.lever2',
  kind: 'lever',
  panel: 'PED_THR',
  label: 'THR LVR 2',
  positions: ['MAX REV', 'REV IDLE', 'IDLE', 'CL', 'FLX/MCT', 'TOGA'],
  system: 'ENG',
});
add({
  id: 'thr.instdisc',
  kind: 'momentary',
  panel: 'PED_THR',
  label: 'A/THR INST DISC',
  system: 'FCU',
});
add({
  id: 'flaps',
  kind: 'lever',
  panel: 'PED_FLAPS',
  label: 'FLAPS',
  positions: ['0', '1', '2', '3', 'FULL'],
  system: 'F/CTL',
});
add({
  id: 'spdbrk',
  kind: 'lever',
  panel: 'PED_SPDBRK',
  label: 'SPEED BRAKE',
  positions: ['RET', '1/2', 'FULL'],
  system: 'F/CTL',
});
add({
  id: 'pbrk',
  kind: 'lever',
  panel: 'PED_PBRK',
  label: 'PARK BRK',
  positions: ['OFF', 'ON'],
  system: 'WHEEL',
});
add({ id: 'rudtrim', kind: 'knob', panel: 'PED_RUDTRIM', label: 'RUD TRIM', system: 'F/CTL' });
add({
  id: 'rudtrim.reset',
  kind: 'momentary',
  panel: 'PED_RUDTRIM',
  label: 'RESET',
  system: 'F/CTL',
});

// ---- MCDU 按鍵 ----
export const MCDU_FUNCTION_KEYS = [
  'DIR',
  'PROG',
  'PERF',
  'INIT',
  'DATA',
  'FPLN',
  'RADNAV',
  'FUEL',
  'MENU',
  'AIRPORT',
  'UP',
  'DOWN',
  'PREV',
  'NEXT',
] as const;
export const MCDU_LSK = [
  'L1',
  'L2',
  'L3',
  'L4',
  'L5',
  'L6',
  'R1',
  'R2',
  'R3',
  'R4',
  'R5',
  'R6',
] as const;
export const MCDU_CHAR_KEYS = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
  'DOT',
  'PLUSMINUS',
  'SLASH',
  'SP',
  'CLR',
  'OVFY',
] as const;
for (const s of [1, 2] as const) {
  const panel: PanelId = s === 1 ? 'PED_MCDU1' : 'PED_MCDU2';
  for (const k of [...MCDU_LSK, ...MCDU_FUNCTION_KEYS, ...MCDU_CHAR_KEYS]) {
    add({ id: `mcdu${s}.${k}`, kind: 'key', panel, label: k, system: 'MCDU' });
  }
}

export const CONTROL_DEFS: readonly ControlDef[] = defs;
export const CONTROL_MAP: ReadonlyMap<string, ControlDef> = new Map(defs.map((d) => [d.id, d]));

// ---------------------------------------------------------------------------
// readControl：燈號與位置全部由系統狀態推導
// ---------------------------------------------------------------------------
const L = (text: string, color: Legend['color']): Legend => ({ text, color });

function view(
  value: number,
  upper: Legend | null = null,
  lower: Legend | null = null,
  led = false,
): ControlView {
  return { value, upper, lower, led, enabled: true };
}

const sel = <T extends string>(positions: readonly T[], v: T): number =>
  Math.max(0, positions.indexOf(v));

/** 按鈕燈需要電源：任一 DC 匯流排（冷艙時全暗） */
function annunPowered(s: SimState): boolean {
  return s.elec.dcEss || s.elec.dcBat || s.elec.dcBus1 || s.elec.dcBus2;
}

export function readControl(s: SimState, id: string): ControlView {
  const v = readRaw(s, id);
  const def = CONTROL_MAP.get(id);
  const test = s.lights.annun === 'TEST' && annunPowered(s);
  if (!annunPowered(s)) {
    v.upper = null;
    v.lower = null;
    v.led = false;
  } else if (test && def && (def.kind === 'pb' || def.id.startsWith('warn'))) {
    v.upper = def.upper
      ? L(def.upper, def.upper === 'FIRE' || def.lower === 'WARN' ? 'red' : 'amber')
      : null;
    v.lower = def.lower
      ? L(def.lower, def.lower === 'WARN' ? 'red' : def.lower === 'CAUT' ? 'amber' : 'white')
      : null;
    v.led = def.panel.startsWith('GLARE');
  }
  if (s.warnings.fireTest && (id === 'fire.eng1' || id === 'fire.eng2' || id === 'fire.apu')) {
    v.upper = L('FIRE', 'red');
  }
  return v;
}

function readRaw(s: SimState, id: string): ControlView {
  const e = s.elec;
  const [dot0, dot1] = id.split('.', 2) as [string, string | undefined];
  switch (id) {
    case 'elec.bat1':
      return view(e.bat1 ? 1 : 0, null, e.bat1 ? null : L('OFF', 'white'));
    case 'elec.bat2':
      return view(e.bat2 ? 1 : 0, null, e.bat2 ? null : L('OFF', 'white'));
    case 'elec.extpwr':
      return view(
        e.extPwrOn ? 1 : 0,
        e.extPwrAvail && !e.extPwrOn ? L('AVAIL', 'green') : null,
        e.extPwrOn ? L('ON', 'blue') : null,
      );
    case 'elec.gen1':
      return view(
        e.gen1 ? 1 : 0,
        e.gen1 && !e.gen1Online && s.engines[0].state !== 'OFF' ? L('FAULT', 'amber') : null,
        e.gen1 ? null : L('OFF', 'white'),
      );
    case 'elec.gen2':
      return view(
        e.gen2 ? 1 : 0,
        e.gen2 && !e.gen2Online && s.engines[1].state !== 'OFF' ? L('FAULT', 'amber') : null,
        e.gen2 ? null : L('OFF', 'white'),
      );
    case 'elec.apugen':
      return view(
        e.apuGen ? 1 : 0,
        e.apuGen && !e.apuGenOnline && s.apu.state === 'AVAILABLE' ? L('FAULT', 'amber') : null,
        e.apuGen ? null : L('OFF', 'white'),
      );
    case 'elec.bustie':
      return view(e.busTie ? 1 : 0, null, e.busTie ? null : L('OFF', 'white'));
    case 'fuel.xfeed':
      return view(
        s.fuel.xfeed ? 1 : 0,
        s.fuel.xfeed ? L('OPEN', 'green') : null,
        s.fuel.xfeed ? L('ON', 'blue') : null,
      );
    case 'hyd.eng1pump':
      return view(
        s.hyd.eng1Pump ? 1 : 0,
        s.hyd.eng1Pump && s.hyd.green.pressure < 1450 && s.engines[0].state !== 'OFF'
          ? L('FAULT', 'amber')
          : null,
        s.hyd.eng1Pump ? null : L('OFF', 'white'),
      );
    case 'hyd.eng2pump':
      return view(
        s.hyd.eng2Pump ? 1 : 0,
        s.hyd.eng2Pump && s.hyd.yellow.pressure < 1450 && s.engines[1].state !== 'OFF'
          ? L('FAULT', 'amber')
          : null,
        s.hyd.eng2Pump ? null : L('OFF', 'white'),
      );
    case 'hyd.elecpump':
      return view(s.hyd.elecPump ? 1 : 0, null, s.hyd.elecPump ? null : L('OFF', 'white'));
    case 'hyd.yelecpump':
      return view(
        s.hyd.yellowElecPump ? 1 : 0,
        null,
        s.hyd.yellowElecPump ? L('ON', 'blue') : null,
      );
    case 'hyd.ptu':
      return view(s.hyd.ptu ? 1 : 0, null, s.hyd.ptu ? null : L('OFF', 'white'));
    case 'apu.master':
      return view(s.apu.master ? 1 : 0, null, s.apu.master ? L('ON', 'blue') : null);
    case 'apu.start':
      return view(
        s.apu.startPb ? 1 : 0,
        s.apu.state === 'AVAILABLE' ? L('AVAIL', 'green') : null,
        s.apu.state === 'STARTING' ? L('ON', 'blue') : null,
      );
    case 'air.pack1':
      return view(
        s.pneu.pack1 ? 1 : 0,
        s.pneu.pack1 && s.pneu.pack1Flow < 0.2 && s.pneu.ductL > 10 ? L('FAULT', 'amber') : null,
        s.pneu.pack1 ? null : L('OFF', 'white'),
      );
    case 'air.pack2':
      return view(
        s.pneu.pack2 ? 1 : 0,
        s.pneu.pack2 && s.pneu.pack2Flow < 0.2 && s.pneu.ductR > 10 ? L('FAULT', 'amber') : null,
        s.pneu.pack2 ? null : L('OFF', 'white'),
      );
    case 'air.eng1bleed':
      return view(s.pneu.eng1Bleed ? 1 : 0, null, s.pneu.eng1Bleed ? null : L('OFF', 'white'));
    case 'air.eng2bleed':
      return view(s.pneu.eng2Bleed ? 1 : 0, null, s.pneu.eng2Bleed ? null : L('OFF', 'white'));
    case 'air.apubleed':
      return view(s.pneu.apuBleed ? 1 : 0, null, s.pneu.apuBleed ? L('ON', 'blue') : null);
    case 'air.xbleed':
      return view(sel(['SHUT', 'AUTO', 'OPEN'], s.pneu.xbleed));
    case 'air.packflow':
      return view(sel(['LO', 'NORM', 'HI'], s.pneu.packFlow));
    case 'ai.wing':
      return view(s.antiIce.wing ? 1 : 0, null, s.antiIce.wing ? L('ON', 'blue') : null);
    case 'ai.eng1':
      return view(s.antiIce.eng1 ? 1 : 0, null, s.antiIce.eng1 ? L('ON', 'blue') : null);
    case 'ai.eng2':
      return view(s.antiIce.eng2 ? 1 : 0, null, s.antiIce.eng2 ? L('ON', 'blue') : null);
    case 'ai.probe':
      return view(s.antiIce.probe ? 1 : 0, null, s.antiIce.probe ? L('ON', 'blue') : null);
    case 'press.modesel':
      return view(s.press.modeMan ? 1 : 0, null, s.press.modeMan ? L('MAN', 'white') : null);
    case 'press.manvs':
      return view(1 - s.press.manVs);
    case 'press.ditching':
      return view(s.press.ditching ? 1 : 0, null, s.press.ditching ? L('ON', 'blue') : null);
    case 'fire.eng1':
    case 'fire.eng2': {
      const eng = s.engines[id === 'fire.eng1' ? 0 : 1];
      return { ...view(eng.firePushed ? 1 : 0), guardOpen: guardOpen(s, id) };
    }
    case 'fire.apu':
      return { ...view(0), guardOpen: guardOpen(s, id) };
    case 'fire.eng1.guard':
    case 'fire.eng2.guard':
    case 'fire.apu.guard':
      return {
        ...view(guardOpen(s, id.replace('.guard', '')) ? 1 : 0),
        guardOpen: guardOpen(s, id.replace('.guard', '')),
      };
    case 'fire.test':
      return view(s.warnings.fireTest ? 1 : 0);
    case 'lt.strobe':
      return view(sel(['OFF', 'AUTO', 'ON'], s.lights.strobe));
    case 'lt.beacon':
      return view(s.lights.beacon ? 1 : 0);
    case 'lt.wing':
      return view(s.lights.wing ? 1 : 0);
    case 'lt.navlogo':
      return view(s.lights.navLogo ? 1 : 0);
    case 'lt.rwyturnoff':
      return view(s.lights.rwyTurnoff ? 1 : 0);
    case 'lt.landL':
      return view(sel(['RETRACT', 'OFF', 'ON'], s.lights.landL));
    case 'lt.landR':
      return view(sel(['RETRACT', 'OFF', 'ON'], s.lights.landR));
    case 'lt.nose':
      return view(sel(['OFF', 'TAXI', 'TO'], s.lights.nose));
    case 'lt.dome':
      return view(sel(['OFF', 'DIM', 'BRT'], s.lights.dome));
    case 'lt.annun':
      return view(sel(['TEST', 'BRT', 'DIM'], s.lights.annun));
    case 'lt.integral':
      return view(s.lights.integral);
    case 'lt.flood':
      return view(s.lights.flood);
    case 'sign.seatbelts':
      return view(sel(['OFF', 'AUTO', 'ON'], s.lights.seatBelts));
    case 'sign.nosmoking':
      return view(sel(['OFF', 'AUTO', 'ON'], s.lights.noSmoking));
    case 'fcu.spd':
      return view(s.fcu.spdManaged ? 1 : 0, null, null, s.fcu.spdManaged);
    case 'fcu.hdg':
      return view(s.fcu.hdgManaged ? 1 : 0, null, null, s.fcu.hdgManaged);
    case 'fcu.alt':
      return view(
        0,
        null,
        null,
        s.afs.vertical === 'CLB' ||
          s.afs.vertical === 'DES' ||
          s.afs.verticalArmed.includes('CLB') ||
          s.afs.verticalArmed.includes('DES'),
      );
    case 'fcu.vs':
      return view(s.fcu.vsDashes ? 0 : 1);
    case 'fcu.altinc':
      return view(s.fcu.altInc === 100 ? 0 : 1);
    case 'fcu.ap1':
      return view(s.afs.ap1 ? 1 : 0, null, null, s.afs.ap1);
    case 'fcu.ap2':
      return view(s.afs.ap2 ? 1 : 0, null, null, s.afs.ap2);
    case 'fcu.athr':
      return view(s.afs.athrArmed ? 1 : 0, null, null, s.afs.athrArmed);
    case 'fcu.loc':
      return view(
        s.afs.locArmed ? 1 : 0,
        null,
        null,
        s.afs.locArmed || s.afs.lateral === 'LOC' || s.afs.lateral === 'LOC*',
      );
    case 'fcu.appr':
      return view(s.afs.apprArmed ? 1 : 0, null, null, s.afs.apprArmed);
    case 'fcu.exped':
      return view(s.fcu.exped ? 1 : 0, null, null, s.fcu.exped);
    case 'gear.lever':
      return view(s.gear.lever === 'DOWN' ? 1 : 0);
    case 'abrk.lo':
    case 'abrk.med':
    case 'abrk.max': {
      const mode = id === 'abrk.lo' ? 'LO' : id === 'abrk.med' ? 'MED' : 'MAX';
      const on = s.gear.autobrake === mode;
      return view(
        on ? 1 : 0,
        on && s.gear.autobrakeDecel ? L('DECEL', 'green') : null,
        on ? L('ON', 'blue') : null,
      );
    }
    case 'brk.antiskid':
      return view(s.gear.antiSkid ? 1 : 0);
    case 'eng.mode':
      return view(sel(['CRANK', 'NORM', 'IGN/START'], s.mech.engMode));
    case 'eng.master1':
      return view(s.engines[0].master ? 1 : 0);
    case 'eng.master2':
      return view(s.engines[1].master ? 1 : 0);
    case 'thr.lever1':
      return view(s.engines[0].tla);
    case 'thr.lever2':
      return view(s.engines[1].tla);
    case 'flaps':
      return view(s.controls.flapHandle);
    case 'spdbrk':
      return view(s.controls.spoilersArmed ? -0.1 : s.controls.speedbrakeHandle);
    case 'pbrk':
      return view(s.gear.parkingBrake ? 1 : 0);
    case 'rudtrim':
      return view(s.controls.rudderTrim);
    case 'warn1.mw':
    case 'warn2.mw':
      return view(
        0,
        s.warnings.masterWarning ? L('MASTER', 'red') : null,
        s.warnings.masterWarning ? L('WARN', 'red') : null,
      );
    case 'warn1.mc':
    case 'warn2.mc':
      return view(
        0,
        s.warnings.masterCaution ? L('MASTER', 'amber') : null,
        s.warnings.masterCaution ? L('CAUT', 'amber') : null,
      );
    case 'sidestick1':
      return view(0);
    case 'sidestick2':
      return view(0);
    default:
      break;
  }
  if (dot0 === 'fuel' && dot1) {
    const on = s.fuel.pumps[dot1 as keyof typeof s.fuel.pumps];
    return view(on ? 1 : 0, null, on ? null : L('OFF', 'white'));
  }
  if (id.startsWith('adirs.ir')) {
    const idx = Number(id.slice(-1)) - 1;
    const ir = s.adirs.ir[idx];
    return view(sel(['OFF', 'NAV', 'ATT'], ir.mode));
  }
  if (id.startsWith('efis')) {
    const side = id[4] === '1' ? 0 : 1;
    const ef = s.efis[side];
    const key = id.slice(6);
    switch (key) {
      case 'fd':
      case 'ls':
      case 'cstr':
      case 'wpt':
      case 'vord':
      case 'ndb':
      case 'arpt': {
        const on = ef[key];
        return view(on ? 1 : 0, null, null, on);
      }
      case 'mode':
        return view(sel(['LS', 'VOR', 'NAV', 'ARC', 'PLAN'], ef.mode));
      case 'range':
        return view([10, 20, 40, 80, 160, 320].indexOf(ef.range));
      case 'baro':
        return view(ef.baroStd ? 1 : 0);
      case 'barounit':
        return view(ef.baroUnit === 'inHg' ? 0 : 1);
      default:
        break;
    }
  }
  if (id.startsWith('brt.')) {
    return view(s.lights.duBrightness[id.slice(4) as keyof typeof s.lights.duBrightness]);
  }
  if (id.startsWith('ecp.')) {
    const page = id.slice(4);
    const lit = s.ecam.manualPage === page || (page === 'STS' && s.ecam.manualPage === 'STS');
    return view(lit ? 1 : 0, null, lit ? L('', 'white') : null);
  }
  return view(0);
}

/** 保護蓋狀態（機構位置，保存在 SimState.mech） */
export function guardOpen(s: SimState, protectedId: string): boolean {
  return s.mech.guardsOpen.includes(protectedId);
}
