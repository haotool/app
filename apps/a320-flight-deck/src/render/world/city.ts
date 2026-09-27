/**
 * CityWorld：東南平原城市。InstancedMesh 建築（分 chunk、程序窗格 shader：日間玻璃反射 / 夜間隨機亮窗）、
 * 道路網格與路燈、沿路移動車流（車體 + 頭尾燈）、海岸港口與船舶。
 */
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
  type Scene,
} from 'three';
import { WORLD } from '../../sim/constants';
import { CITY, coastlineZ, fbm, terrainHeight } from '../../sim/terrain';
import type { FrameContext, QualitySettings } from '../types';
import {
  disposeTree,
  light,
  LIGHT_COLORS,
  LightField,
  merge,
  rng,
  smoothstep,
  updateViewportUniform,
  type LightDef,
} from './common';

const PITCH = 115;
const ANGLE = 0.2; // 街廓網格旋轉
const CA = Math.cos(ANGLE);
const SA = Math.sin(ANGLE);
const CHUNK = 3000;
const MIN_X = 4700; // 機場壓平區以東

interface Building {
  x: number;
  z: number;
  base: number;
  w: number;
  d: number;
  h: number;
  color: number;
}

interface Path {
  xs: Float32Array;
  ys: Float32Array;
  zs: Float32Array;
  cum: Float32Array;
  length: number;
  lane: number;
}

const toWorld = (u: number, v: number): [number, number] => [
  CITY.x + u * CA - v * SA,
  CITY.z + u * SA + v * CA,
];

function density(x: number, z: number): number {
  const d = Math.hypot(x - CITY.x, z - CITY.z);
  const f = 1 - smoothstep(CITY.radius * 0.3, CITY.radius * 1.2, d);
  return f * (0.55 + 0.9 * fbm(x / 2500 + 7.1, z / 2500 - 2.3, 2));
}

function isLand(x: number, z: number): boolean {
  return x > MIN_X && z < coastlineZ(x) - 150 && terrainHeight(x, z, 4) > 0.8;
}

/** 窗格 shader 注入（標準材質 onBeforeCompile，保留 PBR、陰影、霧、logdepth） */
function makeWindowMaterial(
  uNight: { value: number },
  uTime: { value: number },
): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({ roughness: 0.85, metalness: 0.05 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = uNight;
    shader.uniforms.uTime = uTime;
    shader.vertexShader =
      'varying vec3 vCityPos;\nvarying vec3 vCityN;\nvarying float vCitySeed;\nvarying float vCityBase;\n' +
      shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        /* glsl */ `#include <worldpos_vertex>
        vec4 cwPos = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          cwPos = instanceMatrix * cwPos;
          vCitySeed = fract( sin( dot( instanceMatrix[3].xz, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
          vCityBase = instanceMatrix[3].y;
          vCityN = normalize( mat3( modelMatrix ) * mat3( instanceMatrix ) * objectNormal );
        #else
          vCitySeed = 0.5;
          vCityBase = 0.0;
          vCityN = normalize( mat3( modelMatrix ) * objectNormal );
        #endif
        cwPos = modelMatrix * cwPos;
        vCityPos = cwPos.xyz;`,
      );
    shader.fragmentShader =
      /* glsl */ `uniform float uNight;
uniform float uTime;
varying vec3 vCityPos;
varying vec3 vCityN;
varying float vCitySeed;
varying float vCityBase;
float cityHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
` +
      shader.fragmentShader
        .replace(
          '#include <color_fragment>',
          /* glsl */ `#include <color_fragment>
          float cWall = 1.0 - step( 0.5, abs( vCityN.y ) );
          float cU = abs( vCityN.x ) > abs( vCityN.z ) ? vCityPos.z : vCityPos.x;
          float cV = vCityPos.y - vCityBase;
          float cGlassy = step( 0.74, vCitySeed );
          vec2 cCell = vec2( cU / mix( 3.2, 1.8, cGlassy ), cV / 3.6 );
          vec2 cF = fract( cCell );
          vec2 cId = floor( cCell );
          float cAA = clamp( 1.0 - length( fwidth( cCell ) ) * 1.2, 0.0, 1.0 );
          float cPane = mix(
            step( 0.2, cF.x ) * step( cF.x, 0.84 ) * step( 0.28, cF.y ) * step( cF.y, 0.86 ),
            step( 0.07, cF.x ) * step( 0.12, cF.y ), cGlassy );
          float cMask = cWall * step( 3.2, cV ) * mix( mix( 0.4, 0.8, cGlassy ), cPane, cAA );
          float cRnd = cityHash( cId + vCitySeed * 97.13 );
          vec3 cGlass = mix( vec3( 0.05, 0.07, 0.09 ), vec3( 0.15, 0.19, 0.23 ), cRnd );
          diffuseColor.rgb = mix( diffuseColor.rgb, cGlass, cMask );`,
        )
        .replace(
          '#include <roughnessmap_fragment>',
          '#include <roughnessmap_fragment>\nroughnessFactor = mix( roughnessFactor, 0.12, cMask );',
        )
        .replace(
          '#include <metalnessmap_fragment>',
          '#include <metalnessmap_fragment>\nmetalnessFactor = mix( metalnessFactor, 0.55, cMask );',
        )
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `#include <emissivemap_fragment>
          float cSlot = floor( uTime / 45.0 + cRnd * 13.0 );
          float cLit = step( 0.6, cityHash( cId * 1.731 + vec2( cSlot * 0.37, vCitySeed * 11.0 ) ) );
          cLit = mix( 0.4, cLit, cAA );
          vec3 cLamp = mix( vec3( 1.0, 0.72, 0.42 ), vec3( 0.72, 0.84, 1.0 ), step( 0.7, cityHash( cId + 3.7 ) ) );
          totalEmissiveRadiance += cMask * cLit * cLamp * uNight * ( 1.1 + cRnd * 1.3 );`,
        );
  };
  mat.customProgramCacheKey = () => 'city-windows-v1';
  return mat;
}

/** 以兩端點建立水平帶狀四邊形（非索引） */
function pushStrip(
  out: number[],
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  w: number,
): void {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz) || 1;
  const nx = (-dz / len) * (w / 2);
  const nz = (dx / len) * (w / 2);
  const p = [
    ax - nx,
    ay,
    az - nz,
    ax + nx,
    ay,
    az + nz,
    bx + nx,
    by,
    bz + nz,
    bx - nx,
    by,
    bz - nz,
  ];
  // 逆時針（由上往下看）→ 法線 +Y
  out.push(
    p[0],
    p[1],
    p[2],
    p[3],
    p[4],
    p[5],
    p[6],
    p[7],
    p[8],
    p[0],
    p[1],
    p[2],
    p[6],
    p[7],
    p[8],
    p[9],
    p[10],
    p[11],
  );
}

function makePath(pts: [number, number, number][], lane: number): Path {
  const n = pts.length;
  const xs = new Float32Array(n);
  const ys = new Float32Array(n);
  const zs = new Float32Array(n);
  const cum = new Float32Array(n);
  pts.forEach(([x, y, z], i) => {
    xs[i] = x;
    ys[i] = y;
    zs[i] = z;
    if (i > 0) cum[i] = cum[i - 1] + Math.hypot(x - xs[i - 1], z - zs[i - 1]);
  });
  return { xs, ys, zs, cum, length: cum[n - 1], lane };
}

export class CityWorld {
  private readonly group = new Group();
  private quality: QualitySettings;
  private readonly uNight = { value: 0 };
  private readonly uTime = { value: 0 };
  private streetLights: LightField | null = null;
  private carLights: LightField | null = null;
  private shipLights: LightField | null = null;
  private carBodies: InstancedMesh | null = null;
  private paths: Path[] = [];
  private carPath = new Int16Array(0);
  private carS = new Float32Array(0);
  private carSpeed = new Float32Array(0);
  private carDir = new Float32Array(0);
  private readonly obj = new Object3D();
  private readonly camPos = new Vector3();

  constructor(
    private readonly scene: Scene,
    quality: QualitySettings,
  ) {
    this.quality = quality;
    this.group.name = 'CityWorld';
    this.build();
    scene.add(this.group);
  }

  private build(): void {
    const r = rng(4242);
    const roadPts: number[] = [];
    const lightDefs: LightDef[] = [];
    this.buildBuildings(r);
    this.buildRoads(r, roadPts, lightDefs);
    this.buildHarbor(r);
    const roadGeo = new BufferGeometry();
    roadGeo.setAttribute('position', new BufferAttribute(new Float32Array(roadPts), 3));
    roadGeo.computeVertexNormals();
    const roads = new Mesh(
      roadGeo,
      new MeshStandardMaterial({
        color: 0x3a3c3f,
        roughness: 0.92,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    roads.receiveShadow = true;
    this.group.add(roads);
    this.streetLights = new LightField(lightDefs, { size: 0.7, minPx: 1.6, maxPx: 10 });
    this.group.add(this.streetLights.points);
    this.buildCars(r);
  }

  private buildBuildings(r: () => number): void {
    const q = this.quality;
    const N = Math.ceil((CITY.radius * 1.25) / PITCH);
    const palette = [
      0xc9c3b8, 0xb8b4ad, 0xa8a49c, 0xd6d0c4, 0x9a6b55, 0x8c7a6a, 0xbfb8a8, 0x9ea4a8,
    ];
    const glassPalette = [0x6d8494, 0x5b7282, 0x7f8f8a, 0x8a96a3];
    const chunks = new Map<string, Building[]>();
    const push = (b: Building): void => {
      const k = `${Math.floor(b.x / CHUNK)},${Math.floor(b.z / CHUNK)}`;
      const list = chunks.get(k);
      if (list) list.push(b);
      else chunks.set(k, [b]);
    };
    for (let gi = -N; gi <= N; gi++) {
      for (let gj = -N; gj <= N; gj++) {
        for (const [ou, ov] of [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ]) {
          const [x, z] = toWorld(gi * PITCH + ou * PITCH * 0.25, gj * PITCH + ov * PITCH * 0.25);
          const f = density(x, z);
          const roll = r();
          const keep = r();
          if (roll > f || keep > q.cityDensity || !isLand(x, z)) continue;
          const dc = Math.hypot(x - CITY.x, z - CITY.z);
          const c = 1 - smoothstep(0, CITY.radius * 0.45, dc);
          let w = 16 + r() * 28;
          let d = 16 + r() * 28;
          let h = 6 + r() * r() * (18 + 150 * c);
          let color = palette[Math.floor(r() * palette.length)];
          if (c > 0.4 && r() < 0.14 * c) {
            h = 90 + r() * 150;
            w = 24 + r() * 18;
            d = 24 + r() * 18;
            color = glassPalette[Math.floor(r() * glassPalette.length)];
          }
          if (Math.abs(z) < 700 && x > 1600 && x < 30000) h = Math.min(h, 60);
          const base = terrainHeight(x, z, 4) - 1.5;
          push({ x, z, base, w, d, h: h + 1.5, color });
          if (h > 60 && r() < 0.5)
            push({ x, z, base: base + h + 1.5, w: w * 0.68, d: d * 0.68, h: h * 0.22, color });
          if (h > 18 && r() < 0.7) {
            const top = base + h + 1.5;
            const n = 1 + Math.floor(r() * 3);
            for (let k = 0; k < n; k++)
              push({
                x: x + (r() - 0.5) * w * 0.5,
                z: z + (r() - 0.5) * d * 0.5,
                base: top,
                w: 3 + r() * 5,
                d: 3 + r() * 5,
                h: 2 + r() * 2.5,
                color: 0x8b9095,
              });
          }
        }
      }
    }
    const geo = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const mat = makeWindowMaterial(this.uNight, this.uTime);
    const o = this.obj;
    const col = new Color();
    for (const list of chunks.values()) {
      const mesh = new InstancedMesh(geo, mat, list.length);
      list.forEach((b, k) => {
        o.position.set(b.x, b.base, b.z);
        o.rotation.set(0, -ANGLE, 0);
        o.scale.set(b.w, b.h, b.d);
        o.updateMatrix();
        mesh.setMatrixAt(k, o.matrix);
        mesh.setColorAt(k, col.setHex(b.color));
      });
      mesh.computeBoundingSphere();
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
    o.scale.set(1, 1, 1);
  }

  private buildRoads(r: () => number, out: number[], lights: LightDef[]): void {
    const N = Math.ceil((CITY.radius * 1.25) / PITCH);
    const h = (x: number, z: number): number => terrainHeight(x, z, 4) + 0.6;
    const lightKeep = 0.45 + 0.55 * this.quality.cityDensity;
    this.paths = [];
    for (const axis of [0, 1]) {
      for (let i = -N; i < N; i++) {
        const line = i * PITCH + PITCH / 2;
        const avenue = i % 5 === 0;
        const width = avenue ? 18 : 10;
        let run: [number, number, number][] = [];
        const flush = (): void => {
          if (avenue && run.length > 4) this.paths.push(makePath(run, 3));
          run = [];
        };
        for (let j = -N; j < N; j++) {
          const a = j * PITCH + PITCH / 2;
          const b = a + PITCH;
          const [ax, az] = axis === 0 ? toWorld(line, a) : toWorld(a, line);
          const [bx, bz] = axis === 0 ? toWorld(line, b) : toWorld(b, line);
          const mx = (ax + bx) / 2;
          const mz = (az + bz) / 2;
          if (density(mx, mz) < 0.08 || !isLand(ax, az) || !isLand(bx, bz)) {
            flush();
            continue;
          }
          const ay = h(ax, az);
          const by = h(bx, bz);
          pushStrip(out, ax, ay, az, bx, by, bz, width);
          if (run.length === 0) run.push([ax, ay, az]);
          run.push([bx, by, bz]);
          for (const t of [0.25, 0.75]) {
            if (r() > lightKeep) continue;
            const side = t < 0.5 ? 1 : -1;
            const len = Math.hypot(bx - ax, bz - az);
            const nx = (-(bz - az) / len) * side * (width / 2 + 1);
            const nz = ((bx - ax) / len) * side * (width / 2 + 1);
            lights.push(
              light(
                ax + (bx - ax) * t + nx,
                ay + 8,
                az + (bz - az) * t + nz,
                r() < 0.7 ? LIGHT_COLORS.sodium : LIGHT_COLORS.led,
                0,
                0,
                0.8 + r() * 0.4,
              ),
            );
          }
        }
        flush();
      }
    }
    // 機場聯外快速道路（二次 Bezier）
    const hw: [number, number, number][] = [];
    const [ex, ez] = toWorld(-2000, -2600);
    for (let k = 0; k <= 60; k++) {
      const t = k / 60;
      const x = (1 - t) * (1 - t) * 3900 + 2 * (1 - t) * t * 7200 + t * t * ex;
      const z = (1 - t) * (1 - t) * -705 + 2 * (1 - t) * t * -1800 + t * t * ez;
      hw.push([x, Math.max(terrainHeight(x, z, 4), 0) + 0.8, z]);
    }
    // 濱海道路
    const coast: [number, number, number][] = [];
    for (let x = 5500; x <= 17500; x += 150) {
      const z = coastlineZ(x) - 260;
      const y = terrainHeight(x, z, 4);
      if (y < 0.8) break;
      coast.push([x, y + 0.7, z]);
    }
    for (const [pts, width] of [
      [hw, 22],
      [coast, 14],
    ] as const) {
      if (pts.length < 2) continue;
      for (let k = 1; k < pts.length; k++) {
        const [ax, ay, az] = pts[k - 1];
        const [bx, by, bz] = pts[k];
        pushStrip(out, ax, ay, az, bx, by, bz, width);
        if (k % 2 === 0) lights.push(light(bx, by + 10, bz, LIGHT_COLORS.led, 0, 0, 1));
      }
      this.paths.push(makePath([...pts], width === 22 ? 4.5 : 3));
    }
  }

  private buildHarbor(r: () => number): void {
    const piers: BufferGeometry[] = [];
    const hulls: { x: number; z: number; len: number; c: number; yaw: number }[] = [];
    const containers: { x: number; z: number; y: number; c: number }[] = [];
    const lights: LightDef[] = [];
    const sea = WORLD.seaLevelY;
    for (let x = 7000; x <= 15500; x += 1700) {
      const c = coastlineZ(x);
      if (terrainHeight(x, c - 80, 4) < 0) continue;
      const g = new BoxGeometry(30, 6, 400).translate(x, sea + 1, c + 120);
      piers.push(g);
      for (let k = 0; k < 18; k++)
        containers.push({
          x: x + (r() - 0.5) * 20,
          z: c + 20 + r() * 260,
          y: sea + 4 + Math.floor(r() * 3) * 2.6,
          c: [0xb3322b, 0x1d3f7a, 0x2f7d3b, 0xe07b1a, 0x7d8286][Math.floor(r() * 5)],
        });
      hulls.push({
        x: x + 32,
        z: c + 150 + r() * 120,
        len: 110 + r() * 60,
        c: [0x2b3a55, 0x6b1f1f, 0x333333][Math.floor(r() * 3)],
        yaw: 0,
      });
      lights.push(light(x, sea + 12, c + 310, LIGHT_COLORS.sodium, 0, 0, 1.2));
    }
    for (let k = 0; k < 4; k++) {
      const x = 8000 + k * 2300 + r() * 600;
      hulls.push({
        x,
        z: coastlineZ(x) + 2200 + r() * 1500,
        len: 150 + r() * 90,
        c: 0x2b3a55,
        yaw: r() * Math.PI,
      });
    }
    if (piers.length === 0) return;
    const pierMesh = new Mesh(
      merge(piers),
      new MeshStandardMaterial({ color: 0x8f8d88, roughness: 0.9 }),
    );
    pierMesh.receiveShadow = true;
    this.group.add(pierMesh);
    const o = this.obj;
    const col = new Color();
    const hullMesh = new InstancedMesh(
      new BoxGeometry(1, 1, 1),
      new MeshStandardMaterial({ roughness: 0.6, metalness: 0.3 }),
      hulls.length,
    );
    const supMesh = new InstancedMesh(
      new BoxGeometry(1, 1, 1),
      new MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 }),
      hulls.length,
    );
    hulls.forEach((s, k) => {
      o.rotation.set(0, s.yaw, 0);
      o.position.set(s.x, sea + 2.5, s.z);
      o.scale.set(20, 10, s.len);
      o.updateMatrix();
      hullMesh.setMatrixAt(k, o.matrix);
      hullMesh.setColorAt(k, col.setHex(s.c));
      const back = s.len * 0.38;
      o.position.set(s.x + Math.sin(s.yaw) * back, sea + 12, s.z + Math.cos(s.yaw) * back);
      o.scale.set(16, 12, 14);
      o.updateMatrix();
      supMesh.setMatrixAt(k, o.matrix);
      lights.push(
        light(
          s.x + Math.sin(s.yaw) * back,
          sea + 20,
          s.z + Math.cos(s.yaw) * back,
          LIGHT_COLORS.white,
          0,
          0,
          1,
        ),
      );
      lights.push(
        light(
          s.x - Math.sin(s.yaw) * s.len * 0.45,
          sea + 10,
          s.z - Math.cos(s.yaw) * s.len * 0.45,
          LIGHT_COLORS.white,
          0,
          0,
          0.7,
        ),
      );
    });
    const contMesh = new InstancedMesh(
      new BoxGeometry(2.4, 2.6, 12),
      new MeshStandardMaterial({ roughness: 0.6, metalness: 0.4 }),
      containers.length,
    );
    o.rotation.set(0, 0, 0);
    o.scale.set(1, 1, 1);
    containers.forEach((cn, k) => {
      o.position.set(cn.x, cn.y, cn.z);
      o.updateMatrix();
      contMesh.setMatrixAt(k, o.matrix);
      contMesh.setColorAt(k, col.setHex(cn.c));
    });
    for (const m of [hullMesh, supMesh, contMesh]) {
      m.computeBoundingSphere();
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    }
    this.shipLights = new LightField(lights, { size: 0.9, minPx: 1.8, maxPx: 12 });
    this.group.add(this.shipLights.points);
  }

  private buildCars(r: () => number): void {
    const total = this.paths.reduce((s, p) => s + p.length, 0);
    const n = total > 0 ? Math.round(650 * this.quality.cityDensity) : 0;
    this.carPath = new Int16Array(n);
    this.carS = new Float32Array(n);
    this.carSpeed = new Float32Array(n);
    this.carDir = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      let pick = r() * total;
      let p = 0;
      while (p < this.paths.length - 1 && pick > this.paths[p].length)
        pick -= this.paths[p++].length;
      this.carPath[k] = p;
      this.carS[k] = r() * this.paths[p].length;
      this.carSpeed[k] = 10 + r() * 9;
      this.carDir[k] = r() < 0.5 ? 1 : -1;
    }
    const palette = [0xdedede, 0x1c1c1c, 0x8a8f94, 0x2d4c7a, 0x8d1f1f, 0xc8c2b4];
    this.carBodies = new InstancedMesh(
      new BoxGeometry(1.8, 1.45, 4.4).translate(0, 0.72, 0),
      new MeshStandardMaterial({ roughness: 0.3, metalness: 0.6 }),
      Math.max(n, 1),
    );
    this.carBodies.count = n;
    this.carBodies.frustumCulled = false;
    const col = new Color();
    for (let k = 0; k < n; k++)
      this.carBodies.setColorAt(k, col.setHex(palette[Math.floor(r() * palette.length)]));
    this.group.add(this.carBodies);
    const defs: LightDef[] = [];
    for (let k = 0; k < n; k++)
      defs.push(
        light(0, 0, 0, LIGHT_COLORS.white, 0, 0, 0.9),
        light(0, 0, 0, LIGHT_COLORS.red, 0, 0, 0.6),
      );
    this.carLights = new LightField(defs, { size: 0.35, minPx: 1.3, maxPx: 6, dynamic: true });
    this.group.add(this.carLights.points);
    this.moveCars(0, true, true);
  }

  private moveCars(dt: number, bodies: boolean, lightsOn: boolean): void {
    const lp = this.carLights?.positions;
    const o = this.obj;
    for (let k = 0; k < this.carS.length; k++) {
      const p = this.paths[this.carPath[k]];
      let s = this.carS[k] + this.carDir[k] * this.carSpeed[k] * dt;
      if (s > p.length) {
        s = p.length;
        this.carDir[k] = -1;
      } else if (s < 0) {
        s = 0;
        this.carDir[k] = 1;
      }
      this.carS[k] = s;
      let lo = 0;
      let hi = p.cum.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (p.cum[mid] <= s) lo = mid;
        else hi = mid;
      }
      const seg = p.cum[hi] - p.cum[lo] || 1;
      const t = (s - p.cum[lo]) / seg;
      const tx = (p.xs[hi] - p.xs[lo]) / seg;
      const tz = (p.zs[hi] - p.zs[lo]) / seg;
      const dir = this.carDir[k];
      const hx = tx * dir;
      const hz = tz * dir;
      const x = p.xs[lo] + (p.xs[hi] - p.xs[lo]) * t - hz * p.lane;
      const z = p.zs[lo] + (p.zs[hi] - p.zs[lo]) * t + hx * p.lane;
      const y = p.ys[lo] + (p.ys[hi] - p.ys[lo]) * t;
      if (bodies && this.carBodies) {
        o.position.set(x, y, z);
        o.rotation.set(0, Math.atan2(-hx, -hz), 0);
        o.updateMatrix();
        this.carBodies.setMatrixAt(k, o.matrix);
      }
      if (lightsOn && lp) {
        lp[k * 6] = x + hx * 2.3;
        lp[k * 6 + 1] = y + 0.7;
        lp[k * 6 + 2] = z + hz * 2.3;
        lp[k * 6 + 3] = x - hx * 2.3;
        lp[k * 6 + 4] = y + 0.8;
        lp[k * 6 + 5] = z - hz * 2.3;
      }
    }
    if (bodies && this.carBodies) this.carBodies.instanceMatrix.needsUpdate = true;
    if (lightsOn) this.carLights?.markPositions();
  }

  update(frame: FrameContext): void {
    updateViewportUniform(frame.quality.renderScale);
    const night = frame.lighting.night;
    this.uNight.value = night;
    this.uTime.value = frame.time;
    const lowVis = 1 - smoothstep(800, 5000, frame.state.weather.visibility);
    const g = Math.max(0, night - 0.08) * 3 * (1 + lowVis);
    this.streetLights?.setGain(g, 1.4 + night * 1.2);
    this.shipLights?.setGain(0.3 + g, 1.4 + night * 1.2);
    this.carLights?.setGain(g * 0.9, 1.2 + night);
    frame.camera.getWorldPosition(this.camPos);
    const dist = Math.hypot(this.camPos.x - CITY.x, this.camPos.z - CITY.z);
    const near = dist < CITY.radius + 9000 && this.camPos.y < 6000;
    if (this.carBodies) this.carBodies.visible = near;
    const lightsOn = g > 0.01 && dist < 60000;
    if (near || lightsOn) this.moveCars(Math.min(frame.dt, 0.1), near, lightsOn);
  }

  setQuality(q: QualitySettings): void {
    const rebuild = q.cityDensity !== this.quality.cityDensity;
    this.quality = q;
    if (!rebuild) return;
    disposeTree(this.group);
    this.group.clear();
    this.streetLights = null;
    this.carLights = null;
    this.shipLights = null;
    this.carBodies = null;
    this.build();
  }

  dispose(): void {
    this.scene.remove(this.group);
    disposeTree(this.group);
  }
}
