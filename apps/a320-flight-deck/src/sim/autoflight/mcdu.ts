/**
 * MCDU：頁面邏輯與畫面模型（14 行 × 24 欄）。兩台 MCDU 共用同一份 fplan / afs，
 * 修改（DIR TO、高度限制、刪除航點、V 速度、CRZ FL、ILS 頻率）立即影響 ND 與自動駕駛。
 */
import { AIRPORT, DEFAULT_ROUTE, NAVAIDS, NM } from '../constants';
import type { McduColor, McduPage, McduScreen, McduSeg, SimState, Waypoint } from '../types';
import { bearing } from './navigation';

type Row = McduSeg[];

const pad = (t: string, n: number): string =>
  t.length >= n ? t.slice(0, n) : t + ' '.repeat(n - t.length);
const right = (t: string, col = 24): number => Math.max(0, col - t.length);

function seg(col: number, text: string, color: McduColor, small = false): McduSeg {
  return { col, text, color, small };
}

function blank(): McduScreen {
  return {
    rows: Array.from({ length: 14 }, (): Row => []),
    arrows: { up: false, down: false, left: false, right: false },
  };
}

function title(sc: McduScreen, text: string, color: McduColor = 'white'): void {
  sc.rows[0].push(seg(Math.max(0, Math.floor((24 - text.length) / 2)), text, color));
}

/** line 1..6：label 行 = 2n-1、data 行 = 2n */
function label(
  sc: McduScreen,
  line: number,
  side: 'L' | 'R',
  text: string,
  color: McduColor = 'white',
): void {
  sc.rows[line * 2 - 1].push(seg(side === 'L' ? 1 : right(text, 23), text, color, true));
}
function data(
  sc: McduScreen,
  line: number,
  side: 'L' | 'R',
  text: string,
  color: McduColor,
  small = false,
): void {
  sc.rows[line * 2].push(seg(side === 'L' ? 0 : right(text), text, color, small));
}

const fmtAlt = (ft: number, transAlt: number): string =>
  ft >= transAlt ? `FL${String(Math.round(ft / 100)).padStart(3, '0')}` : String(Math.round(ft));

// ------------------------------------------------------------------ 畫面
export function buildMcduScreen(s: SimState, side: 0 | 1): McduScreen {
  const m = s.mcdu[side];
  const sc = blank();
  switch (m.page) {
    case 'MENU':
      title(sc, 'MCDU MENU');
      data(sc, 1, 'L', '<FMGC (REQ)', 'green');
      data(sc, 2, 'L', '<ATSU', 'white');
      data(sc, 3, 'L', '<AIDS', 'white');
      data(sc, 4, 'L', '<CFDS', 'white');
      data(sc, 6, 'R', 'RETURN>', 'white');
      break;
    case 'INIT':
      pageInit(s, sc);
      break;
    case 'FPLN':
      pageFpln(s, side, sc);
      break;
    case 'PERF':
      pagePerf(s, side, sc);
      break;
    case 'PROG':
      pageProg(s, sc);
      break;
    case 'DIR':
      pageDir(s, side, sc);
      break;
    case 'RADNAV':
      title(sc, 'RADIO NAV');
      {
        const v1 = vorByIdent(s.radio.vor1);
        const v2 = vorByIdent(s.radio.vor2);
        label(sc, 1, 'L', 'VOR1/FREQ');
        data(sc, 1, 'L', v1 ? `${v1.ident}/${v1.freq.toFixed(2)}` : '[ ]/[  . ]', 'cyan');
        label(sc, 1, 'R', 'FREQ/VOR2');
        data(sc, 1, 'R', v2 ? `${v2.freq.toFixed(2)}/${v2.ident}` : '[  . ]/[ ]', 'cyan');
      }
      label(sc, 3, 'L', 'LS /FREQ');
      data(sc, 3, 'L', `${s.ils.tuned ? s.ils.ident : '[  ]'}/${s.ils.freq.toFixed(2)}`, 'cyan');
      label(sc, 4, 'L', 'CRS');
      data(sc, 4, 'L', String(s.ils.course).padStart(3, '0'), 'cyan');
      label(sc, 5, 'L', 'ADF1/FREQ');
      data(sc, 5, 'L', `${NAVAIDS[2].ident}/${NAVAIDS[2].freq}`, 'cyan');
      break;
    case 'DATA':
      title(sc, 'POSITION MONITOR');
      label(sc, 1, 'L', 'FMS1');
      data(sc, 1, 'L', posString(s), 'green');
      label(sc, 3, 'L', 'IRS1  IRS2  IRS3');
      data(
        sc,
        3,
        'L',
        s.adirs.ir
          .map((ir) => (ir.aligned ? 'NAV ' : ir.mode === 'OFF' ? 'OFF ' : 'ALGN'))
          .join('  '),
        'green',
      );
      label(sc, 5, 'L', 'GPS PRIMARY');
      data(
        sc,
        5,
        'L',
        s.adirs.ir.some((ir) => ir.aligned) ? 'GPS PRIMARY' : 'GPS PRIMARY LOST',
        s.adirs.ir.some((ir) => ir.aligned) ? 'green' : 'amber',
      );
      break;
    case 'FUEL': {
      title(sc, 'FUEL PRED');
      label(sc, 1, 'L', 'AT');
      data(sc, 1, 'L', `${s.fplan.destination} ${s.fplan.destRwy}`, 'green');
      label(sc, 3, 'L', 'GW    CG');
      data(
        sc,
        3,
        'L',
        `${(s.aircraft.mass / 1000).toFixed(1)}  ${s.aircraft.cgMac.toFixed(1)}`,
        'green',
      );
      label(sc, 3, 'R', 'FOB');
      data(sc, 3, 'R', (s.fuel.fob / 1000).toFixed(1), 'green');
      label(sc, 4, 'L', 'ZFW');
      data(sc, 4, 'L', s.fplan.zfw.toFixed(1), 'cyan');
      label(sc, 4, 'R', 'FU');
      data(sc, 4, 'R', ((s.fuel.used1 + s.fuel.used2) / 1000).toFixed(2), 'green');
      label(sc, 5, 'L', 'BLOCK');
      data(sc, 5, 'L', s.fplan.blockFuel.toFixed(1), 'cyan');
      break;
    }
    case 'AIRPORT':
      pageFpln(s, side, sc);
      break;
  }
  const msg = m.message;
  sc.rows[13] = [
    seg(0, pad(msg ?? m.scratchpad, 22), msg ? (m.msgAmber ? 'amber' : 'white') : 'white'),
  ];
  return sc;
}

function vorByIdent(ident: string): (typeof NAVAIDS)[number] | undefined {
  return NAVAIDS.find((n) => n.kind === 'VOR' && n.ident === ident);
}

function posString(s: SimState): string {
  // 以機場為參考點換算虛構經緯度（北緯 25°、東經 121.5°）
  const lat = 25 - s.aircraft.position.z / 111_000;
  const lon = 121.5 + s.aircraft.position.x / (111_000 * Math.cos((25 * Math.PI) / 180));
  const dm = (v: number): string =>
    `${Math.floor(Math.abs(v))}°${((Math.abs(v) % 1) * 60).toFixed(1).padStart(4, '0')}`;
  return `${dm(lat)}N/${dm(lon)}E`;
}

function pageInit(s: SimState, sc: McduScreen): void {
  const fp = s.fplan;
  title(sc, 'INIT');
  sc.arrows.left = sc.arrows.right = true;
  label(sc, 1, 'L', 'CO RTE');
  data(sc, 1, 'L', fp.initialized ? 'XHAOXHAO01' : '__________', fp.initialized ? 'cyan' : 'amber');
  label(sc, 1, 'R', 'FROM/TO  ');
  data(
    sc,
    1,
    'R',
    fp.initialized ? `${fp.origin}/${fp.destination}` : '____/____',
    fp.initialized ? 'cyan' : 'amber',
  );
  label(sc, 3, 'L', 'FLT NBR');
  data(sc, 3, 'L', fp.flightNo, 'cyan');
  label(sc, 5, 'L', 'COST INDEX');
  data(sc, 5, 'L', String(fp.costIndex), 'cyan');
  label(sc, 6, 'L', 'CRZ FL/TEMP');
  data(sc, 6, 'L', `FL${fp.crzFl}/${Math.round(15 - fp.crzFl * 0.198)}°`, 'cyan');
  label(sc, 6, 'R', 'TROPO');
  data(sc, 6, 'R', '36090', 'cyan', true);
  label(sc, 2, 'R', 'ALIGN IRS');
  data(
    sc,
    2,
    'R',
    s.adirs.ir.every((ir) => ir.aligned || ir.mode === 'OFF') ? '' : 'ALIGN IRS>',
    'amber',
  );
}

function pageFpln(s: SimState, side: 0 | 1, sc: McduScreen): void {
  const fp = s.fplan;
  const m = s.mcdu[side];
  const wps = fp.waypoints;
  title(sc, `FROM ${fp.flightNo}`, 'white');
  sc.arrows.up = sc.arrows.down = true;
  sc.arrows.left = sc.arrows.right = true;
  const start = Math.max(
    0,
    Math.min(m.scroll + Math.max(0, fp.activeLeg - 1), Math.max(0, wps.length - 1)),
  );
  for (let line = 1; line <= 5; line++) {
    const i = start + line - 1;
    if (i >= wps.length) {
      if (i === wps.length)
        data(sc, line, 'L', wps.length ? '---- END OF F-PLN ----' : '---- NO F-PLN ----', 'white');
      continue;
    }
    const w = wps[i];
    const isTo = i === fp.activeLeg;
    const color: McduColor = isTo ? 'white' : i < fp.activeLeg ? 'green' : 'green';
    if (i > 0) {
      const p = wps[i - 1];
      const brg = Math.round(bearing(w.x - p.x, w.z - p.z));
      const dist = Math.round(Math.hypot(w.x - p.x, w.z - p.z) / NM);
      label(sc, line, 'L', `C${String(brg).padStart(3, '0')}°`, 'green');
      label(sc, line, 'R', `${dist}NM   `, 'green');
    }
    data(sc, line, 'L', w.ident, color);
    const spd = w.spd ? String(w.spd) : '---';
    const altText = w.alt
      ? `${w.alt.type === 'AT_OR_ABOVE' ? '+' : w.alt.type === 'AT_OR_BELOW' ? '-' : ''}${fmtAlt(w.alt.ft, s.afs.transAlt)}`
      : '-----';
    data(sc, line, 'R', `${spd}/${altText}`, w.alt || w.spd ? 'magenta' : 'green');
  }
  label(sc, 6, 'L', 'DEST     TIME  DIST  EFOB');
  const eta = s.flight.gs > 30 ? fp.distToDest / s.flight.gs : 0;
  const hh = (s.weather.timeOfDay + eta) % 24;
  const time = `${String(Math.floor(hh)).padStart(2, '0')}${String(Math.floor((hh % 1) * 60)).padStart(2, '0')}`;
  data(
    sc,
    6,
    'L',
    `${fp.destination}${fp.destRwy}  ${time}  ${String(Math.round(fp.distToDest)).padStart(4)}  ${(Math.max(0, s.fuel.fob - fp.distToDest * 5) / 1000).toFixed(1)}`,
    'white',
  );
}

function pagePerf(s: SimState, side: 0 | 1, sc: McduScreen): void {
  const a = s.afs;
  const m = s.mcdu[side];
  const active =
    a.phase === 'TAKEOFF' || a.phase === 'PREFLIGHT'
      ? 'TO'
      : a.phase === 'CLIMB'
        ? 'CLB'
        : a.phase === 'CRUISE'
          ? 'CRZ'
          : a.phase === 'DESCENT'
            ? 'DES'
            : a.phase === 'GO AROUND'
              ? 'GA'
              : 'APPR';
  const isActive = m.perfPage === active;
  const hdr = (t: string): void => title(sc, `${t}`, isActive ? 'green' : 'white');
  sc.arrows.left = sc.arrows.right = true;
  switch (m.perfPage) {
    case 'TO':
      hdr('TAKE OFF');
      label(sc, 1, 'L', 'V1');
      data(sc, 1, 'L', String(a.v1), 'cyan');
      label(sc, 1, 'R', 'RWY');
      data(sc, 1, 'R', s.fplan.originRwy, 'green');
      label(sc, 2, 'L', 'VR');
      data(sc, 2, 'L', String(a.vr), 'cyan');
      label(sc, 3, 'L', 'V2');
      data(sc, 3, 'L', String(a.v2), 'cyan');
      label(sc, 4, 'L', 'TRANS ALT');
      data(sc, 4, 'L', String(a.transAlt), 'cyan');
      label(sc, 5, 'L', 'THR RED/ACC');
      data(sc, 5, 'L', `${a.thrRedAlt}/${a.accAlt}`, 'cyan');
      label(sc, 4, 'R', 'FLEX TO TEMP');
      data(sc, 4, 'R', a.flexTemp !== null ? `${a.flexTemp}°` : '[  ]°', 'cyan');
      label(sc, 3, 'R', 'FLAPS/THS');
      data(sc, 3, 'R', `1/UP${Math.abs(s.controls.ths).toFixed(1)}`, 'cyan');
      data(sc, 6, 'R', 'NEXT PHASE>', 'white');
      break;
    case 'CLB':
    case 'CRZ':
    case 'DES': {
      hdr(m.perfPage === 'CLB' ? 'CLB' : m.perfPage === 'CRZ' ? 'CRZ' : 'DES');
      label(sc, 1, 'L', 'ACT MODE');
      data(sc, 1, 'L', 'MANAGED', 'green');
      label(sc, 2, 'L', 'CI');
      data(sc, 2, 'L', String(s.fplan.costIndex), 'cyan');
      label(sc, 3, 'L', 'MANAGED');
      data(
        sc,
        3,
        'L',
        m.perfPage === 'CLB' ? '250/.76' : m.perfPage === 'CRZ' ? '290/.78' : '.78/280',
        'magenta',
      );
      label(sc, 4, 'L', 'PRESEL');
      data(sc, 4, 'L', '*[ ]', 'cyan');
      label(sc, 2, 'R', 'DEST EFOB');
      data(
        sc,
        2,
        'R',
        (Math.max(0, s.fuel.fob - s.fplan.distToDest * 5) / 1000).toFixed(1),
        'green',
      );
      data(sc, 6, 'L', '<PREV PHASE', 'white');
      data(sc, 6, 'R', 'NEXT PHASE>', 'white');
      break;
    }
    case 'APPR':
    case 'GA':
      hdr(m.perfPage === 'APPR' ? 'APPR' : 'GO AROUND');
      label(sc, 1, 'L', 'QNH');
      data(sc, 1, 'L', String(Math.round(s.efis[0].qnh)), 'cyan');
      label(sc, 2, 'L', 'TEMP');
      data(sc, 2, 'L', `${Math.round(s.flight.oat)}°`, 'cyan');
      label(sc, 3, 'L', 'MAG WIND');
      data(
        sc,
        3,
        'L',
        `${String(Math.round(s.weather.windDir)).padStart(3, '0')}°/${Math.round(s.weather.windSpeed)}`,
        'cyan',
      );
      label(sc, 5, 'L', 'VAPP');
      data(sc, 5, 'L', String(a.vapp), 'cyan');
      label(sc, 1, 'R', 'FINAL');
      data(sc, 1, 'R', 'ILS27', 'green');
      label(sc, 2, 'R', 'BARO');
      data(sc, 2, 'R', '200', 'cyan');
      label(sc, 5, 'R', 'LDG CONF');
      data(sc, 5, 'R', 'FULL*', 'cyan');
      data(
        sc,
        6,
        'L',
        a.phase === 'APPROACH' ? '<PREV PHASE' : '<ACTIVATE APPR',
        a.phase === 'APPROACH' ? 'white' : 'amber',
      );
      break;
  }
}

function pageProg(s: SimState, sc: McduScreen): void {
  const fp = s.fplan;
  title(sc, `${s.afs.phase === 'PREFLIGHT' ? 'PREFLIGHT' : s.afs.phase} ${fp.flightNo}`, 'green');
  label(sc, 1, 'L', 'CRZ');
  data(sc, 1, 'L', `FL${fp.crzFl}`, 'cyan');
  label(sc, 1, 'R', 'REC MAX');
  data(sc, 1, 'R', 'FL398', 'magenta');
  label(sc, 2, 'L', 'REPORT');
  data(sc, 2, 'L', fp.waypoints[fp.activeLeg]?.ident ?? '----', 'green');
  label(sc, 3, 'L', 'POSITION UPDATE AT');
  data(sc, 3, 'L', '*[     ]', 'cyan');
  label(sc, 4, 'L', 'BRG /DIST');
  const to = fp.waypoints[fp.activeLeg];
  if (to) {
    const p = s.aircraft.position;
    data(
      sc,
      4,
      'L',
      `${String(Math.round(bearing(to.x - p.x, to.z - p.z))).padStart(3, '0')}°/${fp.distToWpt.toFixed(1)} TO ${to.ident}`,
      'green',
    );
  }
  label(sc, 5, 'L', 'PREDICTIVE');
  data(sc, 5, 'L', `TOD ${fp.todDist > 0 ? fp.todDist.toFixed(0) + 'NM' : '----'}`, 'green');
  label(sc, 6, 'L', 'REQUIRED ACCUR ESTIMATED');
  data(sc, 6, 'L', '1.0NM      HIGH  0.07NM', 'green');
}

function pageDir(s: SimState, side: 0 | 1, sc: McduScreen): void {
  const fp = s.fplan;
  const m = s.mcdu[side];
  title(sc, 'DIR TO');
  label(sc, 1, 'L', 'WAYPOINT');
  data(sc, 1, 'L', fp.directToPending ?? '[     ]', fp.directToPending ? 'yellow' : 'cyan');
  label(sc, 1, 'R', 'UTC   DIST');
  label(sc, 2, 'L', 'F-PLN WPTS');
  const list = fp.waypoints.slice(fp.activeLeg);
  for (let i = 0; i < 4; i++) {
    const w = list[i + m.scroll];
    if (w) data(sc, i + 2, 'L', `↑${w.ident}`, 'cyan');
  }
  if (fp.directToPending) {
    data(sc, 6, 'L', '<ERASE', 'amber');
    data(sc, 6, 'R', 'INSERT*', 'amber');
  }
}

// ------------------------------------------------------------------ 按鍵
const PAGE_KEYS: Record<string, McduPage> = {
  DIR: 'DIR',
  PROG: 'PROG',
  PERF: 'PERF',
  INIT: 'INIT',
  DATA: 'DATA',
  FPLN: 'FPLN',
  RADNAV: 'RADNAV',
  FUEL: 'FUEL',
  MENU: 'MENU',
  AIRPORT: 'AIRPORT',
};
const PERF_ORDER = ['TO', 'CLB', 'CRZ', 'DES', 'APPR', 'GA'] as const;

export function mcduKey(s: SimState, side: 0 | 1, key: string): void {
  const m = s.mcdu[side];
  m.message = null;
  if (key in PAGE_KEYS) {
    m.page = PAGE_KEYS[key];
    m.scroll = 0;
    if (m.page === 'PERF') {
      const ph = s.afs.phase;
      m.perfPage =
        ph === 'CLIMB'
          ? 'CLB'
          : ph === 'CRUISE'
            ? 'CRZ'
            : ph === 'DESCENT'
              ? 'DES'
              : ph === 'APPROACH'
                ? 'APPR'
                : ph === 'GO AROUND'
                  ? 'GA'
                  : 'TO';
    }
    if (m.page === 'AIRPORT') {
      m.page = 'FPLN';
      m.scroll = Math.max(0, s.fplan.waypoints.length - 3 - Math.max(0, s.fplan.activeLeg - 1));
    }
    return;
  }
  switch (key) {
    case 'UP':
      m.scroll = Math.max(-(s.fplan.activeLeg - 1), m.scroll - 1);
      return;
    case 'DOWN':
      m.scroll += 1;
      return;
    case 'PREV':
    case 'NEXT':
      if (m.page === 'PERF') {
        const i = PERF_ORDER.indexOf(m.perfPage);
        m.perfPage =
          PERF_ORDER[(i + (key === 'NEXT' ? 1 : PERF_ORDER.length - 1)) % PERF_ORDER.length];
      }
      return;
    case 'CLR':
      if (m.scratchpad.length > 0 && m.scratchpad !== 'CLR')
        m.scratchpad = m.scratchpad.slice(0, -1);
      else m.scratchpad = m.scratchpad === 'CLR' ? '' : 'CLR';
      return;
    case 'SP':
      append(m, ' ');
      return;
    case 'DOT':
      append(m, '.');
      return;
    case 'SLASH':
      append(m, '/');
      return;
    case 'PLUSMINUS':
      if (m.scratchpad.endsWith('-')) m.scratchpad = m.scratchpad.slice(0, -1) + '+';
      else append(m, '-');
      return;
    case 'OVFY':
      append(m, 'Δ');
      return;
    default:
      break;
  }
  if (/^[LR][1-6]$/.test(key)) {
    lsk(s, side, key[0] as 'L' | 'R', Number(key[1]));
    return;
  }
  if (/^[A-Z0-9]$/.test(key)) append(m, key);
}

function append(m: SimState['mcdu'][number], ch: string): void {
  if (m.scratchpad === 'CLR') m.scratchpad = '';
  if (m.scratchpad.length < 22) m.scratchpad += ch;
}

function error(m: SimState['mcdu'][number], text: string): void {
  m.message = text;
  m.msgAmber = false;
}

function lsk(s: SimState, side: 0 | 1, sideKey: 'L' | 'R', line: number): void {
  const m = s.mcdu[side];
  const sp = m.scratchpad.trim();
  const take = (): void => {
    m.scratchpad = '';
  };
  const fp = s.fplan;
  const a = s.afs;
  switch (m.page) {
    case 'MENU':
      if (sideKey === 'L' && line === 1) m.page = 'FPLN';
      if (sideKey === 'R' && line === 6) m.page = 'FPLN';
      return;
    case 'INIT':
      if (sideKey === 'R' && line === 1) {
        if (/^[A-Z]{4}\/[A-Z]{4}$/.test(sp)) {
          const [o, d] = sp.split('/');
          if (o !== AIRPORT.icao || d !== AIRPORT.icao) return error(m, 'NOT IN DATABASE');
          fp.origin = o;
          fp.destination = d;
          fp.waypoints = DEFAULT_ROUTE.map((w) => ({ ...w }));
          fp.activeLeg = 1;
          fp.initialized = true;
          take();
        } else if (!sp && !fp.initialized) {
          // 使用公司航路
          fp.waypoints = DEFAULT_ROUTE.map((w) => ({ ...w }));
          fp.activeLeg = 1;
          fp.initialized = true;
        } else return error(m, 'FORMAT ERROR');
      }
      if (sideKey === 'L' && line === 1 && (sp === 'XHAOXHAO01' || !sp)) {
        fp.waypoints = DEFAULT_ROUTE.map((w) => ({ ...w }));
        fp.activeLeg = 1;
        fp.initialized = true;
        take();
      }
      if (sideKey === 'L' && line === 3 && sp) {
        fp.flightNo = sp.slice(0, 8);
        take();
      }
      if (sideKey === 'L' && line === 5 && sp) {
        const v = Number(sp);
        if (!Number.isInteger(v) || v < 0 || v > 999) return error(m, 'ENTRY OUT OF RANGE');
        fp.costIndex = v;
        take();
      }
      if (sideKey === 'L' && line === 6 && sp) {
        const v = Number(sp.replace('FL', '').split('/')[0]);
        if (!Number.isFinite(v) || v < 50 || v > 398) return error(m, 'ENTRY OUT OF RANGE');
        fp.crzFl = Math.round(v);
        take();
      }
      if (sideKey === 'R' && line === 2) {
        for (const ir of s.adirs.ir)
          if (ir.mode === 'NAV' && !ir.aligned) ir.alignRemaining = Math.min(ir.alignRemaining, 2);
      }
      return;
    case 'FPLN':
    case 'AIRPORT': {
      if (line === 6) return;
      const start = Math.max(0, m.scroll + Math.max(0, fp.activeLeg - 1));
      const i = start + line - 1;
      const w = fp.waypoints[i];
      if (!w) return;
      if (sideKey === 'L') {
        if (sp === 'CLR') {
          if (i <= fp.activeLeg - 1 || w.kind === 'RWY') return error(m, 'NOT ALLOWED');
          fp.waypoints = fp.waypoints.filter((_, k) => k !== i);
          if (i < fp.activeLeg) fp.activeLeg--;
          take();
          return;
        }
        // 側向修訂 → DIR TO 此航點
        if (i >= fp.activeLeg) {
          fp.directToPending = w.ident;
          m.page = 'DIR';
        }
        return;
      }
      // 右側：速度/高度限制，格式 "250/6000"、"/6000"、"250"
      if (!sp) return;
      if (sp === 'CLR') {
        const nw: Waypoint = { ...w };
        delete nw.alt;
        delete nw.spd;
        fp.waypoints = fp.waypoints.map((x, k) => (k === i ? nw : x));
        take();
        return;
      }
      const [spdStr, altStr] = sp.includes('/') ? sp.split('/') : [sp, ''];
      const nw: Waypoint = { ...w };
      if (spdStr) {
        const v = Number(spdStr);
        if (!Number.isFinite(v) || v < 100 || v > 350) return error(m, 'ENTRY OUT OF RANGE');
        nw.spd = v;
      }
      if (altStr) {
        const type = altStr.startsWith('+')
          ? 'AT_OR_ABOVE'
          : altStr.startsWith('-')
            ? 'AT_OR_BELOW'
            : 'AT';
        const raw = altStr.replace(/^[+-]/, '').replace('FL', '');
        let v = Number(raw);
        if (altStr.includes('FL') || v < 1000) v *= 100;
        if (!Number.isFinite(v) || v < 0 || v > 39000) return error(m, 'ENTRY OUT OF RANGE');
        nw.alt = { type, ft: v };
      }
      fp.waypoints = fp.waypoints.map((x, k) => (k === i ? nw : x));
      take();
      return;
    }
    case 'DIR': {
      if (sideKey === 'L' && line === 1 && sp) {
        if (!fp.waypoints.some((w, k) => k >= fp.activeLeg && w.ident === sp))
          return error(m, 'NOT IN DATABASE');
        fp.directToPending = sp;
        take();
        return;
      }
      if (sideKey === 'L' && line >= 2 && line <= 5) {
        const w = fp.waypoints.slice(fp.activeLeg)[line - 2 + m.scroll];
        if (w) fp.directToPending = w.ident;
        return;
      }
      if (line === 6 && fp.directToPending) {
        if (sideKey === 'L') {
          fp.directToPending = null;
          return;
        }
        const idx = fp.waypoints.findIndex(
          (w, k) => k >= fp.activeLeg && w.ident === fp.directToPending,
        );
        if (idx < 0) return;
        const p = s.aircraft.position;
        const tp: Waypoint = { ident: 'T-P', x: p.x, z: p.z, kind: 'WPT' };
        fp.waypoints = [...fp.waypoints.slice(0, fp.activeLeg - 1), tp, ...fp.waypoints.slice(idx)];
        fp.directToPending = null;
        // DIR TO 會使 NAV 立即作用
        s.fcu.hdgManaged = true;
        if (!s.flight.onGround) {
          a.lateral = 'NAV';
          a.lateralArmed = null;
        }
        m.page = 'FPLN';
        m.scroll = 0;
      }
      return;
    }
    case 'PERF': {
      if (m.perfPage === 'TO' && sideKey === 'L' && sp) {
        const v = Number(sp);
        const set = (k: 'v1' | 'vr' | 'v2'): void => {
          if (!Number.isInteger(v) || v < 90 || v > 200) return error(m, 'ENTRY OUT OF RANGE');
          a[k] = v;
          take();
        };
        if (line === 1) set('v1');
        if (line === 2) set('vr');
        if (line === 3) set('v2');
        if (line === 4 && Number.isFinite(v)) {
          a.transAlt = v;
          take();
        }
        if (line === 5) {
          const [r, c] = sp.split('/').map(Number);
          if (r) a.thrRedAlt = r;
          if (c) a.accAlt = c;
          take();
        }
        return;
      }
      if (m.perfPage === 'TO' && sideKey === 'R' && line === 4 && sp) {
        const v = Number(sp);
        if (!Number.isInteger(v) || v < -40 || v > 75) return error(m, 'ENTRY OUT OF RANGE');
        a.flexTemp = v;
        take();
        return;
      }
      if (m.perfPage === 'APPR' && sideKey === 'L' && line === 5 && sp) {
        const v = Number(sp);
        if (!Number.isInteger(v) || v < 100 || v > 200) return error(m, 'ENTRY OUT OF RANGE');
        a.vapp = v;
        take();
        return;
      }
      if (m.perfPage === 'APPR' && sideKey === 'L' && line === 6) {
        if (a.phase === 'DESCENT' || a.phase === 'CRUISE' || a.phase === 'CLIMB')
          a.phase = 'APPROACH';
        return;
      }
      if (sideKey === 'R' && line === 6) mcduKey(s, side, 'NEXT');
      if (sideKey === 'L' && line === 6) mcduKey(s, side, 'PREV');
      return;
    }
    case 'RADNAV':
      if (line === 1 && sp) {
        const vor = NAVAIDS.find(
          (n) => n.kind === 'VOR' && (n.ident === sp || Math.abs(n.freq - Number(sp)) < 0.001),
        );
        if (sp === 'CLR') {
          if (sideKey === 'L') s.radio.vor1 = '';
          else s.radio.vor2 = '';
          take();
          return;
        }
        if (!vor) return error(m, 'NOT IN DATABASE');
        if (sideKey === 'L') s.radio.vor1 = vor.ident;
        else s.radio.vor2 = vor.ident;
        take();
        return;
      }
      if (sideKey === 'L' && line === 3 && sp) {
        const v = Number(sp);
        if (!Number.isFinite(v) || v < 108 || v > 111.95) return error(m, 'ENTRY OUT OF RANGE');
        s.ils.freq = Math.round(v * 100) / 100;
        take();
      }
      if (sideKey === 'L' && line === 4 && sp) {
        const v = Number(sp);
        if (!Number.isFinite(v) || v < 0 || v > 360) return error(m, 'ENTRY OUT OF RANGE');
        s.ils.course = Math.round(v) % 360;
        take();
      }
      return;
    case 'FUEL':
      if (sideKey === 'L' && line === 4 && sp) {
        const v = Number(sp);
        if (!Number.isFinite(v) || v < 35 || v > 64) return error(m, 'ENTRY OUT OF RANGE');
        fp.zfw = v;
        take();
      }
      return;
    default:
  }
}
