/**
 * 座艙殼體：以機鼻剖面放樣的封閉內殼，六片窗精確開孔（網格斷點含窗緣），玻璃與窗框依同一參數面生成；
 * 另含地板、後隔板、膝部面板、中央操縱台本體、側控台、座椅、遮光板本體、遮陽板等靜態結構。
 */
import {
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Matrix4,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Shape,
  TorusGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CockpitBuilder } from './builder';

/** 剖面節點：[z, 半徑, 中心 y] */
const KNOTS: [number, number, number][] = [
  [-17.4, 0.45, -0.78],
  [-16.9, 0.93, -0.55],
  [-16.3, 1.32, -0.37],
  [-15.6, 1.62, -0.22],
  [-14.9, 1.84, -0.11],
  [-14.0, 1.95, -0.03],
  [-12.3, 1.97, 0],
];
export const SHELL_Z0 = -17.4;
export const SHELL_Z1 = -12.3;
export const FLOOR_Y = -0.75;
/** 遮光板唇緣頂面高度（z = -15.26） */
export const GLARE_TOP = 0.37;
export const PED_TOP = -0.355;
export const PED_HALF = 0.28;
const DEG = Math.PI / 180;

/** 窗戶參數區（θ 由頂部量起，左側為負；度） */
export const WINDOWS = [
  { name: 'front', z0: -17.25, z1: -16.0, t0: 4, t1: 66 },
  { name: 'side', z0: -15.92, z1: -15.3, t0: 42, t1: 80 },
  { name: 'slide', z0: -15.2, z1: -14.45, t0: 50, t1: 82 },
] as const;

/** 平滑剖面（Catmull-Rom 式 Hermite） */
export function shellProfile(z: number): { r: number; yc: number } {
  const k = KNOTS;
  if (z <= k[0][0]) return { r: k[0][1], yc: k[0][2] };
  if (z >= k[k.length - 1][0]) return { r: k[k.length - 1][1], yc: k[k.length - 1][2] };
  let i = 0;
  while (z > k[i + 1][0]) i++;
  const a = k[i];
  const b = k[i + 1];
  const h = b[0] - a[0];
  const t = (z - a[0]) / h;
  const tan = (j: number, c: 1 | 2): number => {
    const p = k[Math.max(0, j - 1)];
    const n = k[Math.min(k.length - 1, j + 1)];
    return (n[c] - p[c]) / (n[0] - p[0]);
  };
  const herm = (c: 1 | 2): number => {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * a[c] +
      (t3 - 2 * t2 + t) * h * tan(i, c) +
      (-2 * t3 + 3 * t2) * b[c] +
      (t3 - t2) * h * tan(i + 1, c)
    );
  };
  return { r: herm(1), yc: herm(2) };
}

export function shellPoint(z: number, thetaDeg: number, inset = 0, out = new Vector3()): Vector3 {
  const { r, yc } = shellProfile(z);
  const rr = r - inset;
  const t = thetaDeg * DEG;
  return out.set(rr * Math.sin(t), yc + rr * Math.cos(t), z);
}

/** y 高度處的殼體半寬 */
export function shellHalfWidth(z: number, y: number): number {
  const { r, yc } = shellProfile(z);
  const dy = y - yc;
  return Math.sqrt(Math.max(0, r * r - dy * dy));
}

function inWindow(z: number, th: number): boolean {
  const a = Math.abs(th);
  return WINDOWS.some((w) => z > w.z0 && z < w.z1 && a > w.t0 && a < w.t1);
}

function breakpoints(from: number, to: number, step: number, extra: number[]): number[] {
  const set = new Set<number>();
  for (let v = from; v < to - 1e-6; v += step) set.add(Math.round(v * 1e4) / 1e4);
  set.add(to);
  for (const e of extra) if (e >= from && e <= to) set.add(e);
  return [...set].sort((a, b) => a - b);
}

/** 參數面網格（內向法線） */
function paramSurface(
  zs: number[],
  ts: number[],
  inset: number,
  skip: (z: number, t: number) => boolean,
): BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const p = new Vector3();
  for (const z of zs) {
    for (const t of ts) {
      shellPoint(z, t, inset, p);
      pos.push(p.x, p.y, p.z);
      uv.push((t - ts[0]) / (ts[ts.length - 1] - ts[0]), (z - zs[0]) / (zs[zs.length - 1] - zs[0]));
    }
  }
  const nt = ts.length;
  for (let i = 0; i < zs.length - 1; i++) {
    for (let j = 0; j < nt - 1; j++) {
      if (skip((zs[i] + zs[i + 1]) / 2, (ts[j] + ts[j + 1]) / 2)) continue;
      const a = i * nt + j;
      const b = (i + 1) * nt + j;
      const c = i * nt + j + 1;
      const d = (i + 1) * nt + j + 1;
      idx.push(a, c, b, c, d, b);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** 沿窗緣的框條（矩形斷面） */
function frameBand(
  samples: { p: Vector3; away: Vector3; inward: Vector3 }[],
  width: number,
  depth: number,
): BufferGeometry {
  const ring = (s: (typeof samples)[number]): Vector3[] => [
    s.p.clone().addScaledVector(s.away, width),
    s.p.clone().addScaledVector(s.away, width).addScaledVector(s.inward, depth),
    s.p.clone().addScaledVector(s.away, -0.005).addScaledVector(s.inward, depth),
    s.p.clone().addScaledVector(s.away, -0.005),
  ];
  const pos: number[] = [];
  for (let i = 0; i < samples.length - 1; i++) {
    const r0 = ring(samples[i]);
    const r1 = ring(samples[i + 1]);
    for (let k = 0; k < 3; k++) {
      const a = r0[k];
      const b = r0[k + 1];
      const c = r1[k];
      const d = r1[k + 1];
      pos.push(
        a.x,
        a.y,
        a.z,
        c.x,
        c.y,
        c.z,
        b.x,
        b.y,
        b.z,
        b.x,
        b.y,
        b.z,
        c.x,
        c.y,
        c.z,
        d.x,
        d.y,
        d.z,
      );
      pos.push(
        a.x,
        a.y,
        a.z,
        b.x,
        b.y,
        b.z,
        c.x,
        c.y,
        c.z,
        b.x,
        b.y,
        b.z,
        d.x,
        d.y,
        d.z,
        c.x,
        c.y,
        c.z,
      );
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.computeVertexNormals();
  return g;
}

function windowFrames(w: (typeof WINDOWS)[number], sign: number): BufferGeometry[] {
  const out: BufferGeometry[] = [];
  const N = 18;
  const dz = 0.002;
  const dt = 0.2;
  const tmp = new Vector3();
  const inwardAt = (p: Vector3, z: number): Vector3 => {
    const { yc } = shellProfile(z);
    return tmp
      .set(-p.x, yc - p.y, 0)
      .normalize()
      .clone();
  };
  const t0 = sign * w.t0;
  const t1 = sign * w.t1;
  // z 邊（前/後緣）
  for (const [z, dir] of [
    [w.z0, -1],
    [w.z1, 1],
  ] as const) {
    const s = [];
    for (let i = 0; i <= N; i++) {
      const t = t0 + ((t1 - t0) * i) / N;
      const p = shellPoint(z, t);
      const away = shellPoint(z + dz * dir, t)
        .sub(shellPoint(z, t))
        .normalize();
      s.push({ p, away, inward: inwardAt(p, z) });
    }
    out.push(frameBand(s, 0.034, 0.024));
  }
  // θ 邊（上/下緣）
  for (const [t, dir] of [
    [t0, -Math.sign(t1 - t0)],
    [t1, Math.sign(t1 - t0)],
  ] as const) {
    const s = [];
    for (let i = 0; i <= N; i++) {
      const z = w.z0 + ((w.z1 - w.z0) * i) / N;
      const p = shellPoint(z, t);
      const away = shellPoint(z, t + dt * dir)
        .sub(shellPoint(z, t))
        .normalize();
      s.push({ p, away, inward: inwardAt(p, z) });
    }
    out.push(frameBand(s, 0.034, 0.024));
  }
  return out;
}

const RAIN_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}`;

const RAIN_FRAG = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform float uTime;
uniform float uRain;
uniform float uFlow;
uniform vec2 uScale;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float drops(vec2 uv, float scale, float speed, float seed) {
  vec2 p = uv * scale;
  p.y += uTime * speed;
  vec2 id = floor(p);
  vec2 f = fract(p) - 0.5;
  float h = hash(id + seed);
  if (h > uRain) return 0.0;
  vec2 c = vec2(hash(id + 3.1 + seed) - 0.5, hash(id + 7.7 + seed) - 0.5) * 0.6;
  vec2 d = (f - c) * vec2(1.0, 1.0 + abs(speed) * 0.25);
  float r = 0.12 + 0.18 * hash(id + 11.3);
  return smoothstep(r, r * 0.35, length(d));
}
void main() {
  #include <logdepthbuf_fragment>
  if (uRain < 0.01) discard;
  vec2 uv = vUv * uScale;
  float m = drops(uv, 9.0, uFlow, 0.0) + drops(uv, 15.0, uFlow * 1.4, 5.0) * 0.8 + drops(uv, 26.0, uFlow * 0.6, 9.0) * 0.6;
  // 高速時的水紋條
  float streak = smoothstep(0.93, 1.0, hash(vec2(floor(uv.x * 60.0), floor(uv.y * 3.0 + uTime * uFlow * 0.5)))) * step(2.0, abs(uFlow)) * 0.5;
  float a = clamp(m + streak, 0.0, 1.0) * 0.55 * min(1.0, uRain * 1.6);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vec3(0.78, 0.84, 0.86) * (0.6 + m * 0.5), a);
}`;

export interface ShellParts {
  rain: ShaderMaterial;
}

export function buildShell(b: CockpitBuilder): ShellParts {
  const m = b.mats;
  const I = new Matrix4();

  // --- 殼體 ---
  const zExtra = WINDOWS.flatMap((w) => [w.z0, w.z1]);
  const tExtra = WINDOWS.flatMap((w) => [w.t0, w.t1, -w.t0, -w.t1]);
  const zs = breakpoints(SHELL_Z0, SHELL_Z1, 0.06, zExtra);
  const ts = breakpoints(-180, 180, 3, tExtra);
  b.addStatic(paramSurface(zs, ts, 0, inWindow), m.lining, I);

  // 前後封板
  const cap = (z: number, facing: 1 | -1): BufferGeometry => {
    const { r, yc } = shellProfile(z);
    const g = new CylinderGeometry(r, r, 0.01, 48)
      .rotateX(Math.PI / 2)
      .translate(0, yc, z + facing * 0.005);
    return g;
  };
  b.addStatic(cap(SHELL_Z0 + 0.002, 1), m.dark, I);
  b.addStatic(cap(SHELL_Z1, -1), m.lining, I);

  // --- 玻璃、窗框、雨滴 ---
  const rain = new ShaderMaterial({
    vertexShader: RAIN_VERT,
    fragmentShader: RAIN_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uRain: { value: 0 },
      uFlow: { value: -0.3 },
      uScale: { value: [1, 1] },
    },
  });
  for (const w of WINDOWS) {
    for (const sign of [-1, 1]) {
      const tsw = breakpoints(
        Math.min(sign * w.t0, sign * w.t1),
        Math.max(sign * w.t0, sign * w.t1),
        2,
        [],
      );
      const zsw = breakpoints(w.z0, w.z1, 0.05, []);
      const glass = new Mesh(
        paramSurface(zsw, tsw, 0.003, () => false),
        m.glass,
      );
      glass.name = `glass:${w.name}`;
      glass.renderOrder = 3;
      b.root.add(glass);
      const drops = new Mesh(
        paramSurface(zsw, tsw, 0.006, () => false),
        rain,
      );
      drops.renderOrder = 4;
      drops.name = `rain:${w.name}`;
      b.root.add(drops);
      for (const f of windowFrames(w, sign)) b.addStatic(f, m.frame, I);
    }
  }
  // 中柱
  const post = new BoxLike(0.05, 0.03);
  post.along(b, (t) => shellPoint(-17.25 + 1.25 * t, 0, 0.012), m.frame);

  // --- 地板與後隔板門 ---
  const floorPos: number[] = [];
  const fz = breakpoints(-15.7, SHELL_Z1, 0.1, []);
  for (let i = 0; i < fz.length - 1; i++) {
    const w0 = shellHalfWidth(fz[i], FLOOR_Y) - 0.01;
    const w1 = shellHalfWidth(fz[i + 1], FLOOR_Y) - 0.01;
    floorPos.push(
      -w0,
      FLOOR_Y,
      fz[i],
      -w1,
      FLOOR_Y,
      fz[i + 1],
      w0,
      FLOOR_Y,
      fz[i],
      w0,
      FLOOR_Y,
      fz[i],
      -w1,
      FLOOR_Y,
      fz[i + 1],
      w1,
      FLOOR_Y,
      fz[i + 1],
    );
  }
  const floor = new BufferGeometry();
  floor.setAttribute('position', new BufferAttribute(new Float32Array(floorPos), 3));
  floor.computeVertexNormals();
  b.addStatic(floor, m.carpet, I);
  // 門
  b.addStatic(
    new RoundedBoxGeometry(0.72, 1.85, 0.04, 2, 0.02),
    m.trim,
    new Matrix4().makeTranslation(0, FLOOR_Y + 0.93, SHELL_Z1 - 0.02),
  );
  b.addStatic(
    new RoundedBoxGeometry(0.62, 0.3, 0.02, 1, 0.01),
    m.panel,
    new Matrix4().makeTranslation(0, FLOOR_Y + 1.35, SHELL_Z1 - 0.045),
  );
  b.addStatic(
    new CylinderGeometry(0.012, 0.012, 0.14, 10),
    m.metal,
    new Matrix4().makeTranslation(0.26, FLOOR_Y + 0.95, SHELL_Z1 - 0.07),
  );
  // 觀察員座椅（折疊）
  b.addStatic(
    new RoundedBoxGeometry(0.5, 0.7, 0.08, 2, 0.02),
    m.seat,
    new Matrix4().makeTranslation(-0.72, FLOOR_Y + 0.9, SHELL_Z1 - 0.06),
  );

  // --- 遮光板本體（上表面由唇緣向前下斜至擋風玻璃底） ---
  b.addStatic(glareshieldBody(), m.dark, I);

  // --- 膝部面板（主儀表板下緣到地板） ---
  b.addStatic(
    new RoundedBoxGeometry(2.0, 0.4, 0.05, 2, 0.01),
    m.trim,
    new Matrix4().makeRotationX(0.22).setPosition(0, -0.53, -15.44),
  );
  // 腳踏區內凹
  b.addStatic(
    new PlaneGeometry(2.2, 0.8).rotateX(-Math.PI / 2 + 0.35),
    m.carpet,
    new Matrix4().makeTranslation(0, -0.64, -15.8),
  );

  // --- 中央操縱台本體 ---
  const ped = new Shape();
  ped.moveTo(15.4, FLOOR_Y);
  ped.lineTo(15.4, -0.25);
  ped.lineTo(14.98, PED_TOP);
  ped.lineTo(13.9, PED_TOP);
  ped.lineTo(13.9, FLOOR_Y);
  ped.closePath();
  const pedGeo = new ExtrudeGeometry(ped, {
    depth: PED_HALF * 2 - 0.012,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
  });
  const pedBasis = new Matrix4()
    .makeBasis(new Vector3(0, 0, -1), new Vector3(0, 1, 0), new Vector3(1, 0, 0))
    .setPosition(-PED_HALF + 0.006, 0, 0);
  b.addStatic(pedGeo, m.trim, pedBasis);

  // --- 側控台（含托盤） ---
  for (const s of [-1, 1]) {
    const x = s * 1.0;
    b.addStatic(
      new RoundedBoxGeometry(0.4, 0.66, 1.2, 3, 0.03),
      m.panel,
      new Matrix4().makeTranslation(x, -0.42, -14.7),
    );
    b.addStatic(
      new RoundedBoxGeometry(0.36, 0.012, 1.1, 2, 0.004),
      m.trim,
      new Matrix4().makeTranslation(x, -0.085, -14.7),
    );
    // 收起的托盤
    b.addStatic(
      new RoundedBoxGeometry(0.34, 0.02, 0.26, 2, 0.006),
      m.seatFrame,
      new Matrix4().makeTranslation(x - s * 0.02, -0.07, -15.18),
    );
    // 氧氣面罩盒
    b.addStatic(
      new RoundedBoxGeometry(0.12, 0.12, 0.2, 2, 0.01),
      m.trim,
      new Matrix4().makeTranslation(s * 1.05, 0.05, -13.9),
    );
    b.addStatic(
      new RoundedBoxGeometry(0.09, 0.02, 0.15, 1, 0.005),
      m.white,
      new Matrix4().makeTranslation(s * 1.05, 0.115, -13.9),
    );
    // 手電筒架
    b.addStatic(
      new CylinderGeometry(0.018, 0.018, 0.2, 14),
      m.black,
      new Matrix4().makeRotationX(Math.PI / 2).setPosition(s * 1.12, -0.25, -14.3),
    );
    // 側壁飾條（窗下）
    for (const z of [-15.6, -14.9, -14.1]) {
      const y = 0.2;
      const hw = shellHalfWidth(z, y) - 0.07;
      b.addStatic(
        new RoundedBoxGeometry(0.06, 0.02, 0.62, 1, 0.006),
        m.trim,
        new Matrix4().makeTranslation(s * hw, y, z),
      );
    }
  }

  // --- 座椅 ---
  for (const s of [-1, 1]) buildSeat(b, s * 0.53);

  // --- 遮陽板（收在窗框上緣） ---
  for (const s of [-1, 1]) {
    const p = shellPoint(-15.35, s * 14, 0.05);
    const vis = new RoundedBoxGeometry(0.42, 0.006, 0.2, 1, 0.003);
    b.addStatic(vis, m.dark, new Matrix4().makeRotationX(0.12).setPosition(p.x, p.y - 0.01, p.z));
    const rail = shellPoint(-15.1, s * 32, 0.05);
    b.addStatic(
      new CylinderGeometry(0.008, 0.008, 1.1, 8).rotateX(Math.PI / 2),
      m.metal,
      new Matrix4().makeTranslation(rail.x, rail.y, -15.6),
    );
  }
  // 頂棚把手與頂燈座
  b.addStatic(
    new CylinderGeometry(0.06, 0.07, 0.02, 24),
    m.white,
    new Matrix4().makeTranslation(0, shellPoint(-14.2, 0).y - 0.03, -14.2),
  );
  for (const s of [-1, 1]) {
    const p = shellPoint(-13.6, s * 40, 0.04);
    b.addStatic(
      new TorusGeometry(0.05, 0.008, 8, 20, Math.PI),
      m.metal,
      new Matrix4().makeRotationY(Math.PI / 2).setPosition(p.x, p.y, p.z),
    );
  }
  // 腳踏板下方的地板凸緣
  b.addStatic(
    new RoundedBoxGeometry(2.0, 0.05, 0.25, 2, 0.01),
    m.trim,
    new Matrix4().makeTranslation(0, FLOOR_Y + 0.02, -15.7),
  );

  return { rain };
}

/** 沿參數曲線掃出方條（中柱等） */
class BoxLike {
  constructor(
    private readonly w: number,
    private readonly d: number,
  ) {}

  along(
    b: CockpitBuilder,
    curve: (t: number) => Vector3,
    mat: CockpitBuilder['mats']['frame'],
  ): void {
    const N = 16;
    const s = [];
    for (let i = 0; i <= N; i++) {
      const p = curve(i / N);
      const { yc } = shellProfile(p.z);
      const inward = new Vector3(-p.x, yc - p.y, 0).normalize();
      s.push({
        p: p.clone().addScaledVector(new Vector3(1, 0, 0), -this.w / 2),
        away: new Vector3(1, 0, 0),
        inward,
      });
    }
    b.addStatic(frameBand(s, this.w, this.d), mat, new Matrix4());
  }
}

/** 遮光板：由 FCU 唇緣往前下斜至擋風玻璃，寬度受殼體限制 */
function glareshieldBody(): BufferGeometry {
  const pos: number[] = [];
  const zs = breakpoints(-17.3, -15.26, 0.05, []);
  const top = (z: number): number => GLARE_TOP + (z + 15.26) * 0.34;
  const bot = (z: number): number => top(z) - 0.1;
  const hw = (z: number): number =>
    Math.min(0.99, shellHalfWidth(z, top(z)) - 0.012, shellHalfWidth(z, bot(z)) - 0.012);
  const quad = (a: number[], b2: number[], c: number[], d: number[]): void => {
    pos.push(...a, ...b2, ...c, ...c, ...b2, ...d);
  };
  for (let i = 0; i < zs.length - 1; i++) {
    const z0 = zs[i];
    const z1 = zs[i + 1];
    const w0 = hw(z0);
    const w1 = hw(z1);
    quad([-w0, top(z0), z0], [-w1, top(z1), z1], [w0, top(z0), z0], [w1, top(z1), z1]);
    quad([-w0, bot(z0), z0], [w0, bot(z0), z0], [-w1, bot(z1), z1], [w1, bot(z1), z1]);
    for (const s of [-1, 1])
      quad(
        [s * w0, bot(z0), z0],
        [s * w1, bot(z1), z1],
        [s * w0, top(z0), z0],
        [s * w1, top(z1), z1],
      );
  }
  // 唇緣圓角（面向駕駛）
  const zl = zs[zs.length - 1];
  const wl = hw(zl);
  quad(
    [-wl, top(zl), zl],
    [wl, top(zl), zl],
    [-wl, top(zl) + 0.012, zl + 0.03],
    [wl, top(zl) + 0.012, zl + 0.03],
  );
  quad(
    [-wl, top(zl) + 0.012, zl + 0.03],
    [wl, top(zl) + 0.012, zl + 0.03],
    [-wl, bot(zl) + 0.06, zl + 0.03],
    [wl, bot(zl) + 0.06, zl + 0.03],
  );
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.computeVertexNormals();
  return g;
}

function buildSeat(b: CockpitBuilder, x: number): void {
  const m = b.mats;
  const T = (px: number, py: number, pz: number, rx = 0): Matrix4 =>
    new Matrix4().makeRotationX(rx).setPosition(px, py, pz);
  // 底座與滑軌
  b.addStatic(
    new RoundedBoxGeometry(0.38, 0.3, 0.46, 2, 0.03),
    m.seatFrame,
    T(x, FLOOR_Y + 0.2, -14.45),
  );
  for (const s of [-1, 1])
    b.addStatic(
      new RoundedBoxGeometry(0.03, 0.03, 0.9, 1, 0.008),
      m.metal,
      T(x + s * 0.16, FLOOR_Y + 0.02, -14.4),
    );
  b.addStatic(new CylinderGeometry(0.05, 0.06, 0.28, 16), m.metal, T(x, FLOOR_Y + 0.42, -14.45));
  // 坐墊
  b.addStatic(new RoundedBoxGeometry(0.5, 0.11, 0.5, 4, 0.045), m.seat, T(x, -0.21, -14.5, -0.06));
  // 椅背
  b.addStatic(new RoundedBoxGeometry(0.5, 0.72, 0.12, 4, 0.05), m.seat, T(x, 0.18, -14.2, 0.14));
  b.addStatic(
    new RoundedBoxGeometry(0.46, 0.66, 0.05, 2, 0.02),
    m.seatFrame,
    T(x, 0.17, -14.13, 0.14),
  );
  // 頭枕
  b.addStatic(new RoundedBoxGeometry(0.3, 0.18, 0.1, 4, 0.04), m.seat, T(x, 0.66, -14.1, 0.1));
  // 腰靠側翼
  for (const s of [-1, 1])
    b.addStatic(
      new RoundedBoxGeometry(0.06, 0.4, 0.14, 3, 0.025),
      m.seat,
      T(x + s * 0.24, 0.05, -14.23, 0.14),
    );
  // 扶手（內側可收）
  for (const s of [-1, 1]) {
    b.addStatic(
      new RoundedBoxGeometry(0.065, 0.05, 0.36, 3, 0.02),
      m.seat,
      T(x + s * 0.3, -0.02, -14.4),
    );
    b.addStatic(
      new RoundedBoxGeometry(0.03, 0.2, 0.03, 1, 0.008),
      m.seatFrame,
      T(x + s * 0.3, -0.12, -14.25),
    );
  }
  // 肩帶
  for (const s of [-1, 1])
    b.addStatic(
      new RoundedBoxGeometry(0.045, 0.62, 0.012, 1, 0.004),
      m.rubber,
      T(x + s * 0.1, 0.2, -14.27, 0.14),
    );
}
