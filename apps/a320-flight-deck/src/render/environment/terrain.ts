/**
 * 地形 tile + 距離 LOD：遠景層級建構時一次完成，近景高解析層級依相機距離每幀限量延遲建構。
 * 高度來自 sim/terrain.ts（與物理相同函式）；法線由外擴一圈的高度格有限差分，tile 邊界無接縫；
 * 以裙邊（skirt）遮蓋不同 LOD 間的 T 型裂縫。材質以 onBeforeCompile 做坡度/高度 splat。
 */
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  type DataTexture,
  type Vector3,
} from 'three';
import { AIRPORT, WORLD } from '../../sim/constants';
import { CITY, terrainHeight } from '../../sim/terrain';
import type { QualitySettings } from '../types';

const TILE = 8000;
const GRID = Math.round((WORLD.halfSize * 2) / TILE);
/** 各 LOD 切換距離（m，含高度） */
const LOD_DIST = [7000, 17000, 38000];
const OCTAVES = [6, 6, 5, 4];

interface Tile {
  cx: number;
  cz: number;
  meshes: (Mesh<BufferGeometry, MeshStandardMaterial> | null)[];
  current: number;
}

function buildTileGeometry(cx: number, cz: number, seg: number, octaves: number): BufferGeometry {
  const step = TILE / seg;
  const n = seg + 1;
  const ext = seg + 3; // 外擴一圈供法線
  const hs = new Float32Array(ext * ext);
  const x0 = cx - TILE / 2;
  const z0 = cz - TILE / 2;
  for (let j = 0; j < ext; j++) {
    for (let i = 0; i < ext; i++) {
      hs[j * ext + i] = terrainHeight(x0 + (i - 1) * step, z0 + (j - 1) * step, octaves);
    }
  }
  const skirtCount = seg * 4;
  const vCount = n * n + skirtCount;
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const h = hs[(j + 1) * ext + (i + 1)];
      const hl = hs[(j + 1) * ext + i];
      const hr = hs[(j + 1) * ext + (i + 2)];
      const hd = hs[j * ext + (i + 1)];
      const hu = hs[(j + 2) * ext + (i + 1)];
      const k = (j * n + i) * 3;
      pos[k] = i * step - TILE / 2;
      pos[k + 1] = h;
      pos[k + 2] = j * step - TILE / 2;
      let nx = hl - hr;
      let ny = 2 * step;
      let nz = hd - hu;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      nor[k] = nx;
      nor[k + 1] = ny;
      nor[k + 2] = nz;
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < seg; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * n + i;
      const b = a + 1;
      const c = a + n;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  // 裙邊：沿四邊逆時針取邊界頂點，複製並下拉
  const border: number[] = [];
  for (let i = 0; i < seg; i++) border.push(i);
  for (let j = 0; j < seg; j++) border.push(j * n + seg);
  for (let i = seg; i > 0; i--) border.push(seg * n + i);
  for (let j = seg; j > 0; j--) border.push(j * n);
  const drop = 30 + step * 0.6;
  const base = n * n;
  border.forEach((src, k) => {
    const dst = (base + k) * 3;
    pos[dst] = pos[src * 3];
    pos[dst + 1] = pos[src * 3 + 1] - drop;
    pos[dst + 2] = pos[src * 3 + 2];
    nor[dst] = nor[src * 3];
    nor[dst + 1] = nor[src * 3 + 1];
    nor[dst + 2] = nor[src * 3 + 2];
  });
  for (let k = 0; k < border.length; k++) {
    const a = border[k];
    const b = border[(k + 1) % border.length];
    const sa = base + k;
    const sb = base + ((k + 1) % border.length);
    idx.push(a, b, sa, b, sb, sa);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('normal', new BufferAttribute(nor, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return g;
}

function createTerrainMaterial(detail: DataTexture): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    color: new Color(1, 1, 1),
    roughness: 0.94,
    metalness: 0,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDetail = { value: detail };
    shader.uniforms.uCity = { value: [CITY.x, CITY.z, CITY.radius] };
    shader.uniforms.uAirport = { value: [AIRPORT.flattenHalfX + 600, AIRPORT.flattenHalfZ + 600] };
    shader.uniforms.uSea = { value: WORLD.seaLevelY };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTPos;\nvarying float vTUp;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvTPos = (modelMatrix * vec4(position, 1.0)).xyz;\nvTUp = normal.y;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vTPos;
varying float vTUp;
uniform sampler2D uDetail;
uniform vec3 uCity;
uniform vec2 uAirport;
uniform float uSea;
float tHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float gSnow = 0.0;
float gWet = 0.0;`,
      )
      .replace(
        '#include <map_fragment>',
        `{
  vec2 wp = vTPos.xz;
  float h = vTPos.y;
  float slope = 1.0 - clamp(vTUp, 0.0, 1.0);
  vec4 n1 = texture2D(uDetail, wp / 41.0);
  vec4 n2 = texture2D(uDetail, wp / 530.0);
  vec4 n3 = texture2D(uDetail, wp / 4300.0);
  vec4 n4 = texture2D(uDetail, wp / 9.0);
  float macro = n3.r * 0.6 + n2.g * 0.4;
  // 草地（乾濕色塊）
  vec3 grass = mix(vec3(0.16, 0.25, 0.08), vec3(0.34, 0.37, 0.15), smoothstep(0.3, 0.75, macro));
  grass = mix(grass, vec3(0.42, 0.40, 0.22), smoothstep(0.62, 0.85, n2.a) * 0.45);
  grass *= 0.82 + n1.b * 0.28 + (n4.g - 0.5) * 0.12;
  // 農田拼布
  mat2 rot = mat2(0.94, 0.34, -0.34, 0.94);
  vec2 fp = (rot * wp) / vec2(330.0, 210.0);
  vec2 cell = floor(fp);
  float hs = tHash(cell);
  vec3 crop = hs < 0.22 ? vec3(0.50, 0.43, 0.20) : hs < 0.45 ? vec3(0.25, 0.32, 0.11) : hs < 0.62 ? vec3(0.40, 0.31, 0.21) : hs < 0.8 ? vec3(0.31, 0.37, 0.14) : vec3(0.47, 0.47, 0.30);
  float rows = 0.9 + 0.1 * sin((hs > 0.5 ? fp.x : fp.y) * 90.0);
  crop *= rows * (0.88 + n1.r * 0.24);
  vec2 fe = abs(fract(fp) - 0.5);
  float hedge = smoothstep(0.465, 0.495, max(fe.x, fe.y));
  crop = mix(crop, vec3(0.12, 0.17, 0.07), hedge);
  vec2 ad = abs(wp) - uAirport;
  float airportMask = step(0.0, max(ad.x, ad.y));
  float cityDist = length(wp - uCity.xy);
  float farm = smoothstep(0.62, 0.48, n3.g) * smoothstep(140.0, 50.0, h) * smoothstep(0.1, 0.03, slope) * airportMask * smoothstep(uCity.z * 0.8, uCity.z * 1.15, cityDist);
  vec3 col = mix(grass, crop, farm);
  // 城市地面
  float city = 1.0 - smoothstep(uCity.z * 0.55, uCity.z * 1.05, cityDist);
  vec3 urban = vec3(0.30, 0.30, 0.29) * (0.8 + n1.g * 0.35) * (0.9 + 0.1 * step(0.5, tHash(floor(wp / 90.0))));
  col = mix(col, urban, city * 0.85);
  // 岩石（陡坡或高處）
  vec3 rock = mix(vec3(0.30, 0.28, 0.25), vec3(0.46, 0.43, 0.39), n1.a) * (0.85 + n4.r * 0.3);
  float rockMask = max(smoothstep(0.22, 0.42, slope + (n2.r - 0.5) * 0.15), smoothstep(1000.0, 1350.0, h + n2.b * 250.0) * 0.8);
  col = mix(col, rock, rockMask);
  // 山頂雪
  gSnow = smoothstep(1380.0, 1520.0, h + (n2.r - 0.5) * 320.0) * smoothstep(0.5, 0.3, slope);
  col = mix(col, vec3(0.9, 0.92, 0.96) * (0.92 + n1.b * 0.1), gSnow);
  // 海灘與水下
  // 沙灘只出現在海岸帶（與 sim/terrain.ts coastlineZ 主項一致），機場與內陸低地仍為草地
  float coastZ = 7200.0 + 2600.0 * sin(wp.x / 9000.0 + 0.6) + 900.0 * sin(wp.x / 2300.0);
  float sand = smoothstep(4.5, 1.5, h) * step(-6.0, h) * smoothstep(coastZ - 2400.0, coastZ - 1000.0, wp.y);
  col = mix(col, vec3(0.70, 0.63, 0.47) * (0.9 + n4.a * 0.2), sand * (1.0 - city));
  gWet = smoothstep(1.0, uSea, h);
  col = mix(col, vec3(0.30, 0.28, 0.22), gWet);
  diffuseColor.rgb *= col;
}`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.55, gSnow);\nroughnessFactor = mix(roughnessFactor, 0.35, gWet);',
      );
  };
  mat.customProgramCacheKey = () => 'terrain-splat-v1';
  return mat;
}

export class TerrainSystem {
  readonly group = new Group();
  private readonly material: MeshStandardMaterial;
  private tiles: Tile[] = [];
  private segments: number[] = [];
  private lastCheck = -1;
  private camX = 0;
  private camY = 0;
  private camZ = 0;

  constructor(quality: QualitySettings, detail: DataTexture) {
    this.material = createTerrainMaterial(detail);
    this.group.name = 'terrain';
    this.rebuild(quality);
  }

  private segsFor(q: QualitySettings): number[] {
    const s = q.terrainSegments;
    return [s * 2, s, Math.max(12, Math.round(s / 3)), 8];
  }

  rebuild(q: QualitySettings): void {
    this.disposeTiles();
    this.segments = this.segsFor(q);
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const cx = -WORLD.halfSize + (i + 0.5) * TILE;
        const cz = -WORLD.halfSize + (j + 0.5) * TILE;
        const tile: Tile = { cx, cz, meshes: [null, null, null, null], current: -1 };
        this.tiles.push(tile);
        // 遠景兩級預先建構，避免初次飛行時地形空洞
        this.ensure(tile, 3);
        this.ensure(tile, 2);
      }
    }
    // 機場周邊近景層級於載入時建妥
    for (const t of this.tiles) {
      const d = Math.hypot(t.cx, t.cz);
      if (d < 13000) this.ensure(t, 1);
      if (d < 6000) this.ensure(t, 0);
    }
    this.lastCheck = -1;
  }

  private ensure(t: Tile, level: number): Mesh<BufferGeometry, MeshStandardMaterial> {
    const existing = t.meshes[level];
    if (existing) return existing;
    const geo = buildTileGeometry(t.cx, t.cz, this.segments[level], OCTAVES[level]);
    const m = new Mesh(geo, this.material);
    m.position.set(t.cx, 0, t.cz);
    m.receiveShadow = true;
    m.visible = false;
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    t.meshes[level] = m;
    this.group.add(m);
    return m;
  }

  private desiredLevel(t: Tile): number {
    const dx = Math.max(0, Math.abs(this.camX - t.cx) - TILE / 2);
    const dz = Math.max(0, Math.abs(this.camZ - t.cz) - TILE / 2);
    const d = Math.hypot(dx, dz, Math.max(0, this.camY - 500) * 0.8);
    for (let l = 0; l < LOD_DIST.length; l++) if (d < LOD_DIST[l]) return l;
    return 3;
  }

  update(cameraPos: Vector3, time: number): void {
    this.camX = cameraPos.x;
    this.camY = cameraPos.y;
    this.camZ = cameraPos.z;
    if (time - this.lastCheck < 0.2 && this.lastCheck >= 0) return;
    this.lastCheck = time;
    let budget = 2; // 每次檢查最多建構兩個高解析 tile
    for (const t of this.tiles) {
      let want = this.desiredLevel(t);
      if (!t.meshes[want]) {
        if (budget > 0) {
          budget--;
          this.ensure(t, want);
        } else {
          // 尚未建好：先用已存在的最接近層級
          while (want < 3 && !t.meshes[want]) want++;
        }
      }
      if (want !== t.current) {
        const prev = t.current >= 0 ? t.meshes[t.current] : null;
        if (prev) prev.visible = false;
        const next = t.meshes[want];
        if (next) next.visible = true;
        t.current = want;
      }
      // 釋放遠離的高解析幾何，控制記憶體
      for (let l = 0; l < 2; l++) {
        const m = t.meshes[l];
        if (m && l < want - 1 && Math.hypot(this.camX - t.cx, this.camZ - t.cz) > 30000) {
          this.group.remove(m);
          m.geometry.dispose();
          t.meshes[l] = null;
        }
      }
    }
  }

  private disposeTiles(): void {
    for (const t of this.tiles) {
      for (const m of t.meshes) {
        if (m) {
          this.group.remove(m);
          m.geometry.dispose();
        }
      }
    }
    this.tiles = [];
  }

  dispose(): void {
    this.disposeTiles();
    this.material.dispose();
  }
}
