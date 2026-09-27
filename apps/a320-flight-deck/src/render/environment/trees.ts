/**
 * 樹木：針葉/闊葉兩型 InstancedMesh，依森林雜訊成簇分布於草地緩坡；
 * 以 4×4 區塊切分，讓視錐剔除生效。避開機場、城市核心、水面與雪線。
 */
import {
  BufferAttribute,
  type BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { AIRPORT } from '../../sim/constants';
import { CITY, fbm, terrainHeight } from '../../sim/terrain';

const RANGE = 30_000;
const CHUNKS = 4;

function colored(geo: BufferGeometry, color: Color): BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) arr.set([color.r, color.g, color.b], i * 3);
  g.setAttribute('color', new BufferAttribute(arr, 3));
  return g;
}

function coniferGeometry(): BufferGeometry {
  const trunk = colored(
    new CylinderGeometry(0.08, 0.12, 0.3, 5).translate(0, 0.15, 0),
    new Color(0.25, 0.17, 0.1),
  );
  const low = colored(
    new ConeGeometry(0.42, 0.55, 7).translate(0, 0.45, 0),
    new Color(0.1, 0.19, 0.1),
  );
  const high = colored(
    new ConeGeometry(0.3, 0.5, 7).translate(0, 0.78, 0),
    new Color(0.12, 0.22, 0.11),
  );
  const g = mergeGeometries([trunk, low, high]);
  g.computeVertexNormals();
  return g;
}

function broadleafGeometry(): BufferGeometry {
  const trunk = colored(
    new CylinderGeometry(0.07, 0.1, 0.4, 5).translate(0, 0.2, 0),
    new Color(0.3, 0.21, 0.13),
  );
  const crownA = colored(
    new DodecahedronGeometry(0.4, 0).translate(0, 0.62, 0),
    new Color(0.17, 0.27, 0.1),
  );
  const crownB = colored(
    new DodecahedronGeometry(0.28, 0).translate(0.16, 0.8, 0.06),
    new Color(0.2, 0.31, 0.12),
  );
  const g = mergeGeometries([trunk, crownA, crownB]);
  g.computeVertexNormals();
  return g;
}

export class TreeSystem {
  readonly group = new Group();
  private readonly material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
  });
  private readonly geos = [coniferGeometry(), broadleafGeometry()];

  constructor(count: number, castShadow: boolean) {
    this.group.name = 'trees';
    this.build(count, castShadow);
  }

  build(count: number, castShadow: boolean): void {
    this.clear();
    // 候選點：確定性亂數 + 森林遮罩
    let seed = 424242;
    const rnd = (): number => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const buckets: { m: Matrix4; type: number; c: Color }[][] = Array.from(
      { length: CHUNKS * CHUNKS },
      () => [],
    );
    const m = new Matrix4();
    const q = new Quaternion();
    const up = new Vector3(0, 1, 0);
    const p = new Vector3();
    const s = new Vector3();
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 25) {
      attempts++;
      const x = (rnd() * 2 - 1) * RANGE;
      const z = (rnd() * 2 - 1) * RANGE;
      if (Math.abs(x) < AIRPORT.flattenHalfX + 900 && Math.abs(z) < AIRPORT.flattenHalfZ + 900)
        continue;
      if (Math.hypot(x - CITY.x, z - CITY.z) < CITY.radius * 0.75) continue;
      const forest = fbm(x / 2200 + 40, z / 2200 - 13, 4);
      if (forest < 0.5 + rnd() * 0.12) continue;
      const h = terrainHeight(x, z, 4);
      if (h < 3 || h > 1250) continue;
      const slope =
        Math.abs(terrainHeight(x + 15, z, 4) - h) + Math.abs(terrainHeight(x, z + 15, 4) - h);
      if (slope > 12) continue;
      const type = h > 450 || rnd() < 0.3 ? 0 : 1;
      const height = 9 + rnd() * 12;
      q.setFromAxisAngle(up, rnd() * Math.PI * 2);
      s.set(height * (0.8 + rnd() * 0.4), height, height * (0.8 + rnd() * 0.4));
      p.set(x, h - 0.4, z);
      m.compose(p, q, s);
      const ci = Math.min(CHUNKS - 1, Math.floor(((x + RANGE) / (RANGE * 2)) * CHUNKS));
      const cj = Math.min(CHUNKS - 1, Math.floor(((z + RANGE) / (RANGE * 2)) * CHUNKS));
      const tint = 0.75 + rnd() * 0.45;
      const autumn = type === 1 && rnd() < 0.18;
      buckets[cj * CHUNKS + ci].push({
        m: m.clone(),
        type,
        c: autumn
          ? new Color(1.6 * tint, 1.1 * tint, 0.5 * tint)
          : new Color(tint, tint * (0.95 + rnd() * 0.1), tint),
      });
      placed++;
    }
    for (const bucket of buckets) {
      for (let type = 0; type < 2; type++) {
        const items = bucket.filter((b) => b.type === type);
        if (items.length === 0) continue;
        const im = new InstancedMesh(this.geos[type], this.material, items.length);
        items.forEach((it, i) => {
          im.setMatrixAt(i, it.m);
          im.setColorAt(i, it.c);
        });
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.computeBoundingSphere();
        im.castShadow = castShadow;
        im.receiveShadow = true;
        this.group.add(im);
      }
    }
  }

  private clear(): void {
    for (const c of [...this.group.children]) {
      if (c instanceof InstancedMesh) c.dispose();
      this.group.remove(c);
    }
  }

  dispose(): void {
    this.clear();
    for (const g of this.geos) g.dispose();
    this.material.dispose();
  }
}
