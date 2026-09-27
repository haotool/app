/**
 * 外部機體程序幾何：參數化機身曲面、翼型放樣、以 Z 軸為對稱軸的 Lathe。
 */
import { BufferGeometry, Float32BufferAttribute, LatheGeometry, Vector2, Vector3 } from 'three';
import { AIRCRAFT } from '../../sim/constants';

const W = AIRCRAFT.fuselageRadius;
const H = AIRCRAFT.fuselageHeight / 2;
/** 機身前段與主段分界（座艙視角時隱藏前段） */
export const FWD_SPLIT_Z = -12.3;
const TAIL_START = 8.0;
const LEN = AIRCRAFT.tailZ - AIRCRAFT.noseZ;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

interface Section {
  w: number;
  ymid: number;
  ht: number;
  hb: number;
}
const sec: Section = { w: 0, ymid: 0, ht: 0, hb: 0 };

function section(z: number): Section {
  if (z < FWD_SPLIT_Z) {
    const s = 1 - clamp01((z - AIRCRAFT.noseZ) / (FWD_SPLIT_Z - AIRCRAFT.noseZ));
    sec.w = W * Math.pow(1 - Math.pow(s, 2.1), 1 / 2.1);
    sec.hb = H * Math.pow(1 - Math.pow(s, 2.3), 1 / 2.3);
    sec.ht = H * Math.pow(1 - Math.pow(s, 1.55), 1 / 1.55);
    sec.ymid = -0.42 * Math.pow(s, 1.8);
  } else if (z <= TAIL_START) {
    sec.w = W;
    sec.ht = H;
    sec.hb = H;
    sec.ymid = 0;
  } else {
    const t = clamp01((z - TAIL_START) / (AIRCRAFT.tailZ - TAIL_START));
    const yt = H - (H - 1.25) * Math.pow(t, 1.6);
    const sm = t * t * (3 - 2 * t);
    const yb = -H + (H + 0.65) * Math.pow(sm, 1.05);
    sec.w = W * (1 - 0.86 * Math.pow(t, 1.5));
    sec.ymid = (yt + yb) / 2;
    sec.ht = (yt - yb) / 2;
    sec.hb = sec.ht;
  }
  return sec;
}

/** 機身表面點（θ：0 = 右側中線、π/2 = 機頂） */
export function fuselagePoint(z: number, theta: number, out: Vector3): Vector3 {
  const s = section(z);
  const sn = Math.sin(theta);
  return out.set(s.w * Math.cos(theta), s.ymid + (sn >= 0 ? s.ht : s.hb) * sn, z);
}

const _a = new Vector3();
const _b = new Vector3();
const _c = new Vector3();
const _d = new Vector3();

export function fuselageNormal(z: number, theta: number, out: Vector3): Vector3 {
  const e = 0.002;
  fuselagePoint(z, theta - e, _a);
  fuselagePoint(z, theta + e, _b);
  fuselagePoint(z - e, theta, _c);
  fuselagePoint(z + e, theta, _d);
  _b.sub(_a);
  _d.sub(_c);
  out.crossVectors(_b, _d);
  if (out.lengthSq() < 1e-14) return out.set(0, 0, z < 0 ? -1 : 1);
  return out.normalize();
}

/** 機身殼（z 範圍內），含 UV 供塗裝 */
export function fuselageShell(zs: number[], radial = 72): BufferGeometry {
  const pos: number[] = [];
  const nrm: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const p = new Vector3();
  const n = new Vector3();
  for (const z of zs) {
    for (let j = 0; j <= radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      fuselagePoint(z, th, p);
      fuselageNormal(z, th, n);
      pos.push(p.x, p.y, p.z);
      nrm.push(n.x, n.y, n.z);
      uv.push((z - AIRCRAFT.noseZ) / LEN, j / radial);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < zs.length - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * row + j;
      const b = a + 1;
      const c = b + row;
      const d = a + row;
      idx.push(a, b, c, a, c, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** 機身表面四角參數區塊（窗戶等），稍微外推避免 z-fighting */
export function fuselagePatch(
  z0: number,
  z1: number,
  th00: number,
  th01: number,
  th10: number,
  th11: number,
  offset = 0.012,
  nz = 6,
  nt = 6,
): BufferGeometry {
  const pos: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  const p = new Vector3();
  const n = new Vector3();
  for (let i = 0; i <= nz; i++) {
    const u = i / nz;
    const z = z0 + (z1 - z0) * u;
    const ta = th00 + (th10 - th00) * u;
    const tb = th01 + (th11 - th01) * u;
    for (let j = 0; j <= nt; j++) {
      const th = ta + (tb - ta) * (j / nt);
      fuselagePoint(z, th, p);
      fuselageNormal(z, th, n);
      p.addScaledVector(n, offset);
      pos.push(p.x, p.y, p.z);
      nrm.push(n.x, n.y, n.z);
    }
  }
  const row = nt + 1;
  for (let i = 0; i < nz; i++) {
    for (let j = 0; j < nt; j++) {
      const a = i * row + j;
      const b = a + 1;
      const c = b + row;
      const d = a + row;
      idx.push(a, b, c, a, c, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  return g;
}

/** 等比取樣機身環位置 */
export function ringStations(z0: number, z1: number, step: number, densifyStart = false): number[] {
  const out: number[] = [];
  const n = Math.max(2, Math.ceil((z1 - z0) / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push(z0 + (z1 - z0) * (densifyStart ? Math.pow(t, 1.7) : t));
  }
  return out;
}

// ---------------------------------------------------------------------------
// 翼型放樣
// ---------------------------------------------------------------------------
export interface LoftStation {
  le: Vector3;
  chord: number;
  tc: number;
  /** 此截面的上表面方向（預設用 loftWing 的 thickDir；翼尖小翼彎曲時逐截面指定） */
  thick?: Vector3;
}

/** 超臨界風格翼型：上表面較平、後段 camber；symmetric=true 時為對稱翼型（尾翼） */
function airfoil(c: number, tc: number, upper: boolean, symmetric: boolean): number {
  const t =
    5 *
    tc *
    (0.2969 * Math.sqrt(c) -
      0.126 * c -
      0.3516 * c * c +
      0.2843 * c * c * c -
      0.1036 * c * c * c * c);
  if (symmetric) return upper ? t : -t;
  const camber = tc * 0.22 * Math.sin(Math.PI * Math.pow(c, 1.3)) * Math.pow(c, 0.6);
  return upper ? camber + t * 1.02 : camber - t * 0.92;
}

/**
 * 以弦長分數 c0..c1 放樣翼段（封閉，含端蓋）。
 * chordDir：前緣→後緣；thickDir：上表面方向；pivot 若提供則平移幾何使 pivot 為原點。
 */
export function loftWing(
  stations: LoftStation[],
  chordDir: Vector3,
  thickDir: Vector3,
  c0: number,
  c1: number,
  opts: {
    samples?: number;
    symmetric?: boolean;
    pivot?: Vector3;
    planarUv?: (p: Vector3) => [number, number];
  } = {},
): BufferGeometry {
  const m = opts.samples ?? 12;
  const sym = opts.symmetric ?? false;
  const cs: number[] = [];
  for (let k = 0; k < m; k++) {
    const t = k / (m - 1);
    cs.push(c0 + (c1 - c0) * (0.5 - 0.5 * Math.cos(Math.PI * t)));
  }
  const ringLen = m * 2;
  const pos: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const p = new Vector3();
  const pushP = (v: Vector3): number => {
    pos.push(v.x, v.y, v.z);
    const uv = opts.planarUv ? opts.planarUv(v) : [0, 0];
    uvs.push(uv[0], uv[1]);
    return pos.length / 3 - 1;
  };
  const point = (st: LoftStation, c: number, upper: boolean): Vector3 =>
    p
      .copy(st.le)
      .addScaledVector(chordDir, c * st.chord)
      .addScaledVector(st.thick ?? thickDir, airfoil(c, st.tc, upper, sym) * st.chord);

  for (const st of stations) {
    for (let k = 0; k < m; k++) pushP(point(st, cs[k], true));
    for (let k = m - 1; k >= 0; k--) pushP(point(st, cs[k], false));
  }
  for (let i = 0; i < stations.length - 1; i++) {
    for (let k = 0; k < ringLen; k++) {
      const a = i * ringLen + k;
      const b = i * ringLen + ((k + 1) % ringLen);
      const c = b + ringLen;
      const d = a + ringLen;
      idx.push(a, b, c, a, c, d);
    }
  }
  // 端蓋（獨立頂點以保持銳利法線）
  const capStart = idx.length;
  for (const si of [0, stations.length - 1]) {
    const st = stations[si];
    const center = new Vector3();
    const ring: number[] = [];
    for (let k = 0; k < m; k++) ring.push(pushP(point(st, cs[k], true)));
    for (let k = m - 1; k >= 0; k--) ring.push(pushP(point(st, cs[k], false)));
    for (const r of ring) center.add(new Vector3(pos[r * 3], pos[r * 3 + 1], pos[r * 3 + 2]));
    center.divideScalar(ring.length);
    const ci = pushP(center);
    const span = new Vector3().subVectors(stations[stations.length - 1].le, stations[0].le);
    const want = si === 0 ? span.clone().negate() : span;
    const tri: number[] = [];
    for (let k = 0; k < ring.length; k++) tri.push(ci, ring[k], ring[(k + 1) % ring.length]);
    if (triNormal(pos, tri[0], tri[1], tri[2]).dot(want) < 0) {
      for (let k = 0; k < tri.length; k += 3) {
        const t = tri[k + 1];
        tri[k + 1] = tri[k + 2];
        tri[k + 2] = t;
      }
    }
    idx.push(...tri);
  }
  // 表面繞序：上表面三角形法線須朝 thickDir
  const mid = Math.floor(m / 2);
  const test = triNormal(pos, mid, mid + 1, mid + 1 + ringLen);
  if (test.dot(thickDir) < 0) {
    for (let k = 0; k < capStart; k += 3) {
      const t = idx[k + 1];
      idx[k + 1] = idx[k + 2];
      idx[k + 2] = t;
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (opts.pivot) g.translate(-opts.pivot.x, -opts.pivot.y, -opts.pivot.z);
  return g;
}

function triNormal(pos: number[], a: number, b: number, c: number): Vector3 {
  const va = new Vector3(pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2]);
  const vb = new Vector3(pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]).sub(va);
  const vc = new Vector3(pos[c * 3], pos[c * 3 + 1], pos[c * 3 + 2]).sub(va);
  return vb.cross(vc);
}

/** 以 +Z 為軸的 Lathe；profile 為 [半徑, z] */
export function latheZ(profile: [number, number][], segments = 48): BufferGeometry {
  const g = new LatheGeometry(
    profile.map(([r, z]) => new Vector2(Math.max(r, 0.0001), -z)),
    segments,
  );
  g.rotateX(-Math.PI / 2);
  return g;
}
