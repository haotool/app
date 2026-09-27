/**
 * FlightPlanManager + NavigationSystem + ILSSystem。
 * 航路（MCDU / ND / 自動駕駛共用同一份 fplan.waypoints）：航段排序（含轉彎預判）、XTK、剩餘距離、垂直下降剖面與 TOD。
 */
import { AIRPORT, DEG, FT, G, KT, NM } from '../constants';
import type { SimState, Waypoint } from '../types';

export const PATH_SLOPE_FT_PER_NM = 318; // 3°

export function bearing(dx: number, dz: number): number {
  return (Math.atan2(dx, -dz) / DEG + 360) % 360;
}

export function wrap180(d: number): number {
  return ((((d + 180) % 360) + 360) % 360) - 180;
}

function legDist(a: Waypoint, b: Waypoint): number {
  return Math.hypot(b.x - a.x, b.z - a.z) / NM;
}

/** 從 index i 的 waypoint 到終點的沿航路距離（nm） */
function remainingFrom(wps: Waypoint[], i: number): number {
  let d = 0;
  for (let k = i; k < wps.length - 1; k++) d += legDist(wps[k], wps[k + 1]);
  return d;
}

/** 下降剖面：沿航路剩餘距離 D（nm）處的剖面高度（ft），僅受 AT / AT_OR_BELOW 限制 */
export function profileAltitude(s: SimState, dRemaining: number): number {
  const wps = s.fplan.waypoints;
  let best = Infinity;
  for (let j = 0; j < wps.length; j++) {
    const alt = wps[j].alt;
    if (!alt || alt.type === 'AT_OR_ABOVE') continue;
    const dj = remainingFrom(wps, j);
    if (dj > dRemaining) continue;
    best = Math.min(best, alt.ft + (dRemaining - dj) * PATH_SLOPE_FT_PER_NM);
  }
  return best;
}

export function updateNavigation(s: SimState): void {
  const fp = s.fplan;
  const wps = fp.waypoints;
  const p = s.aircraft.position;
  if (wps.length < 2) {
    fp.distToDest = 0;
    fp.distToWpt = 0;
    fp.xtk = 0;
    fp.todDist = 0;
    return;
  }
  fp.activeLeg = Math.max(1, Math.min(fp.activeLeg, wps.length - 1));
  const from = wps[fp.activeLeg - 1];
  const to = wps[fp.activeLeg];
  const course = bearing(to.x - from.x, to.z - from.z);
  const dx = p.x - from.x;
  const dz = p.z - from.z;
  const cr = course * DEG;
  // 航段座標：沿航向 (sin, -cos)，右側 (cos, sin)
  const along = dx * Math.sin(cr) - dz * Math.cos(cr);
  const xtkM = dx * Math.cos(cr) + dz * Math.sin(cr);
  const legLen = Math.hypot(to.x - from.x, to.z - from.z);
  fp.xtk = xtkM / NM;
  fp.desiredTrack = course;
  fp.distToWpt = Math.hypot(to.x - p.x, to.z - p.z) / NM;

  // 航段排序：轉彎預判或已過 abeam
  if (fp.activeLeg < wps.length - 1 && !s.flight.onGround) {
    const next = wps[fp.activeLeg + 1];
    const nextCourse = bearing(next.x - to.x, next.z - to.z);
    const dPsi = Math.abs(wrap180(nextCourse - course)) * DEG;
    const v = Math.max(s.flight.gs * KT, 60);
    const radius = (v * v) / (G * Math.tan(25 * DEG));
    const anticipate = Math.min(radius * Math.tan(dPsi / 2), 8 * NM) / NM;
    if (fp.distToWpt < Math.max(anticipate, 0.25) || along > legLen) {
      fp.activeLeg++;
    }
  }
  fp.distToDest = fp.distToWpt + remainingFrom(wps, fp.activeLeg);
  // TOD：剖面到達巡航高度的點
  const crz = fp.crzFl * 100;
  let dTod = Infinity;
  for (let j = 0; j < wps.length; j++) {
    const alt = wps[j].alt;
    if (!alt || alt.type === 'AT_OR_ABOVE') continue;
    const dj = remainingFrom(wps, j);
    dTod = Math.min(dTod, dj + (crz - alt.ft) / PATH_SLOPE_FT_PER_NM);
  }
  fp.todDist = Number.isFinite(dTod) ? fp.distToDest - dTod : 0;
}

/** ILS 27：航向台偏差（dots，航道在右為正）、下滑道偏差（dots，下滑道在上為正） */
export function updateIls(s: SimState): void {
  const ils = s.ils;
  const cfg = AIRPORT.ils27;
  const p = s.aircraft.position;
  ils.tuned = ils.freq === cfg.freq;
  const dLoc = p.x - cfg.locX; // 東側為正（進場方向）
  const zOff = p.z - AIRPORT.runway.z;
  const angLoc = Math.atan2(zOff, dLoc) / DEG;
  const distNm = Math.hypot(dLoc, zOff) / NM;
  ils.locValid = ils.tuned && dLoc > 0 && Math.abs(angLoc) < 35 && distNm < 25 && powered(s);
  ils.locDev = ils.locValid ? Math.max(-2.5, Math.min(2.5, angLoc / 0.8)) : 0;
  const dGs = p.x - cfg.gsX;
  const h = p.y - 0.8; // 天線高度
  const angGs = Math.atan2(h, Math.max(dGs, 1)) / DEG;
  const gsDist = Math.hypot(dGs, p.z - cfg.gsZ) / NM;
  ils.gsValid =
    ils.tuned &&
    dGs > 0 &&
    gsDist < 18 &&
    angGs > 0.3 &&
    angGs < 9 &&
    Math.abs(angLoc) < 12 &&
    powered(s);
  ils.gsDev = ils.gsValid ? Math.max(-2.5, Math.min(2.5, (cfg.gsAngle - angGs) / 0.4)) : 0;
  ils.dme = ils.tuned ? gsDist : 0;
  ils.markerOuter = ils.locValid && Math.abs(dGs / NM - 4.5) < 0.25 && p.y < 900;
}

/** 下滑道高度（ft MSL）於目前位置 */
export function glidepathAltitude(s: SimState): number {
  const cfg = AIRPORT.ils27;
  const dGs = Math.max(0, s.aircraft.position.x - cfg.gsX);
  return (Math.tan(cfg.gsAngle * DEG) * dGs) / FT;
}

/** 跑道中心線橫向偏移（m，右為正，以 27 方向） */
export function runwayLateralOffset(s: SimState): number {
  return -(s.aircraft.position.z - AIRPORT.runway.z);
}

function powered(s: SimState): boolean {
  return s.elec.acBus1 || s.elec.acBus2;
}
