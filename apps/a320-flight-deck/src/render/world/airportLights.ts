/**
 * XHAO 助航燈光配置：跑道邊燈/頭燈/末端燈/中心線/TDZ、ALS（含 rabbit）、滑行道、PAPI、防撞燈。
 * 以 27 為主要落地方向（燈朝 +x）；09 方向另建反向燈。
 */
import { Vector3, type BufferGeometry } from 'three';
import { AIRPORT } from '../../sim/constants';
import { beam, box, light, LIGHT_COLORS as C, type LightDef } from './common';

const RW = AIRPORT.runway;
const HALF_W = RW.width / 2;
const TWY = AIRPORT.taxiwayZ;
const CONNECTORS = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((k) => k * 400);
export const APRON_LINKS = [-1200, -600, 0, 600];

export interface AirportLightSet {
  elevated: LightDef[];
  inset: LightDef[];
  rabbit: LightDef[];
  guards: LightDef[];
  papi: LightDef[];
  alsStructure: BufferGeometry[];
}

/** 中心線顏色：dist = 距跑道末端距離 */
function centerlineColor(dist: number, idx: number): readonly [number, number, number] {
  if (dist < 300) return C.red;
  if (dist < 900) return idx % 2 === 0 ? C.red : C.white;
  return C.white;
}

export function buildAirportLights(): AirportLightSet {
  const elevated: LightDef[] = [];
  const inset: LightDef[] = [];
  const rabbit: LightDef[] = [];
  const guards: LightDef[] = [];
  const papi: LightDef[] = [];
  const alsStructure: BufferGeometry[] = [];

  // 跑道邊燈（雙向：各自最後 600 m 為黃）
  for (let x = RW.thr09X; x <= RW.thr27X + 0.1; x += 60) {
    for (const z of [-HALF_W - 1.2, HALF_W + 1.2]) {
      elevated.push(light(x, 0.4, z, x < RW.thr09X + 600 ? C.yellow : C.white, 1, 0));
      elevated.push(light(x, 0.4, z, x > RW.thr27X - 600 ? C.yellow : C.white, -1, 0));
    }
  }
  // 跑道頭（綠，含翼排）與末端（紅）
  for (const [thrX, dir] of [
    [RW.thr27X, 1],
    [RW.thr09X, -1],
  ] as const) {
    for (let z = -HALF_W; z <= HALF_W + 0.01; z += 3) {
      elevated.push(light(thrX + dir * 1.5, 0.35, z, C.green, dir, 0, 1.2));
      elevated.push(light(thrX + dir * 1.5, 0.35, z, C.red, -dir, 0, 1.1));
    }
    for (let k = 1; k <= 5; k++) {
      for (const s of [-1, 1])
        elevated.push(
          light(thrX + dir * 1.5, 0.35, s * (HALF_W + 2 + k * 2.4), C.green, dir, 0, 1.2),
        );
    }
  }
  // 中心線（每 15 m，崁入式，雙向配色）
  let idx = 0;
  for (let x = RW.thr09X + 7.5; x < RW.thr27X; x += 15, idx++) {
    inset.push(light(x, 0.09, 0.6, centerlineColor(x - RW.thr09X, idx), 1, 0, 0.9));
    inset.push(light(x, 0.09, 0.6, centerlineColor(RW.thr27X - x, idx), -1, 0, 0.9));
  }
  // TDZ（27）
  for (let d = 60; d <= 900; d += 30) {
    for (const s of [-1, 1]) {
      for (const off of [9, 10.5, 12])
        inset.push(light(RW.thr27X - d, 0.09, s * off, C.white, 1, 0, 0.9));
    }
  }

  // ALS（27 進場端向東延伸 900 m）
  const crossbars: Record<number, number> = { 150: 6, 300: 15, 450: 11, 600: 9, 750: 7 };
  for (let d = 30; d <= 900; d += 30) {
    const x = RW.thr27X + d;
    const y = 1.3;
    for (let z = -2; z <= 2; z++) elevated.push(light(x, y, z, C.white, 1, 0, 1.1));
    let halfSpan = 2.5;
    const cb = crossbars[d];
    if (cb !== undefined) {
      halfSpan = cb;
      for (let z = 3.5; z <= cb; z += 1.5) {
        for (const s of [-1, 1]) elevated.push(light(x, y, s * z, C.white, 1, 0, 1.1));
      }
    }
    if (d <= 270) {
      halfSpan = Math.max(halfSpan, 9.5);
      for (const z of [6.5, 8, 9.5]) {
        for (const s of [-1, 1]) elevated.push(light(x, y, s * z, C.red, 1, 0, 1));
      }
    }
    // 支架：立柱 + 橫桿
    alsStructure.push(box(x, y / 2 - 0.1, 0, 0.22, y, 0.22));
    alsStructure.push(
      beam(new Vector3(x, y - 0.12, -halfSpan), new Vector3(x, y - 0.12, halfSpan), 0.12, 0.12),
    );
    if (halfSpan > 5) {
      for (const s of [-1, 1])
        alsStructure.push(box(x, y / 2 - 0.1, s * halfSpan * 0.7, 0.16, y, 0.16));
    }
    if (d >= 300) rabbit.push(light(x + 2, y + 0.4, 0, C.led, 1, 0, 0));
  }
  rabbit.reverse(); // 由遠而近排序

  // 滑行道 A：中心綠燈、邊藍燈（聯絡道開口處略過）
  const nearConnector = (x: number, gap: number, list: number[]): boolean =>
    list.some((c) => Math.abs(x - c) < gap);
  for (let x = RW.thr09X - 20; x <= RW.thr27X + 20; x += 30)
    inset.push(light(x, 0.09, TWY, C.green, 0, 0, 0.75));
  for (let x = RW.thr09X - 20; x <= RW.thr27X + 20; x += 60) {
    if (!nearConnector(x, 16, CONNECTORS))
      elevated.push(light(x, 0.35, TWY + 13.5, C.blue, 0, 0, 0.8));
    if (!nearConnector(x, 20, APRON_LINKS))
      elevated.push(light(x, 0.35, TWY - 13.5, C.blue, 0, 0, 0.8));
  }
  for (const cx of CONNECTORS) {
    for (let z = TWY + 15; z <= -24; z += 15)
      inset.push(
        light(
          cx,
          0.09,
          z,
          z > -90 ? (Math.round(z / 15) % 2 ? C.green : C.yellow) : C.green,
          0,
          0,
          0.75,
        ),
      );
    for (let z = TWY + 20; z <= -36; z += 30) {
      for (const s of [-1, 1]) elevated.push(light(cx + s * 12.5, 0.35, z, C.blue, 0, 0, 0.8));
    }
    // 跑道守衛燈（黃色交替閃爍）
    for (const s of [-1, 1]) guards.push(light(cx + s * 14, 0.8, -80, C.yellow, 0, 1, 1));
  }
  for (const ax of APRON_LINKS) {
    for (let z = TWY - 15; z >= -250; z -= 15) inset.push(light(ax, 0.09, z, C.green, 0, 0, 0.7));
    for (const s of [-1, 1]) {
      for (let z = TWY - 20; z >= -250; z -= 20)
        elevated.push(light(ax + s * 15.5, 0.35, z, C.blue, 0, 0, 0.8));
    }
  }
  // 停機坪南緣邊燈
  for (let x = -1500; x <= 900; x += 45) {
    if (!nearConnector(x, 20, APRON_LINKS)) elevated.push(light(x, 0.35, -250, C.blue, 0, 0, 0.7));
  }

  // PAPI（跑道左側 = 南側 +z，內側門檻最高）
  for (let i = 0; i < 4; i++)
    papi.push(light(AIRPORT.papi27.x, 0.9, AIRPORT.papi27.z + i * 9, C.white, 1, 0, 1.6));

  return { elevated, inset, rabbit, guards, papi, alsStructure };
}

/** PAPI 各燈門檻（度），索引 0 = 最內側 */
export const PAPI_THRESHOLDS = [3.5, 3 + 10 / 60, 2 + 50 / 60, 2.5];
