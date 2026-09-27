/**
 * 程序地形高度場：物理（無線電高度、輪胎接觸）與地形網格共用同一函式，確保視覺與碰撞一致。
 * 北側山脈、西側丘陵、南側海岸、東南城市平原；機場範圍精確壓平為 0 m。
 */
import { AIRPORT, WORLD } from './constants';

function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

export function fbm(x: number, z: number, octaves: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, z * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

function ridged(x: number, z: number, octaves: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(valueNoise(x * freq, z * freq) * 2 - 1);
    sum += amp * n * n;
    freq *= 2.1;
    amp *= 0.5;
  }
  return sum;
}

const smooth = (e0: number, e1: number, v: number): number => {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** 海岸線 z（大於此值為海） */
export function coastlineZ(x: number): number {
  return (
    7200 +
    2600 * Math.sin(x / 9000 + 0.6) +
    900 * Math.sin(x / 2300) +
    (fbm(x / 4000, 3.7, 3) - 0.5) * 1800
  );
}

/** 城市中心（東南平原） */
export const CITY = { x: 11000, z: 3600, radius: 7000 };

/** 原始地形高度（m），可能低於海平面 */
export function terrainHeight(x: number, z: number, octaves = 6): number {
  // 起伏平原
  let h = 6 + fbm(x / 2600, z / 2600, Math.min(octaves, 5)) * 55 - 18;

  // 北側山脈（z 越往北越高）
  const north = smooth(-9000, -24000, z);
  if (north > 0) {
    h += north * ridged(x / 9000 + 11.3, z / 9000 - 4.1, Math.max(3, octaves)) * 2200;
  }
  // 西側丘陵
  const west = smooth(-15000, -32000, x) * (1 - smooth(4000, 9000, z));
  if (west > 0) h += west * fbm(x / 5000 + 3.1, z / 5000, 4) * 900;

  // 城市平原壓平
  const dc = Math.hypot(x - CITY.x, z - CITY.z);
  const city = 1 - smooth(CITY.radius * 0.6, CITY.radius * 1.2, dc);
  h = h * (1 - city) + (8 + fbm(x / 3000, z / 3000, 2) * 10) * city;

  // 海岸：往南下沉
  const cz = coastlineZ(x);
  const sea = smooth(cz - 400, cz + 900, z);
  h = h * (1 - sea) + (-4 - 40 * smooth(cz, cz + 6000, z)) * sea;
  if (sea < 1 && sea > 0) h = Math.max(h, 1.2 * (1 - sea) - 3 * sea); // 沙灘

  // 機場壓平（含進場走廊）
  const ax = Math.abs(x);
  const az = Math.abs(z);
  const fx = smooth(AIRPORT.flattenHalfX + 1400, AIRPORT.flattenHalfX, ax);
  const fz = smooth(AIRPORT.flattenHalfZ + 1400, AIRPORT.flattenHalfZ, az);
  if (ax <= AIRPORT.flattenHalfX && az <= AIRPORT.flattenHalfZ) return 0;
  h *= 1 - fx * fz;
  const corridor = smooth(1500, 700, az) * smooth(40000, 30000, ax);
  return h * (1 - corridor) + Math.min(h, 12) * corridor;
}

/** 物理地表（海面視為地面） */
export function groundHeight(x: number, z: number): number {
  return Math.max(terrainHeight(x, z, 4), WORLD.seaLevelY);
}

export type SurfaceType = 'runway' | 'taxiway' | 'grass' | 'water';

/** 地面材質（摩擦與滾動噪音） */
export function surfaceType(x: number, z: number): SurfaceType {
  const rw = AIRPORT.runway;
  if (Math.abs(z - rw.z) <= rw.width / 2 + 7.5 && x >= rw.thr09X - 60 && x <= rw.thr27X + 60)
    return 'runway';
  if (Math.abs(z - AIRPORT.taxiwayZ) < 20 && Math.abs(x) < rw.length / 2 + 60) return 'taxiway';
  const ap = AIRPORT.apron;
  if (x > ap.xMin && x < ap.xMax && z > ap.zMin && z < ap.zMax) return 'taxiway';
  // 聯絡道（每 400 m）
  if (z < 0 && z > AIRPORT.taxiwayZ && Math.abs(x) < rw.length / 2 + 60) {
    const k = Math.round(x / 400) * 400;
    if (Math.abs(x - k) < 20) return 'taxiway';
  }
  if (terrainHeight(x, z, 3) < WORLD.seaLevelY) return 'water';
  return 'grass';
}
