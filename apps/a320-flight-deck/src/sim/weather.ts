/**
 * WeatherManager：風場（隨高度）、陣風、亂流（濾波雜訊，作用於空氣動力）、雲團（渲染與進雲判定共用）、結冰、閃電。
 */
import { FT, KT } from './constants';
import type { SimEvent, SimState, WeatherState } from './types';

export interface CloudPuff {
  dx: number;
  dy: number;
  dz: number;
  r: number;
}

export interface CloudCluster {
  x: number;
  z: number;
  baseM: number;
  topM: number;
  radius: number;
  puffs: CloudPuff[];
}

export interface CloudField {
  key: string;
  clusters: CloudCluster[];
  /** 連續雲層（覆蓋率 ≥ 0.85 時） */
  layer: { baseM: number; topM: number } | null;
  grid: Map<string, CloudCluster[]>;
}

const CELL = 4000;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cached: CloudField | null = null;

/** 依天氣產生（並快取）雲團；渲染端與物理端呼叫得到同一份資料 */
export function getCloudField(w: WeatherState): CloudField {
  const key = `${w.seed}|${w.cloudCover.toFixed(2)}|${w.cloudBase}|${w.cloudTop}`;
  if (cached?.key === key) return cached;
  const rand = mulberry32(w.seed * 7919 + Math.round(w.cloudCover * 1000));
  const baseM = w.cloudBase * FT;
  const topM = Math.max(baseM + 200, w.cloudTop * FT);
  const count = Math.round(Math.min(1, w.cloudCover) * 260);
  const clusters: CloudCluster[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand() * 2 - 1) * 56000;
    const z = (rand() * 2 - 1) * 56000;
    const radius = 500 + rand() * 1600;
    const thickness = Math.min(topM - baseM, 300 + rand() * 1400);
    const puffs: CloudPuff[] = [];
    const n = 6 + Math.floor(rand() * 10);
    for (let k = 0; k < n; k++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * radius * 0.75;
      const r = radius * (0.35 + rand() * 0.4);
      puffs.push({ dx: Math.cos(a) * d, dz: Math.sin(a) * d, dy: rand() * thickness * 0.8, r });
    }
    clusters.push({ x, z, baseM: baseM + rand() * 150, topM: baseM + thickness, radius, puffs });
  }
  const grid = new Map<string, CloudCluster[]>();
  for (const c of clusters) {
    const span = Math.ceil(c.radius / CELL);
    const cx = Math.floor(c.x / CELL);
    const cz = Math.floor(c.z / CELL);
    for (let i = -span; i <= span; i++) {
      for (let j = -span; j <= span; j++) {
        const k = `${cx + i},${cz + j}`;
        const list = grid.get(k);
        if (list) list.push(c);
        else grid.set(k, [c]);
      }
    }
  }
  cached = { key, clusters, layer: w.cloudCover >= 0.85 ? { baseM, topM } : null, grid };
  return cached;
}

/** 位置處雲密度 0..1 */
export function cloudDensityAt(w: WeatherState, x: number, y: number, z: number): number {
  const f = getCloudField(w);
  let d = 0;
  if (f.layer && y > f.layer.baseM && y < f.layer.topM) {
    const edge = Math.min(y - f.layer.baseM, f.layer.topM - y);
    d = Math.min(1, edge / 120);
  }
  const list = f.grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`);
  if (list) {
    for (const c of list) {
      if (y < c.baseM - 50 || y > c.topM + 150) continue;
      for (const p of c.puffs) {
        const dx = x - (c.x + p.dx);
        const dy = y - (c.baseM + p.dy);
        const dz = z - (c.z + p.dz);
        const dist = Math.sqrt(dx * dx + dy * dy * 2.2 + dz * dz);
        if (dist < p.r) d = Math.max(d, 1 - dist / p.r);
      }
    }
  }
  return d;
}

/** 世界風速向量（m/s，指向風吹往的方向），隨高度由地面風過渡到高空風 */
export function windVector(
  w: WeatherState,
  altM: number,
  out: { x: number; z: number },
): { x: number; z: number } {
  const t = Math.min(1, Math.max(0, altM / 3000));
  const shear = altM < 300 ? Math.pow(Math.max(altM, 2) / 300, 0.16) : 1; // 近地面邊界層
  const dirFrom = lerpAngle(w.windDir, w.windAloftDir, t);
  const spd = (w.windSpeed + (w.windAloftSpeed - w.windSpeed) * t) * shear * KT;
  const toRad = ((dirFrom + 180) % 360) * (Math.PI / 180);
  out.x = Math.sin(toRad) * spd;
  out.z = -Math.cos(toRad) * spd;
  return out;
}

function lerpAngle(a: number, b: number, t: number): number {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
}

/** 一階濾波的亂流/陣風狀態（Dryden 近似），值為 m/s 擾動與角速度擾動 */
export interface TurbulenceState {
  u: number;
  v: number;
  w: number;
  p: number;
  gustPhase: number;
}

export function createTurbulence(): TurbulenceState {
  return { u: 0, v: 0, w: 0, p: 0, gustPhase: 0 };
}

let noiseSeed = 1234567;
function gaussian(): number {
  // xorshift + Box-Muller（確定性，便於重現）
  noiseSeed ^= noiseSeed << 13;
  noiseSeed ^= noiseSeed >>> 17;
  noiseSeed ^= noiseSeed << 5;
  const u1 = ((noiseSeed >>> 0) % 1_000_000) / 1_000_000 + 1e-6;
  noiseSeed ^= noiseSeed << 13;
  noiseSeed ^= noiseSeed >>> 17;
  noiseSeed ^= noiseSeed << 5;
  const u2 = ((noiseSeed >>> 0) % 1_000_000) / 1_000_000;
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function stepTurbulence(t: TurbulenceState, s: SimState, dt: number, tasMs: number): void {
  const w = s.weather;
  const inCloud = w.cloudDensityAtAircraft;
  const altM = s.aircraft.position.y;
  const lowLevel = altM < 600 ? 0.6 + (w.windSpeed / 30) * 0.8 : 0.4;
  const sigma = (w.turbulence * 2.6 + inCloud * 1.2 * w.cloudCover) * lowLevel + w.gust * 0.05;
  const L = 300;
  const tau = L / Math.max(tasMs, 20);
  const a = Math.exp(-dt / tau);
  const b = Math.sqrt(1 - a * a) * sigma;
  t.u = a * t.u + b * gaussian();
  t.v = a * t.v + b * gaussian();
  t.w = a * t.w + b * gaussian() * 1.3;
  t.p = a * t.p + b * gaussian() * 0.006;
  t.gustPhase += dt;
}

/** 每物理步更新：進雲、結冰、閃電；觸發事件 */
export function updateWeather(s: SimState, dt: number, emit: (e: SimEvent) => void): void {
  const w = s.weather;
  const p = s.aircraft.position;
  const d = cloudDensityAt(w, p.x, p.y, p.z);
  const wasIn = w.inCloud;
  w.cloudDensityAtAircraft = d;
  w.inCloud = d > 0.25;
  if (w.inCloud && !wasIn) emit({ type: 'CLOUD_ENTRY' });
  if (!w.inCloud && wasIn) emit({ type: 'CLOUD_EXIT' });
  const oat = s.flight.oat;
  w.icing = (w.inCloud || w.precipitation > 0.3) && oat < 3 && oat > -30;
  if (w.precipitation > 0.6 && w.cloudCover > 0.9) {
    w.lightning = Math.max(0, w.lightning - dt * 4);
    if (Math.random() < dt * 0.04) w.lightning = 1;
  } else {
    w.lightning = 0;
  }
}
