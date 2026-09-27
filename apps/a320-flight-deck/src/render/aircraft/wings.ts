/**
 * 機翼、水平/垂直尾翼與所有活動操縱面（鉸鏈軸依幾何計算）。
 */
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  type Material,
  type Object3D,
  SphereGeometry,
  Vector3,
} from 'three';
import { AIRCRAFT, DEG } from '../../sim/constants';
import { type LoftStation, latheZ, loftWing } from './geometry';
import type { AircraftMaterials } from './materials';

/** 可轉動/滑動的操縱面：位置 = base + slide*f，姿態 = 繞 axis 轉 angle */
export interface Hinged {
  obj: Object3D;
  base: Vector3;
  axis: Vector3;
  slide: Vector3;
}

export interface WingParts {
  group: Group;
  aileronL: Hinged;
  aileronR: Hinged;
  spoilersL: Hinged[];
  spoilersR: Hinged[];
  flapsL: Hinged[];
  flapsR: Hinged[];
  slatsL: Hinged[];
  slatsR: Hinged[];
  ths: Object3D;
  elevatorL: Hinged;
  elevatorR: Hinged;
  rudder: Hinged;
}

const W = AIRCRAFT.wing;
const TAN_LE = Math.tan(W.leSweepDeg * DEG);
const TAN_DIH = Math.tan(W.dihedralDeg * DEG);
const KINK_X = 6.3;
const ROOT_TE_Z = W.rootLeZ + W.rootChord;
const KINK_TE_Z = ROOT_TE_Z + 0.35;
const TIP_LE_Z = W.rootLeZ + (W.tipX - W.rootX) * TAN_LE;
const TIP_TE_Z = TIP_LE_Z + W.tipChord;
const Z_AXIS = new Vector3(0, 0, 1);
const Y_AXIS = new Vector3(0, 1, 0);
const X_AXIS = new Vector3(1, 0, 0);

/** 機翼截面（ax 為翼展絕對值） */
export function wingStation(ax: number, side: 1 | -1): LoftStation {
  const leZ = W.rootLeZ + (ax - W.rootX) * TAN_LE;
  const teZ =
    ax <= KINK_X
      ? ROOT_TE_Z + (KINK_TE_Z - ROOT_TE_Z) * ((ax - W.rootX) / (KINK_X - W.rootX))
      : KINK_TE_Z + (TIP_TE_Z - KINK_TE_Z) * ((ax - KINK_X) / (W.tipX - KINK_X));
  const t = Math.max(0, (ax - W.rootX) / (W.tipX - W.rootX));
  return {
    le: new Vector3(side * ax, W.rootY + (ax - W.rootX) * TAN_DIH, leZ),
    chord: teZ - leZ,
    tc: 0.155 - 0.05 * t,
  };
}

function stationsBetween(x0: number, x1: number, side: 1 | -1, step = 1.2): LoftStation[] {
  const xs = new Set<number>([x0, x1]);
  if (KINK_X > x0 && KINK_X < x1) xs.add(KINK_X);
  const n = Math.max(1, Math.ceil((x1 - x0) / step));
  for (let i = 1; i < n; i++) xs.add(x0 + ((x1 - x0) * i) / n);
  return [...xs].sort((a, b) => a - b).map((x) => wingStation(x, side));
}

// 左右翼各佔貼圖一半（u 依有號 x），避免左翼文字鏡射
const wingUv = (p: Vector3): [number, number] => [0.5 + p.x / 36, 1 - (p.z + 5) / 12];

function mesh(g: BufferGeometry, m: Material): Mesh {
  const me = new Mesh(g, m);
  me.castShadow = true;
  me.receiveShadow = true;
  return me;
}

function hingeOf(st: LoftStation, c: number, upper: boolean): Vector3 {
  // 鉸鏈置於弦線（前緣高度）上方/下方少許
  return st.le
    .clone()
    .addScaledVector(Z_AXIS, c * st.chord)
    .addScaledVector(Y_AXIS, (upper ? 0.35 : 0) * st.tc * st.chord);
}

/** 建立繞弦向分數 hingeC 鉸接的機翼段 */
function wingHinged(
  parent: Object3D,
  x0: number,
  x1: number,
  side: 1 | -1,
  c0: number,
  c1: number,
  hingeC: number,
  mat: Material,
  slidePerUnit: (chordMid: number) => Vector3,
  upperHinge = false,
): Hinged {
  const sts = stationsBetween(x0, x1, side);
  const inner = hingeOf(sts[0], hingeC, upperHinge);
  const outer = hingeOf(sts[sts.length - 1], hingeC, upperHinge);
  const pivot = inner.clone().add(outer).multiplyScalar(0.5);
  const axis = outer.clone().sub(inner).normalize();
  if (axis.x < 0) axis.negate();
  const g = loftWing(sts, Z_AXIS, Y_AXIS, c0, c1, { pivot, planarUv: wingUv });
  const obj = new Group();
  obj.position.copy(pivot);
  obj.add(mesh(g, mat));
  parent.add(obj);
  const chordMid = (sts[0].chord + sts[sts.length - 1].chord) / 2;
  return { obj, base: pivot, axis, slide: slidePerUnit(chordMid) };
}

/** 擾流板：貼附上表面的薄板，前緣鉸接 */
function spoiler(parent: Object3D, x0: number, x1: number, side: 1 | -1, mat: Material): Hinged {
  const a = wingStation(x0, side);
  const b = wingStation(x1, side);
  const c0 = 0.57;
  const c1 = 0.72;
  const surf = (st: LoftStation, c: number): Vector3 => {
    const t = st.tc;
    const th =
      5 *
      t *
      (0.2969 * Math.sqrt(c) - 0.126 * c - 0.3516 * c * c + 0.2843 * c ** 3 - 0.1036 * c ** 4);
    const camber = t * 0.22 * Math.sin(Math.PI * Math.pow(c, 1.3)) * Math.pow(c, 0.6);
    return st.le
      .clone()
      .addScaledVector(Z_AXIS, c * st.chord)
      .addScaledVector(Y_AXIS, (camber + th * 1.02) * st.chord + 0.012);
  };
  const p = [surf(a, c0), surf(b, c0), surf(b, c1), surf(a, c1)];
  const pivot = p[0].clone().add(p[1]).multiplyScalar(0.5);
  const axis = p[1].clone().sub(p[0]).normalize();
  if (axis.x < 0) axis.negate();
  const thick = 0.025;
  const pos: number[] = [];
  for (const v of p) pos.push(v.x - pivot.x, v.y - pivot.y, v.z - pivot.z);
  for (const v of p) pos.push(v.x - pivot.x, v.y - pivot.y - thick, v.z - pivot.z);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  // 上下兩面（薄板側邊省略）
  const idx =
    side > 0 ? [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7] : [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6];
  g.setIndex(idx);
  g.computeVertexNormals();
  const obj = new Group();
  obj.position.copy(pivot);
  obj.add(mesh(g, mat));
  parent.add(obj);
  return { obj, base: pivot, axis, slide: new Vector3() };
}

export function buildWings(mats: AircraftMaterials): WingParts {
  const group = new Group();
  group.name = 'wings';
  const sides = [-1, 1] as const;
  const out: Partial<WingParts> = {
    spoilersL: [],
    spoilersR: [],
    flapsL: [],
    flapsR: [],
    slatsL: [],
    slatsR: [],
  };
  const flapSlide = (chord: number): Vector3 => new Vector3(0, -0.07 * chord, 0.2 * chord);
  const slatSlide = (chord: number): Vector3 => new Vector3(0, -0.05 * chord, -0.09 * chord);
  const none = (): Vector3 => new Vector3();

  for (const side of sides) {
    const L = side < 0;
    // 固定結構：主翼盒、根部前緣、派龍區前緣、翼尖前後緣、根部後緣
    const fixed: [number, number, number, number, Material][] = [
      [0.8, W.tipX, 0.12, 0.72, mats.wing],
      [0.8, 2.3, 0, 0.12, mats.wingPlain],
      [5.2, 6.3, 0, 0.12, mats.wingPlain],
      [16.9, W.tipX, 0, 0.12, mats.wingPlain],
      [0.8, 2.0, 0.72, 1, mats.wing],
      [6.3, 6.4, 0.72, 1, mats.wing],
      [12.6, 12.7, 0.72, 1, mats.wing],
      [16.2, W.tipX, 0.72, 1, mats.wing],
    ];
    for (const [x0, x1, c0, c1, m] of fixed) {
      group.add(
        mesh(
          loftWing(stationsBetween(x0, x1, side), Z_AXIS, Y_AXIS, c0, c1, { planarUv: wingUv }),
          m,
        ),
      );
    }
    // 縫翼：1 片在派龍內側、4 片外側
    const slatSpans: [number, number][] = [[2.3, 5.2]];
    for (let i = 0; i < 4; i++)
      slatSpans.push([
        6.3 + (i * (16.9 - 6.3)) / 4 + 0.02,
        6.3 + ((i + 1) * (16.9 - 6.3)) / 4 - 0.02,
      ]);
    const slats = slatSpans.map(([a, b]) =>
      wingHinged(group, a, b, side, 0, 0.12, 0.12, mats.wingPlain, slatSlide),
    );
    // 襟翼（內/外段）、副翼
    const flaps = [
      wingHinged(group, 2.0, 6.3, side, 0.72, 1, 0.72, mats.wingPlain, flapSlide),
      wingHinged(group, 6.4, 12.6, side, 0.72, 1, 0.72, mats.wingPlain, flapSlide),
    ];
    const aileron = wingHinged(group, 12.7, 16.2, side, 0.72, 1, 0.72, mats.wingPlain, none, true);
    // 擾流板 5 片（索引 0 最內側）
    const spSpans: [number, number][] = [[3.0, 5.8]];
    for (let i = 0; i < 4; i++) spSpans.push([6.5 + i * 1.5, 7.95 + i * 1.5]);
    const spoilers = spSpans.map(([a, b]) => spoiler(group, a, b, side, mats.wingPlain));

    // 翼尖 sharklet：由水平彎折向上
    const tip = wingStation(W.tipX, side);
    const sharkSts: LoftStation[] = [];
    const R = 0.75;
    for (let k = 0; k <= 7; k++) {
      const t = k / 7;
      const phi = t * 80 * DEG;
      const le = new Vector3(
        side * (W.tipX + R * Math.sin(phi)),
        tip.le.y + R * (1 - Math.cos(phi)),
        tip.le.z + t * 0.35,
      );
      sharkSts.push({
        le,
        chord: tip.chord - t * 0.35,
        tc: 0.1,
        thick: new Vector3(-side * Math.sin(phi), Math.cos(phi), 0),
      });
    }
    const top = sharkSts[sharkSts.length - 1];
    const upDir = new Vector3(side * Math.cos(80 * DEG), Math.sin(80 * DEG), 0);
    const rest = W.sharkletHeight - R;
    for (let k = 1; k <= 3; k++) {
      const t = k / 3;
      sharkSts.push({
        le: top.le
          .clone()
          .addScaledVector(upDir, rest * t)
          .add(new Vector3(0, 0, 0.75 * t)),
        chord: top.chord - t * 0.55,
        tc: 0.09,
        thick: top.thick,
      });
    }
    group.add(mesh(loftWing(sharkSts, Z_AXIS, Y_AXIS, 0, 1, { samples: 10 }), mats.paint));

    // 襟翼滑軌整流罩
    for (const fx of [4.0, 7.3, 9.7, 11.9]) {
      const st = wingStation(fx, side);
      const len = st.chord * 0.75;
      const g = latheZ(
        Array.from({ length: 9 }, (_, i) => {
          const t = i / 8;
          return [0.2 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.55), t * len] as [
            number,
            number,
          ];
        }),
        12,
      );
      g.scale(0.75, 1.3, 1);
      const fm = mesh(g, mats.wingPlain);
      fm.position.set(side * fx, st.le.y - 0.07 * st.chord - 0.12, st.le.z + st.chord * 0.5);
      group.add(fm);
    }

    if (L) {
      out.aileronL = aileron;
      out.flapsL = flaps;
      out.slatsL = slats;
      out.spoilersL = spoilers;
    } else {
      out.aileronR = aileron;
      out.flapsR = flaps;
      out.slatsR = slats;
      out.spoilersR = spoilers;
    }
  }

  // 機腹整流罩
  const belly = mesh(new SphereGeometry(1, 32, 16), mats.navy);
  belly.scale.set(2.2, 0.95, 7.6);
  belly.position.set(0, -1.55, -0.4);
  group.add(belly);

  // ---- 水平尾翼（THS 全動，繞後梁樞軸） ----
  const hs = AIRCRAFT.hstab;
  const hsTan = Math.tan(hs.sweepDeg * DEG);
  const hsTip = hs.span / 2;
  const thsPivot = new Vector3(0, hs.y, hs.rootLeZ + 0.62 * hs.rootChord);
  const ths = new Group();
  ths.position.copy(thsPivot);
  group.add(ths);
  const hsStation = (ax: number, side: 1 | -1): LoftStation => {
    const t = (ax - hs.rootX) / (hsTip - hs.rootX);
    return {
      le: new Vector3(
        side * ax,
        hs.y + (ax - hs.rootX) * Math.tan(6 * DEG),
        hs.rootLeZ + (ax - hs.rootX) * hsTan,
      ),
      chord: hs.rootChord + (hs.tipChord - hs.rootChord) * t,
      tc: 0.1,
    };
  };
  const elevators: Hinged[] = [];
  for (const side of sides) {
    const sts = [0.3, 1.5, 3, 4.5, hsTip].map((x) => hsStation(x, side));
    ths.add(
      mesh(
        loftWing(sts, Z_AXIS, Y_AXIS, 0, 0.7, { symmetric: true, pivot: thsPivot }),
        mats.wingPlain,
      ),
    );
    const esSts = [0.9, 2.5, 4.2, hsTip - 0.15].map((x) => hsStation(x, side));
    const inner = esSts[0].le.clone().addScaledVector(Z_AXIS, 0.7 * esSts[0].chord);
    const outer = esSts[esSts.length - 1].le
      .clone()
      .addScaledVector(Z_AXIS, 0.7 * esSts[esSts.length - 1].chord);
    const pivot = inner.clone().add(outer).multiplyScalar(0.5);
    const axis = outer.clone().sub(inner).normalize();
    if (axis.x < 0) axis.negate();
    const obj = new Group();
    const localPivot = pivot.clone().sub(thsPivot);
    obj.position.copy(localPivot);
    obj.add(
      mesh(loftWing(esSts, Z_AXIS, Y_AXIS, 0.7, 1, { symmetric: true, pivot }), mats.wingPlain),
    );
    ths.add(obj);
    elevators.push({ obj, base: localPivot, axis, slide: new Vector3() });
  }

  // ---- 垂直尾翼 + 方向舵 ----
  const vf = AIRCRAFT.vfin;
  const vfTan = Math.tan(vf.sweepDeg * DEG);
  const topY = vf.baseY + vf.height;
  const finStation = (y: number): LoftStation => {
    const t = (y - vf.baseY) / vf.height;
    return {
      le: new Vector3(0, y, vf.rootLeZ + (y - vf.baseY) * vfTan),
      chord: vf.rootChord + (vf.tipChord - vf.rootChord) * t,
      tc: 0.1,
    };
  };
  const finUv = (p: Vector3): [number, number] => [(p.z - 10.5) / 9, (p.y - 1.0) / 7.2];
  const finSts = [1.0, 2.5, 4.5, 6.5, topY].map(finStation);
  group.add(
    mesh(loftWing(finSts, Z_AXIS, X_AXIS, 0, 0.7, { symmetric: true, planarUv: finUv }), mats.fin),
  );
  const rSts = [vf.baseY + 0.15, 4.5, topY - 0.25].map(finStation);
  const rInner = rSts[0].le.clone().addScaledVector(Z_AXIS, 0.7 * rSts[0].chord);
  const rOuter = rSts[rSts.length - 1].le
    .clone()
    .addScaledVector(Z_AXIS, 0.7 * rSts[rSts.length - 1].chord);
  const rPivot = rInner.clone().add(rOuter).multiplyScalar(0.5);
  const rAxis = rOuter.clone().sub(rInner).normalize();
  const rudderObj = new Group();
  rudderObj.position.copy(rPivot);
  rudderObj.add(
    mesh(
      loftWing(rSts, Z_AXIS, X_AXIS, 0.7, 1, { symmetric: true, pivot: rPivot, planarUv: finUv }),
      mats.fin,
    ),
  );
  group.add(rudderObj);
  // 頂部整流尖端
  const cap = mesh(
    latheZ(
      [
        [0.001, 0],
        [0.12, 0.3],
        [0.14, 1.2],
        [0.001, 2.0],
      ],
      10,
    ),
    mats.fin,
  );
  cap.scale.set(1, 0.6, 1);
  cap.position.set(0, topY, finStation(topY).le.z);
  group.add(cap);

  return {
    group,
    aileronL: req(out.aileronL),
    aileronR: req(out.aileronR),
    spoilersL: out.spoilersL ?? [],
    spoilersR: out.spoilersR ?? [],
    flapsL: out.flapsL ?? [],
    flapsR: out.flapsR ?? [],
    slatsL: out.slatsL ?? [],
    slatsR: out.slatsR ?? [],
    ths,
    elevatorL: elevators[0],
    elevatorR: elevators[1],
    rudder: { obj: rudderObj, base: rPivot, axis: rAxis, slide: new Vector3() },
  };
}

function req<T>(v: T | undefined): T {
  if (v === undefined) throw new Error('wing part missing');
  return v;
}
