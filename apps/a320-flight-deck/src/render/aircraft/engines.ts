/**
 * LEAP-1A 風格發動機：短艙、進氣唇、風扇（InstancedMesh 葉片）、整流錐、核心排氣、派龍、反推平移外罩與格柵。
 */
import {
  BufferGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  type Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  RingGeometry,
  Shape,
  Vector3,
} from 'three';
import { AIRCRAFT } from '../../sim/constants';
import { latheZ } from './geometry';
import type { AircraftMaterials } from './materials';

export interface EngineParts {
  group: Group;
  fan: Group;
  transCowl: Group;
  blurMat: MeshBasicMaterial;
}

const BLADES = 18;
const FAN_Z = 0.92;

/** 寬弦後掠葉片（薄曲面，雙面） */
function bladeGeometry(): BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  const nr = 8;
  const nc = 5;
  const r0 = 0.33;
  const r1 = AIRCRAFT.engine.fanRadius - 0.015;
  for (let i = 0; i <= nr; i++) {
    const t = i / nr;
    const r = r0 + (r1 - r0) * t;
    const chord = 0.2 + 0.17 * Math.sin(Math.PI * Math.min(1, t * 0.8 + 0.2));
    const twist = (58 - 30 * t) * (Math.PI / 180);
    const sweep = 0.1 * t * t;
    for (let j = 0; j <= nc; j++) {
      const c = j / nc - 0.5;
      const bow = 0.02 * (1 - 4 * c * c);
      // 局部：切向 = x，軸向 = z
      const tang = c * chord * Math.cos(twist) + bow;
      const ax = c * chord * Math.sin(twist) + sweep;
      pos.push(tang, r, ax);
    }
  }
  const row = nc + 1;
  for (let i = 0; i < nr; i++) {
    for (let j = 0; j < nc; j++) {
      const a = i * row + j;
      idx.push(a, a + 1, a + row + 1, a, a + row + 1, a + row);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function mesh(g: BufferGeometry, m: Material, shadow = true): Mesh {
  const me = new Mesh(g, m);
  me.castShadow = shadow;
  me.receiveShadow = true;
  return me;
}

export function buildEngine(side: 1 | -1, mats: AircraftMaterials): EngineParts {
  const E = AIRCRAFT.engine;
  const group = new Group();
  group.name = side < 0 ? 'engine1' : 'engine2';
  group.position.set(side * E.x, E.y, E.inletZ);

  // 進氣唇（金屬）
  group.add(
    mesh(
      latheZ(
        [
          [0.985, 0.5],
          [1.0, 0.22],
          [1.04, 0.07],
          [1.1, 0.005],
          [1.16, 0.03],
          [1.195, 0.13],
          [1.212, 0.26],
        ],
        64,
      ),
      mats.metal,
    ),
  );
  // 進氣道內壁
  group.add(
    mesh(
      latheZ(
        [
          [0.985, 0.49],
          [0.99, FAN_Z + 0.25],
          [0.97, 1.45],
        ],
        48,
      ),
      mats.well,
      false,
    ),
  );
  // 風扇外罩（固定）
  group.add(
    mesh(
      latheZ(
        [
          [1.212, 0.26],
          [1.225, 0.8],
          [1.222, 1.6],
          [1.2, 2.2],
        ],
        64,
      ),
      mats.paint,
    ),
  );
  // 反推格柵（平移外罩後退時露出）
  group.add(
    mesh(
      latheZ(
        [
          [1.13, 2.18],
          [1.13, 2.8],
          [1.05, 2.82],
          [1.05, 2.2],
        ],
        48,
      ),
      mats.cascade,
      false,
    ),
  );
  // 平移外罩
  const transCowl = new Group();
  transCowl.add(
    mesh(
      latheZ(
        [
          [1.2, 2.2],
          [1.16, 2.7],
          [1.09, 3.1],
          [1.0, 3.42],
          [0.97, 3.38],
          [0.96, 2.9],
          [1.02, 2.22],
        ],
        64,
      ),
      mats.paint,
    ),
  );
  group.add(transCowl);
  // 核心外罩、噴嘴與尾錐
  group.add(
    mesh(
      latheZ(
        [
          [0.8, 1.4],
          [0.78, 2.5],
          [0.74, 3.2],
          [0.66, 3.9],
          [0.56, 4.3],
        ],
        48,
      ),
      mats.wingPlain,
    ),
  );
  group.add(
    mesh(
      latheZ(
        [
          [0.56, 4.3],
          [0.53, 4.42],
          [0.49, 4.43],
        ],
        40,
      ),
      mats.darkMetal,
    ),
  );
  group.add(
    mesh(
      latheZ(
        [
          [0.46, 4.2],
          [0.42, 4.5],
          [0.3, 4.8],
          [0.12, 5.0],
          [0.001, 5.05],
        ],
        32,
      ),
      mats.darkMetal,
    ),
  );

  // 風扇（整組繞 z 旋轉）
  const fan = new Group();
  fan.position.z = FAN_Z;
  group.add(fan);
  const blades = new InstancedMesh(bladeGeometry(), mats.fan, BLADES);
  const m = new Matrix4();
  const q = new Quaternion();
  const zAxis = new Vector3(0, 0, 1);
  const one = new Vector3(1, 1, 1);
  const zero = new Vector3();
  for (let i = 0; i < BLADES; i++) {
    q.setFromAxisAngle(zAxis, (i / BLADES) * Math.PI * 2);
    blades.setMatrixAt(i, m.compose(zero, q, one));
  }
  blades.castShadow = true;
  fan.add(blades);
  const spinner = mesh(
    latheZ(
      [
        [0.001, -0.62],
        [0.12, -0.5],
        [0.24, -0.3],
        [0.33, -0.05],
        [0.35, 0.12],
      ],
      32,
    ),
    mats.spinner,
  );
  fan.add(spinner);
  // 高轉速時的葉片殘影盤
  const blurMat = new MeshBasicMaterial({
    color: '#5b6066',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: DoubleSide,
  });
  const blur = new Mesh(new RingGeometry(0.34, AIRCRAFT.engine.fanRadius, 48), blurMat);
  blur.position.z = FAN_Z + 0.02;
  group.add(blur);

  // 派龍（側視輪廓擠出）
  const s = new Shape();
  const pts: [number, number][] = [
    [-6.0, -0.9],
    [-3.5, -0.72],
    [-1.6, -0.72],
    [1.8, -0.95],
    [2.2, -1.3],
    [0.5, -1.45],
    [-2.2, -1.25],
    [-3.6, -1.05],
    [-6.0, -1.0],
  ];
  pts.forEach(([z, y], i) => (i === 0 ? s.moveTo(z, y) : s.lineTo(z, y)));
  s.closePath();
  const pg = new ExtrudeGeometry(s, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 3,
    curveSegments: 4,
  });
  pg.rotateY(-Math.PI / 2);
  pg.translate(0.17, 0, 0);
  const pylon = mesh(pg, mats.paint);
  // 派龍幾何在機體座標，扣除發動機群組偏移
  pylon.position.set(0, -E.y, -E.inletZ);
  group.add(pylon);

  return { group, fan, transCowl, blurMat };
}
