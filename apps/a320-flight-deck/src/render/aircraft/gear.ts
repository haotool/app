/**
 * 起落架：前架（雙輪、轉向、前收）與左右主架（雙輪、內收），油氣支柱壓縮、輪轉與艙門。
 */
import { BoxGeometry, CylinderGeometry, Group, type Material, Mesh } from 'three';
import { AIRCRAFT } from '../../sim/constants';
import { latheZ } from './geometry';
import type { AircraftMaterials } from './materials';

export interface GearLeg {
  hinge: Group; // 收放樞軸
  steer: Group; // 前架轉向（主架為固定）
  piston: Group; // 隨壓縮上移
  wheels: Group[]; // 輪轉
  axleRest: number; // 未壓縮時輪軸 y（相對 hinge）
  door: Group | null;
}

export interface GearParts {
  legs: [GearLeg, GearLeg, GearLeg];
  noseDoors: [Group, Group];
  mainDoors: [Group, Group];
  noseLightMount: Group;
}

function m(g: ConstructorParameters<typeof Mesh>[0], mat: Material): Mesh {
  const me = new Mesh(g, mat);
  me.castShadow = true;
  me.receiveShadow = true;
  return me;
}

/** 輪胎 + 輪轂（軸向 X） */
function wheel(radius: number, width: number, mats: AircraftMaterials): Group {
  const g = new Group();
  const k = radius / 0.585;
  const hw = width / 2;
  const prof: [number, number][] = [
    [0.33 * k, -hw * 0.92],
    [0.5 * k, -hw],
    [0.56 * k, -hw * 0.86],
    [radius, -hw * 0.5],
    [radius, hw * 0.5],
    [0.56 * k, hw * 0.86],
    [0.5 * k, hw],
    [0.33 * k, hw * 0.92],
    [0.33 * k, -hw * 0.92],
  ];
  const tire = m(latheZ(prof, 36), mats.tire);
  tire.rotation.y = Math.PI / 2;
  g.add(tire);
  const hub = m(new CylinderGeometry(0.34 * k, 0.34 * k, width * 0.86, 24), mats.strut);
  hub.rotation.z = Math.PI / 2;
  g.add(hub);
  // 輪轂螺栓圈（使轉動可辨識）
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const bolt = m(new BoxGeometry(width * 0.9, 0.05 * k, 0.05 * k), mats.darkMetal);
    bolt.position.set(0, Math.cos(a) * 0.2 * k, Math.sin(a) * 0.2 * k);
    g.add(bolt);
  }
  return g;
}

function cyl(r: number, len: number, mat: Material): Mesh {
  const c = m(new CylinderGeometry(r, r, len, 16), mat);
  c.position.y = -len / 2;
  return c;
}

function buildLeg(i: 0 | 1 | 2, mats: AircraftMaterials): GearLeg {
  const G = AIRCRAFT.gear[i];
  const nose = i === 0;
  const hinge = new Group();
  hinge.position.set(G.x, G.strutTop, G.z);
  const axleRest = G.y + G.wheelRadius - G.strutTop;
  const outerLen = Math.abs(axleRest) * 0.62;
  hinge.add(cyl(nose ? 0.11 : 0.17, outerLen, mats.strut));
  const steer = new Group();
  hinge.add(steer);
  const piston = new Group();
  steer.add(piston);
  piston.position.y = axleRest;
  // 活塞（鍍鉻）與輪軸
  const pistonLen = Math.abs(axleRest) * 0.55;
  const pr = m(
    new CylinderGeometry(nose ? 0.075 : 0.12, nose ? 0.075 : 0.12, pistonLen, 16),
    mats.chrome,
  );
  pr.position.y = pistonLen / 2;
  piston.add(pr);
  const spread = nose ? 0.26 : 0.47;
  const axle = m(new CylinderGeometry(0.07, 0.07, spread * 2 + 0.1, 10), mats.strut);
  axle.rotation.z = Math.PI / 2;
  piston.add(axle);
  const wheels: Group[] = [];
  for (const s of [-1, 1]) {
    const w = wheel(G.wheelRadius, nose ? 0.24 : 0.4, mats);
    w.position.x = s * spread;
    piston.add(w);
    wheels.push(w);
  }
  // 扭力臂
  const link = m(new BoxGeometry(0.06, pistonLen * 0.9, 0.16), mats.strut);
  link.position.set(0, pistonLen * 0.5, nose ? -0.14 : 0.2);
  link.rotation.x = nose ? 0.25 : -0.25;
  piston.add(link);

  let door: Group | null = null;
  if (!nose) {
    // 側撐桿（向機身中心斜上）
    const side = Math.sign(G.x);
    const braceLen = 1.6;
    const brace = m(new CylinderGeometry(0.06, 0.06, braceLen, 10), mats.strut);
    brace.position.set(-side * 0.55, -0.55, 0.12);
    brace.rotation.z = side * 0.95;
    hinge.add(brace);
    // 支柱艙門（隨支柱）
    door = new Group();
    const panel = m(new BoxGeometry(0.03, 1.55, 1.0), mats.paint);
    panel.position.set(side * 0.24, -0.85, 0);
    door.add(panel);
    hinge.add(door);
  }
  return { hinge, steer, piston, wheels, axleRest, door };
}

function doorPanel(
  w: number,
  len: number,
  mat: Material,
  hingeX: number,
  y: number,
  z: number,
  towardX: number,
): Group {
  const pivot = new Group();
  pivot.position.set(hingeX, y, z);
  const p = m(new BoxGeometry(w, 0.03, len), mat);
  p.position.x = towardX * (w / 2);
  pivot.add(p);
  return pivot;
}

export function buildGear(mats: AircraftMaterials, parent: Group): GearParts {
  const legs: [GearLeg, GearLeg, GearLeg] = [
    buildLeg(0, mats),
    buildLeg(1, mats),
    buildLeg(2, mats),
  ];
  for (const l of legs) parent.add(l.hinge);
  // 前架燈座（隨轉向組）
  const noseLightMount = new Group();
  noseLightMount.position.set(0, legs[0].axleRest + 0.75, -0.24);
  legs[0].steer.add(noseLightMount);

  const noseZ = AIRCRAFT.gear[0].z;
  const noseDoors: [Group, Group] = [
    doorPanel(0.44, 2.3, mats.livery, -0.45, -2.02, noseZ - 0.9, 1),
    doorPanel(0.44, 2.3, mats.livery, 0.45, -2.02, noseZ - 0.9, -1),
  ];
  const mainDoors: [Group, Group] = [
    doorPanel(1.3, 1.6, mats.navy, -0.35, -2.42, 1.4, -1),
    doorPanel(1.3, 1.6, mats.navy, 0.35, -2.42, 1.4, 1),
  ];
  for (const d of [...noseDoors, ...mainDoors]) parent.add(d);
  return { legs, noseDoors, mainDoors, noseLightMount };
}

const DEG = Math.PI / 180;

export interface GearInput {
  position: readonly number[];
  doors: readonly number[];
  compression: readonly number[];
  wheelAngle: readonly number[];
  steerAngle: number;
}

export function updateGear(p: GearParts, s: GearInput): void {
  for (let i = 0; i < 3; i++) {
    const leg = p.legs[i];
    const ext = s.position[i];
    const fold = 1 - ext;
    if (i === 0) leg.hinge.rotation.x = fold * 95 * DEG;
    else leg.hinge.rotation.z = (i === 1 ? 1 : -1) * fold * 88 * DEG;
    leg.hinge.visible = ext > 0.004 || s.doors[i] > 0.01;
    leg.piston.position.y = leg.axleRest + (ext > 0.99 ? s.compression[i] : 0);
    for (const w of leg.wheels) w.rotation.x = -s.wheelAngle[i];
  }
  p.legs[0].steer.rotation.y = -s.steerAngle * DEG;
  const nd = s.doors[0] * 82 * DEG;
  p.noseDoors[0].rotation.z = -nd;
  p.noseDoors[1].rotation.z = nd;
  const md = s.doors[1] * 85 * DEG;
  p.mainDoors[0].rotation.z = md;
  p.mainDoors[1].rotation.z = -(s.doors[2] * 85 * DEG);
}
