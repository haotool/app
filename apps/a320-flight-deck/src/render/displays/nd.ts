/**
 * ND：ARC / ROSE NAV / ROSE VOR / ROSE ILS / PLAN。航路、導航台、機場、約束、TOD、風與地速。
 * 世界座標 x=東、z=南 → 東 e = dx/1852，北 n = -dz/1852（NM）。
 */
import { AIRPORT, DEFAULT_ROUTE, NAVAIDS, NM, OTHER_AIRPORTS } from '../../sim/constants';
import type { SimState, Waypoint } from '../../sim/types';
import { C, type Ctx, angDiff, circle, clamp, fillRect, line, text, wrap360 } from './common';

const W = 768;
const DEG = Math.PI / 180;

interface Frame {
  cx: number;
  cy: number;
  ppn: number; // px/nm
  rot: number; // 地圖朝上方位（deg）；PLAN = 0
  ox: number; // 地圖中心（NM，東）
  oy: number; // 北
  arc: boolean;
}

const fr: Frame = { cx: 0, cy: 0, ppn: 1, rot: 0, ox: 0, oy: 0, arc: false };
const pt = { x: 0, y: 0 };

/** 世界座標 → 螢幕（寫入共用 pt，避免配置） */
function project(wx: number, wz: number): typeof pt {
  const e = wx / NM - fr.ox;
  const n = -wz / NM - fr.oy;
  const c = Math.cos(fr.rot * DEG);
  const s = Math.sin(fr.rot * DEG);
  pt.x = fr.cx + (e * c - n * s) * fr.ppn;
  pt.y = fr.cy - (e * s + n * c) * fr.ppn;
  return pt;
}

function bearing(fromX: number, fromZ: number, toX: number, toZ: number): number {
  return wrap360(Math.atan2(toX - fromX, -(toZ - fromZ)) / DEG);
}

export function drawNd(ctx: Ctx, s: SimState, side: 0 | 1): void {
  fillRect(ctx, 0, 0, W, W, C.bg);
  const ef = s.efis[side];
  const ir = s.adirs.ir[side];
  const f = s.flight;
  const ac = s.aircraft.position;
  const navOk = ir.aligned && ir.mode === 'NAV';
  const hdgOk = ir.aligned || ir.attAvail;
  const mode = ef.mode;
  const range = ef.range;

  if (mode === 'ARC') {
    Object.assign(fr, {
      cx: W / 2,
      cy: 640,
      ppn: 520 / range,
      rot: f.heading,
      ox: ac.x / NM,
      oy: -ac.z / NM,
      arc: true,
    });
  } else if (mode === 'PLAN') {
    const to = s.fplan.waypoints[s.fplan.activeLeg];
    const cxw = to ? to.x : ac.x;
    const czw = to ? to.z : ac.z;
    Object.assign(fr, {
      cx: W / 2,
      cy: 400,
      ppn: 280 / (range / 2),
      rot: 0,
      ox: cxw / NM,
      oy: -czw / NM,
      arc: false,
    });
  } else {
    Object.assign(fr, {
      cx: W / 2,
      cy: 400,
      ppn: 280 / (range / 2),
      rot: f.heading,
      ox: ac.x / NM,
      oy: -ac.z / NM,
      arc: false,
    });
  }

  drawHeader(ctx, s, navOk);

  if (!hdgOk) {
    text(ctx, 'HDG', W / 2, 200, C.red, 34, 'center', true);
  }
  if (!navOk) {
    if (ir.mode !== 'OFF' && !ir.aligned) {
      text(
        ctx,
        `IR IN ALIGN ${Math.ceil(ir.alignRemaining / 60)} MN`,
        W / 2,
        380,
        C.white,
        26,
        'center',
      );
    }
    text(ctx, 'MAP NOT AVAIL', W / 2, 430, C.red, 30, 'center', true);
    if (hdgOk && mode !== 'PLAN') drawCompass(ctx, s);
    return;
  }

  // 地圖內容裁切
  ctx.save();
  ctx.beginPath();
  if (fr.arc) {
    ctx.arc(fr.cx, fr.cy, 540, Math.PI, 0);
    ctx.lineTo(W, 720);
    ctx.lineTo(0, 720);
  } else {
    ctx.arc(fr.cx, fr.cy, 290, 0, Math.PI * 2);
  }
  ctx.clip();
  drawRangeRings(ctx, range);
  drawOptions(ctx, s, side);
  drawIlsCourse(ctx, s, mode === 'LS');
  drawRoute(ctx, s, side);
  drawTod(ctx, s);
  ctx.restore();

  if (mode === 'PLAN') drawPlanOverlay(ctx, s);
  else drawCompass(ctx, s);
  if (mode === 'LS') drawLsDeviation(ctx, s);
  if (mode === 'VOR') drawVorPointer(ctx, s, side);
  drawFooter(ctx, s, side);
}

function drawHeader(ctx: Ctx, s: SimState, navOk: boolean): void {
  const f = s.flight;
  text(ctx, 'GS', 14, 26, C.white, 20);
  text(ctx, String(Math.round(f.gs)), 54, 26, C.green, 26, 'left', true);
  text(ctx, 'TAS', 128, 26, C.white, 20);
  text(ctx, f.tas > 60 ? String(Math.round(f.tas)) : '---', 180, 26, C.green, 26, 'left', true);
  if (f.tas > 100 && navOk) {
    text(ctx, `${pad3(f.windDir)}/${Math.round(f.windSpeed)}`, 14, 58, C.green, 24);
    if (f.windSpeed > 2) {
      const a = (f.windDir + 180 - f.heading) * DEG;
      const x = 40;
      const y = 104;
      const dx = Math.sin(a) * 22;
      const dy = -Math.cos(a) * 22;
      line(ctx, x - dx, y - dy, x + dx, y + dy, C.green, 3);
      const hx = Math.sin(a + 2.6) * 10;
      const hy = -Math.cos(a + 2.6) * 10;
      const hx2 = Math.sin(a - 2.6) * 10;
      const hy2 = -Math.cos(a - 2.6) * 10;
      line(ctx, x + dx, y + dy, x + dx + hx, y + dy + hy, C.green, 3);
      line(ctx, x + dx, y + dy, x + dx + hx2, y + dy + hy2, C.green, 3);
    }
  }
  const fp = s.fplan;
  const to = fp.waypoints[fp.activeLeg];
  if (to && navOk) {
    const ac = s.aircraft.position;
    const dist = fp.distToWpt > 0 ? fp.distToWpt : Math.hypot(to.x - ac.x, to.z - ac.z) / NM;
    text(ctx, to.ident, W - 150, 26, C.white, 24, 'right');
    text(ctx, `${pad3(bearing(ac.x, ac.z, to.x, to.z))}°`, W - 14, 26, C.green, 24, 'right');
    text(ctx, dist.toFixed(dist < 20 ? 1 : 0), W - 60, 58, C.green, 26, 'right', true);
    text(ctx, 'NM', W - 14, 58, C.cyan, 20, 'right');
    if (f.gs > 30) {
      const eta = (s.weather.timeOfDay + dist / f.gs + 24) % 24;
      const hh = Math.floor(eta);
      const mm = Math.floor((eta - hh) * 60);
      text(
        ctx,
        `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
        W - 14,
        90,
        C.green,
        24,
        'right',
      );
    }
  }
}

function pad3(v: number): string {
  return String(Math.round(wrap360(v)) % 360).padStart(3, '0');
}

function drawRangeRings(ctx: Ctx, rng: number): void {
  ctx.setLineDash([6, 10]);
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1.5;
  if (fr.arc) {
    for (const k of [0.25, 0.5, 0.75]) {
      ctx.beginPath();
      ctx.arc(fr.cx, fr.cy, 520 * k, Math.PI * 1.18, Math.PI * 1.82);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.arc(fr.cx, fr.cy, 140, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  if (fr.arc) {
    text(
      ctx,
      String(rng / 2),
      fr.cx - 520 * 0.5 * Math.cos(0.56) - 8,
      fr.cy - 520 * 0.5 * Math.sin(0.56),
      C.cyan,
      20,
      'right',
    );
    text(
      ctx,
      String((rng * 3) / 4),
      fr.cx - 520 * 0.75 * Math.cos(0.56) - 8,
      fr.cy - 520 * 0.75 * Math.sin(0.56),
      C.cyan,
      20,
      'right',
    );
  } else {
    text(ctx, String(rng / 4), fr.cx - 110, fr.cy - 110, C.cyan, 20, 'right');
  }
}

function drawOptions(ctx: Ctx, s: SimState, side: 0 | 1): void {
  const ef = s.efis[side];
  // 起降機場跑道（永遠顯示）
  drawRunway(
    ctx,
    AIRPORT.runway.thr09X,
    AIRPORT.runway.thr27X,
    AIRPORT.runway.z,
    AIRPORT.icao,
    true,
  );
  if (ef.arpt) {
    for (const ap of OTHER_AIRPORTS) {
      const p = project(ap.x, ap.z);
      star(ctx, p.x, p.y, C.magenta);
      text(ctx, ap.icao, p.x + 14, p.y + 16, C.magenta, 20);
    }
  }
  if (ef.vord || ef.ndb) {
    for (const n of NAVAIDS) {
      if ((n.kind === 'VOR' && !ef.vord) || (n.kind === 'NDB' && !ef.ndb)) continue;
      const p = project(n.x, n.z);
      ctx.strokeStyle = C.magenta;
      ctx.lineWidth = 2.5;
      if (n.kind === 'VOR') {
        ctx.beginPath();
        ctx.moveTo(p.x - 10, p.y);
        ctx.lineTo(p.x + 10, p.y);
        ctx.moveTo(p.x, p.y - 10);
        ctx.lineTo(p.x, p.y + 10);
        ctx.stroke();
        circle(ctx, p.x, p.y, 13, C.magenta, 2);
      } else {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 12);
        ctx.lineTo(p.x + 11, p.y + 8);
        ctx.lineTo(p.x - 11, p.y + 8);
        ctx.closePath();
        ctx.stroke();
      }
      text(ctx, n.ident, p.x + 16, p.y + 16, C.magenta, 20);
    }
  }
  if (ef.wpt) {
    for (const w of DEFAULT_ROUTE) {
      if (w.kind === 'RWY' || s.fplan.waypoints.some((x) => x.ident === w.ident)) continue;
      const p = project(w.x, w.z);
      diamondSym(ctx, p.x, p.y, C.magenta, 8);
      text(ctx, w.ident, p.x + 14, p.y + 14, C.magenta, 18);
    }
  }
}

function drawRunway(
  ctx: Ctx,
  x0: number,
  x1: number,
  z: number,
  ident: string,
  label: boolean,
): void {
  const a = project(x0, z - 30);
  const ax = a.x;
  const ay = a.y;
  const b = project(x1, z - 30);
  const bx = b.x;
  const by = b.y;
  const c = project(x1, z + 30);
  const cx = c.x;
  const cy = c.y;
  const d = project(x0, z + 30);
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.stroke();
  if (label && fr.ppn > 4) text(ctx, `${ident}27`, cx + 12, cy + 14, C.white, 20);
}

function star(ctx: Ctx, x: number, y: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    ctx.moveTo(x - Math.cos(a) * 11, y - Math.sin(a) * 11);
    ctx.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11);
  }
  ctx.stroke();
}

function diamondSym(ctx: Ctx, x: number, y: number, color: string, r: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.stroke();
}

function drawRoute(ctx: Ctx, s: SimState, side: 0 | 1): void {
  const fp = s.fplan;
  const wps = fp.waypoints;
  if (wps.length === 0) return;
  const a = s.afs;
  const solid =
    a.lateral === 'NAV' ||
    a.lateralArmed === 'NAV' ||
    a.lateral === 'LOC' ||
    a.lateral === 'LOC*' ||
    a.lateral === 'RWY' ||
    a.lateral === null;
  const start = Math.max(0, fp.activeLeg - 1);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.setLineDash(solid ? [] : [14, 10]);
  ctx.beginPath();
  for (let i = start; i < wps.length; i++) {
    const p = project(wps[i].x, wps[i].z);
    if (i === start) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  const cstr = s.efis[side].cstr;
  for (let i = start; i < wps.length; i++) {
    const w = wps[i];
    const p = project(w.x, w.z);
    const isTo = i === fp.activeLeg;
    const col = isTo ? C.white : C.green;
    if (w.kind === 'RWY') continue;
    diamondSym(ctx, p.x, p.y, col, 9);
    text(ctx, w.ident, p.x + 16, p.y - 12, col, 21);
    if (cstr && w.alt) {
      circle(ctx, p.x, p.y, 17, C.magenta, 2);
      text(ctx, altText(w.alt), p.x + 16, p.y + 12, C.magenta, 18);
    }
  }
}

function altText(alt: NonNullable<Waypoint['alt']>): string {
  const v = alt.ft >= 10000 ? `FL${Math.round(alt.ft / 100)}` : String(alt.ft);
  return alt.type === 'AT_OR_ABOVE' ? `+${v}` : alt.type === 'AT_OR_BELOW' ? `-${v}` : v;
}

/** 沿航路從飛機位置走 todDist NM 找 TOD 點 */
function drawTod(ctx: Ctx, s: SimState): void {
  const fp = s.fplan;
  if (fp.todDist <= 0 || fp.waypoints.length === 0) return;
  let px = s.aircraft.position.x;
  let pz = s.aircraft.position.z;
  let remain = fp.todDist * NM;
  for (let i = fp.activeLeg; i < fp.waypoints.length; i++) {
    const w = fp.waypoints[i];
    const d = Math.hypot(w.x - px, w.z - pz);
    if (d >= remain) {
      const t = remain / Math.max(d, 1);
      const p = project(px + (w.x - px) * t, pz + (w.z - pz) * t);
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 13, Math.PI * 0.9, Math.PI * 2.1);
      ctx.moveTo(p.x - 12, p.y - 4);
      ctx.lineTo(p.x + 10, p.y + 12);
      ctx.lineTo(p.x + 10, p.y + 2);
      ctx.moveTo(p.x + 10, p.y + 12);
      ctx.lineTo(p.x, p.y + 12);
      ctx.stroke();
      return;
    }
    remain -= d;
    px = w.x;
    pz = w.z;
  }
}

function drawIlsCourse(ctx: Ctx, s: SimState, lsMode: boolean): void {
  const ils = s.ils;
  const a = s.afs;
  if (
    !ils.tuned ||
    !(lsMode || a.apprArmed || a.locArmed || a.lateral === 'LOC' || a.lateral === 'LOC*')
  )
    return;
  const thr = AIRPORT.runway.thr27X;
  const p0 = project(thr, 0);
  const x0 = p0.x;
  const y0 = p0.y;
  const p1 = project(thr + 18 * NM, 0);
  ctx.strokeStyle = C.magenta;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([16, 10]);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCompass(ctx: Ctx, s: SimState): void {
  const f = s.flight;
  const R = fr.arc ? 520 : 280;
  const hdg = f.heading;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (fr.arc) ctx.arc(fr.cx, fr.cy, R, (-90 - 50) * DEG, (-90 + 50) * DEG);
  else ctx.arc(fr.cx, fr.cy, R, 0, Math.PI * 2);
  ctx.stroke();
  for (let d = 0; d < 360; d += 5) {
    const rel = angDiff(d, hdg);
    if (fr.arc && Math.abs(rel) > 50) continue;
    const a = (rel - 90) * DEG;
    const big = d % 10 === 0;
    const len = big ? 18 : 10;
    line(
      ctx,
      fr.cx + Math.cos(a) * R,
      fr.cy + Math.sin(a) * R,
      fr.cx + Math.cos(a) * (R + len),
      fr.cy + Math.sin(a) * (R + len),
      C.white,
      2,
    );
    if (d % 30 === 0) {
      const tx = fr.cx + Math.cos(a) * (R + 34);
      const ty = fr.cy + Math.sin(a) * (R + 34);
      text(ctx, String(d / 10), tx, ty, C.white, d % 90 === 0 ? 26 : 22, 'center');
    }
  }
  // 選定航向
  if (!s.fcu.hdgManaged || s.fcu.hdgPreset) {
    const rel = angDiff(s.fcu.hdg, hdg);
    if (!fr.arc || Math.abs(rel) <= 50) {
      const a = (rel - 90) * DEG;
      ctx.save();
      ctx.translate(fr.cx + Math.cos(a) * R, fr.cy + Math.sin(a) * R);
      ctx.rotate(a + Math.PI / 2);
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10, -18);
      ctx.lineTo(10, -18);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    } else {
      text(ctx, pad3(s.fcu.hdg), rel < 0 ? 60 : W - 60, 150, C.cyan, 24, 'center');
    }
  }
  // 航跡菱形
  const trel = angDiff(f.track, hdg);
  const ta = (trel - 90) * DEG;
  const tx = fr.cx + Math.cos(ta) * (R - 12);
  const ty = fr.cy + Math.sin(ta) * (R - 12);
  diamondSym(ctx, tx, ty, C.green, 9);
  // 上方黃色基準線
  line(ctx, fr.cx, fr.cy - R - 24, fr.cx, fr.cy - R + 6, C.yellow, 4);
  // 飛機符號
  const cy = fr.cy;
  ctx.strokeStyle = C.yellow;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(fr.cx, cy - 26);
  ctx.lineTo(fr.cx, cy + 24);
  ctx.moveTo(fr.cx - 26, cy - 6);
  ctx.lineTo(fr.cx + 26, cy - 6);
  ctx.moveTo(fr.cx - 11, cy + 18);
  ctx.lineTo(fr.cx + 11, cy + 18);
  ctx.stroke();
}

function drawPlanOverlay(ctx: Ctx, s: SimState): void {
  circle(ctx, fr.cx, fr.cy, 280, C.white, 2.5);
  for (const [lbl, dx, dy] of [
    ['N', 0, -1],
    ['E', 1, 0],
    ['S', 0, 1],
    ['W', -1, 0],
  ] as const) {
    text(ctx, lbl, fr.cx + dx * 304, fr.cy + dy * 304, C.white, 26, 'center', true);
  }
  // 飛機於實際位置
  const ac = s.aircraft.position;
  const p = project(ac.x, ac.z);
  if (Math.hypot(p.x - fr.cx, p.y - fr.cy) < 290) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(s.flight.heading * DEG);
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 18);
    ctx.moveTo(-20, -4);
    ctx.lineTo(20, -4);
    ctx.moveTo(-8, 14);
    ctx.lineTo(8, 14);
    ctx.stroke();
    ctx.restore();
  }
}

function drawLsDeviation(ctx: Ctx, s: SimState): void {
  const ils = s.ils;
  if (!ils.tuned) return;
  const rel = angDiff(ils.course, s.flight.heading);
  ctx.save();
  ctx.translate(fr.cx, fr.cy);
  ctx.rotate(rel * DEG);
  const dot = 58;
  for (const k of [-2, -1, 1, 2]) circle(ctx, k * dot, 0, 6, C.white, 2);
  ctx.strokeStyle = C.magenta;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -270);
  ctx.lineTo(0, -130);
  ctx.moveTo(-18, -250);
  ctx.lineTo(0, -270);
  ctx.lineTo(18, -250);
  ctx.moveTo(0, 130);
  ctx.lineTo(0, 270);
  ctx.stroke();
  if (ils.locValid) {
    const x = clamp(ils.locDev, -2.3, 2.3) * dot;
    line(ctx, x, -110, x, 110, C.magenta, 5);
  }
  ctx.restore();
  // G/S 刻度
  const gx = W - 36;
  for (const k of [-2, -1, 1, 2]) circle(ctx, gx, fr.cy + k * 44, 6, C.white, 2);
  line(ctx, gx - 14, fr.cy, gx + 14, fr.cy, C.yellow, 3);
  if (ils.gsValid) diamondSym(ctx, gx, fr.cy - clamp(ils.gsDev, -2.3, 2.3) * 44, C.magenta, 11);
}

function drawVorPointer(ctx: Ctx, s: SimState, side: 0 | 1): void {
  const ident = side === 0 ? s.radio.vor1 : s.radio.vor2;
  const label = side === 0 ? 'VOR1' : 'VOR2';
  const vor = NAVAIDS.find((n) => n.kind === 'VOR' && n.ident === ident);
  if (!vor) {
    text(ctx, label, 18, 660, C.white, 22);
    text(ctx, '---', 18, 690, C.white, 22);
    return;
  }
  const ac = s.aircraft.position;
  const brg = bearing(ac.x, ac.z, vor.x, vor.z);
  const rel = angDiff(brg, s.flight.heading);
  ctx.save();
  ctx.translate(fr.cx, fr.cy);
  ctx.rotate(rel * DEG);
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -260);
  ctx.lineTo(0, -60);
  ctx.moveTo(-14, -236);
  ctx.lineTo(0, -260);
  ctx.lineTo(14, -236);
  ctx.moveTo(0, 60);
  ctx.lineTo(0, 260);
  ctx.stroke();
  ctx.restore();
  const dme = Math.hypot(vor.x - ac.x, vor.z - ac.z) / NM;
  text(ctx, label, 18, 660, C.white, 22);
  text(ctx, vor.ident, 18, 690, C.white, 22);
  text(ctx, `${dme.toFixed(1)} NM`, 18, 720, C.green, 22);
  text(ctx, `${label} ${vor.freq.toFixed(2)}`, W - 18, 30, C.white, 22, 'right');
}

function drawFooter(ctx: Ctx, s: SimState, side: 0 | 1): void {
  const ef = s.efis[side];
  if (ef.mode === 'LS' && s.ils.tuned) {
    text(ctx, `ILS${side + 1} ${s.ils.freq.toFixed(2)}`, W - 18, 668, C.magenta, 22, 'right');
    text(ctx, `CRS ${pad3(s.ils.course)}°`, W - 18, 696, C.magenta, 22, 'right');
    text(ctx, s.ils.ident, W - 18, 724, C.magenta, 22, 'right');
  }
  if (
    ef.mode !== 'PLAN' &&
    ef.mode !== 'LS' &&
    ef.mode !== 'VOR' &&
    s.ils.tuned &&
    (s.afs.apprArmed || s.afs.lateral === 'LOC')
  ) {
    text(ctx, `${s.ils.ident} ${s.ils.freq.toFixed(2)}`, W - 18, 724, C.magenta, 22, 'right');
  }
}
