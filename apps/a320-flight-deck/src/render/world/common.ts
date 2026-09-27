/**
 * 機場/城市共用工具：Canvas、平面幾何、合併、HDR 燈點場（glow points）與燈具實例。
 */
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  Quaternion,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  UniformsLib,
  UniformsUtils,
  Vector3,
  type Material,
  type Texture,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export function canvas2d(
  w: number,
  h: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D 不可用');
  return { canvas, ctx };
}

export function canvasTexture(
  canvas: HTMLCanvasElement,
  srgb: boolean,
  repeat: boolean,
  anisotropy: number,
): CanvasTexture {
  const t = new CanvasTexture(canvas);
  if (srgb) t.colorSpace = SRGBColorSpace;
  if (repeat) {
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
  }
  t.anisotropy = anisotropy;
  return t;
}

/** 水平矩形（法線 +Y）；uvWorld>0 時 UV 以公尺為單位平鋪 */
export function flatRect(
  cx: number,
  cz: number,
  lenX: number,
  lenZ: number,
  y: number,
  yaw = 0,
  uvWorld = 0,
): BufferGeometry {
  const g = new PlaneGeometry(lenX, lenZ);
  g.rotateX(-Math.PI / 2);
  if (uvWorld > 0) {
    const uv = g.getAttribute('uv');
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (uv.getX(i) * lenX) / uvWorld, (uv.getY(i) * lenZ) / uvWorld);
  }
  if (yaw !== 0) g.rotateY(yaw);
  g.translate(cx, y, cz);
  return g;
}

export function box(
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
  yaw = 0,
): BufferGeometry {
  const g = new BoxGeometry(sx, sy, sz);
  if (yaw !== 0) g.rotateY(yaw);
  g.translate(cx, cy, cz);
  return g;
}

const _m = new Matrix4();
const _q = new Quaternion();
const _v = new Vector3();
const _z = new Vector3(0, 0, 1);

/** a→b 方向的長方體（空橋、橫桿） */
export function beam(a: Vector3, b: Vector3, w: number, h: number): BufferGeometry {
  const len = a.distanceTo(b);
  const g = new BoxGeometry(w, h, len);
  _v.subVectors(b, a).normalize();
  _q.setFromUnitVectors(_z, _v);
  _m.compose(new Vector3().addVectors(a, b).multiplyScalar(0.5), _q, new Vector3(1, 1, 1));
  g.applyMatrix4(_m);
  return g;
}

/** 合併；自動處理 indexed / non-indexed 混用並只保留 position/normal/uv */
export function merge(geoms: BufferGeometry[]): BufferGeometry {
  const anyNonIndexed = geoms.some((g) => g.index === null);
  const prepared = geoms.map((g) => {
    const src = anyNonIndexed && g.index !== null ? g.toNonIndexed() : g;
    for (const name of Object.keys(src.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') src.deleteAttribute(name);
    }
    return src;
  });
  const out = mergeGeometries(prepared, false);
  if (!out) throw new Error('幾何合併失敗');
  for (const g of geoms) g.dispose();
  return out;
}

// ---------------------------------------------------------------------------
// HDR 燈點場：以像素下限保證夜間遠距可見，具方向性衰減，霧中穿透較佳
// ---------------------------------------------------------------------------
export interface LightDef {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  /** 朝向（世界）；皆 0 = 全向 */
  fx?: number;
  fz?: number;
  i?: number;
}

export const LIGHT_COLORS = {
  white: [1, 0.93, 0.8],
  yellow: [1, 0.72, 0.18],
  green: [0.22, 1, 0.45],
  red: [1, 0.1, 0.06],
  blue: [0.18, 0.32, 1],
  sodium: [1, 0.58, 0.22],
  led: [0.85, 0.92, 1],
} as const satisfies Record<string, readonly [number, number, number]>;

export function light(
  x: number,
  y: number,
  z: number,
  c: readonly [number, number, number],
  fx = 0,
  fz = 0,
  i = 1,
): LightDef {
  return { x, y, z, r: c[0], g: c[1], b: c[2], fx, fz, i };
}

/** 全部燈點場共用的視窗半高（像素），由各模組每幀更新 */
export const VIEWPORT_HALF_HEIGHT = { value: 500 };

export function updateViewportUniform(renderScale: number): void {
  if (typeof window === 'undefined') return;
  VIEWPORT_HALF_HEIGHT.value =
    window.innerHeight * Math.min(window.devicePixelRatio || 1, 2) * renderScale * 0.5;
}

const glowVertex = /* glsl */ `
attribute vec3 lightColor;
attribute vec2 facing;
attribute float intensity;
uniform float uSize;
uniform float uMinPx;
uniform float uMaxPx;
uniform float uGain;
uniform float uHalfHeight;
varying vec3 vColor;
#include <common>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
void main() {
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
  float dist = max( -mvPosition.z, 0.1 );
  float dirF = 1.0;
  if ( dot( facing, facing ) > 0.0 ) {
    vec3 wp = ( modelMatrix * vec4( position, 1.0 ) ).xyz;
    vec3 toCam = normalize( cameraPosition - wp );
    dirF = mix( 0.1, 1.0, smoothstep( -0.15, 0.55, dot( toCam.xz, facing ) ) );
  }
  float px = uSize * projectionMatrix[1][1] * uHalfHeight / dist;
  gl_PointSize = clamp( px, uMinPx, uMaxPx );
  float energy = clamp( px / uMinPx, 0.3, 1.0 );
  vColor = lightColor * intensity * uGain * dirF * mix( 1.0, energy, 0.6 );
  #include <logdepthbuf_vertex>
  #include <fog_vertex>
  #ifdef USE_FOG
    vFogDepth *= 0.5;
  #endif
}
`;

const glowFragment = /* glsl */ `
varying vec3 vColor;
#include <common>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
void main() {
  #include <logdepthbuf_fragment>
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot( c, c );
  if ( r2 > 1.0 ) discard;
  vec3 col = vColor * ( exp( -r2 * 14.0 ) + exp( -r2 * 3.5 ) * 0.28 );
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
    #else
      float ff = smoothstep( fogNear, fogFar, vFogDepth );
    #endif
    col *= 1.0 - ff;
  #endif
  gl_FragColor = vec4( col, 1.0 );
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export interface GlowOptions {
  size: number; // 燈具實體尺寸（m）
  minPx: number;
  maxPx: number;
  dynamic?: boolean;
}

export class LightField {
  readonly points: Points;
  readonly material: ShaderMaterial;
  readonly colors: Float32Array;
  readonly intensities: Float32Array;
  readonly positions: Float32Array;
  private readonly geometry: BufferGeometry;

  constructor(defs: LightDef[], opts: GlowOptions) {
    const n = defs.length;
    this.positions = new Float32Array(n * 3);
    this.colors = new Float32Array(n * 3);
    this.intensities = new Float32Array(n);
    const facing = new Float32Array(n * 2);
    defs.forEach((d, k) => {
      this.positions.set([d.x, d.y, d.z], k * 3);
      this.colors.set([d.r, d.g, d.b], k * 3);
      facing.set([d.fx ?? 0, d.fz ?? 0], k * 2);
      this.intensities[k] = d.i ?? 1;
    });
    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('lightColor', new BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('facing', new BufferAttribute(facing, 2));
    this.geometry.setAttribute('intensity', new BufferAttribute(this.intensities, 1));
    this.geometry.computeBoundingSphere();
    this.material = new ShaderMaterial({
      uniforms: UniformsUtils.merge([
        UniformsLib.fog,
        {
          uSize: { value: opts.size },
          uMinPx: { value: opts.minPx },
          uMaxPx: { value: opts.maxPx },
          uGain: { value: 1 },
        },
      ]),
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: true,
    });
    this.material.uniforms.uHalfHeight = VIEWPORT_HALF_HEIGHT;
    this.points = new Points(this.geometry, this.material);
    this.points.renderOrder = 5;
    if (opts.dynamic) this.points.frustumCulled = false;
  }

  setGain(gain: number, minPx: number): void {
    this.material.uniforms.uGain.value = gain;
    this.material.uniforms.uMinPx.value = minPx;
    this.points.visible = gain > 0.01;
  }

  markColors(): void {
    this.geometry.getAttribute('lightColor').needsUpdate = true;
  }

  markIntensities(): void {
    this.geometry.getAttribute('intensity').needsUpdate = true;
  }

  markPositions(): void {
    this.geometry.getAttribute('position').needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

/** 燈具外殼（白天可見的彩色燈罩），MeshBasic × instanceColor，color 標量控制 HDR 強度 */
export function makeCaps(defs: LightDef[], radius: number, height: number): InstancedMesh {
  const geo = new BoxGeometry(radius * 2, height, radius * 2);
  geo.translate(0, -height / 2, 0);
  const mat = new MeshBasicMaterial({ color: 0xffffff });
  const mesh = new InstancedMesh(geo, mat, defs.length);
  const o = new Object3D();
  const c = new Color();
  defs.forEach((d, k) => {
    o.position.set(d.x, d.y, d.z);
    o.updateMatrix();
    mesh.setMatrixAt(k, o.matrix);
    mesh.setColorAt(k, c.setRGB(d.r, d.g, d.b));
  });
  mesh.computeBoundingSphere();
  return mesh;
}

/** 釋放 Object3D 樹內所有幾何/材質/貼圖 */
export function disposeTree(root: Object3D): void {
  const textures = new Set<Texture>();
  const materials = new Set<Material>();
  root.traverse((o) => {
    const m = o as Partial<{ geometry: BufferGeometry; material: Material | Material[] }>;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      materials.add(mat);
      for (const v of Object.values(mat)) if (v instanceof CanvasTexture) textures.add(v);
    }
  });
  for (const m of materials) m.dispose();
  for (const t of textures) t.dispose();
}
