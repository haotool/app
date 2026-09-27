/**
 * 雲：以 sim/weather.ts 的 CloudField（與物理進雲判定同一份）建立柔和 billboard 雲團。
 * 每個 puff 依品質拆成數片交錯 billboard；頂點著色器面向相機，片段依太陽方向/雲內高度著色，
 * 逆光時邊緣加銀邊；近距離淡出避免穿越時破面。連續雲層（overcast）另以上下兩片 fbm 雲海呈現。
 */
import {
  DoubleSide,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Color,
  Vector3,
  type DataTexture,
} from 'three';
import { getCloudField, type CloudField } from '../../sim/weather';
import type { WeatherState } from '../../sim/types';
import type { LightingInfo } from '../types';

const SUBS = [1, 2, 3, 5] as const;
const DRAW_RANGE = 75_000;

const puffVertex = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
attribute vec4 aOffset;
attribute vec4 aCluster;
attribute vec2 aMisc;
uniform vec3 uSunDir;
varying vec2 vUv;
varying float vShade;
varying float vHeightF;
varying float vAlpha;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float c = cos(aMisc.x);
  float s = sin(aMisc.x);
  vec2 p = vec2(c * position.x - s * position.y, s * position.x + c * position.y);
  vec3 world = aOffset.xyz + (camRight * p.x + camUp * p.y) * aOffset.w;
  vWorld = world;
  vec3 center = vec3(aCluster.x, (aCluster.y + aCluster.w) * 0.5, aCluster.z);
  vec3 dir = normalize(world - center + vec3(0.0, 1e-3, 0.0));
  vShade = dot(dir, uSunDir) * 0.5 + 0.5;
  vHeightF = clamp((world.y - aCluster.w) / max(aCluster.y - aCluster.w, 1.0), 0.0, 1.0);
  float dist = length(aOffset.xyz - cameraPosition);
  vAlpha = aMisc.y * smoothstep(aOffset.w * 0.35, aOffset.w * 1.1, dist);
  vec4 mvPosition = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <fog_vertex>
}`;

const puffFragment = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
uniform sampler2D uPuff;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uAmbient;
uniform float uFlash;
varying vec2 vUv;
varying float vShade;
varying float vHeightF;
varying float vAlpha;
varying vec3 vWorld;
void main() {
  #include <logdepthbuf_fragment>
  vec4 t = texture2D(uPuff, vUv);
  float dens = t.r;
  float a = dens * vAlpha;
  if (a < 0.004) discard;
  float sunTerm = mix(0.3, 1.0, vShade) * mix(0.5, 1.0, vHeightF) * (0.8 + t.g * 0.35);
  vec3 viewDir = normalize(vWorld - cameraPosition);
  float fwd = pow(max(dot(viewDir, uSunDir), 0.0), 7.0);
  float silver = fwd * (1.0 - dens) * 3.0;
  vec3 col = uAmbient * mix(0.55, 1.05, vHeightF) + uSunColor * (sunTerm + silver) + vec3(uFlash);
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

const layerVertex = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <fog_vertex>
}`;

const layerFragment = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
uniform sampler2D uNoise;
uniform vec3 uLit;
uniform vec3 uShadow;
uniform float uTop;
uniform float uTime;
varying vec3 vWorld;
void main() {
  #include <logdepthbuf_fragment>
  vec2 p = vWorld.xz + vec2(uTime * 3.0, uTime * 1.5);
  float n = texture2D(uNoise, p / 9000.0).r * 0.55 + texture2D(uNoise, p / 2300.0).g * 0.3 + texture2D(uNoise, p / 600.0).b * 0.15;
  float cov = smoothstep(0.28, 0.55, n);
  float edge = length(vWorld.xz - cameraPosition.xz);
  float a = mix(0.82, 0.98, cov) * (1.0 - smoothstep(52000.0, 68000.0, edge));
  vec3 col = mix(uShadow, uLit, uTop > 0.5 ? (0.7 + n * 0.45) : (0.35 + n * 0.3));
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

interface PuffRecord {
  x: number;
  y: number;
  z: number;
  size: number;
  cx: number;
  top: number;
  cz: number;
  base: number;
  rot: number;
  alpha: number;
}

export class CloudSystem {
  readonly group = new Group();
  private readonly geometry = new InstancedBufferGeometry();
  private readonly material: ShaderMaterial;
  private readonly puffMesh: Mesh<InstancedBufferGeometry, ShaderMaterial>;
  private readonly layerTop: Mesh<PlaneGeometry, ShaderMaterial>;
  private readonly layerBottom: Mesh<PlaneGeometry, ShaderMaterial>;
  private records: PuffRecord[] = [];
  private fieldKey = '';
  private detail = -1;
  private lastSort = -10;
  private readonly lastSortPos = new Vector3(1e9, 0, 0);
  private offsetAttr = new InstancedBufferAttribute(new Float32Array(4), 4);
  private clusterAttr = new InstancedBufferAttribute(new Float32Array(4), 4);
  private miscAttr = new InstancedBufferAttribute(new Float32Array(2), 2);
  private readonly lit = new Color();
  private readonly shadow = new Color();
  field: CloudField | null = null;

  constructor(puffTex: DataTexture, noiseTex: DataTexture) {
    const quad = new PlaneGeometry(2, 2);
    this.geometry.index = quad.index;
    this.geometry.setAttribute('position', quad.getAttribute('position'));
    this.geometry.setAttribute('uv', quad.getAttribute('uv'));
    this.geometry.instanceCount = 0;
    this.material = new ShaderMaterial({
      uniforms: UniformsUtils.merge([
        UniformsLib.fog,
        {
          uPuff: { value: puffTex },
          uSunDir: { value: new Vector3(0, 1, 0) },
          uSunColor: { value: new Color(1, 1, 1) },
          uAmbient: { value: new Color(0.5, 0.55, 0.6) },
          uFlash: { value: 0 },
        },
      ]),
      vertexShader: puffVertex,
      fragmentShader: puffFragment,
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    this.puffMesh = new Mesh(this.geometry, this.material);
    this.puffMesh.frustumCulled = false;
    this.puffMesh.renderOrder = 5;

    const makeLayer = (top: boolean): Mesh<PlaneGeometry, ShaderMaterial> => {
      const g = new PlaneGeometry(140_000, 140_000, 1, 1);
      g.rotateX(-Math.PI / 2);
      const m = new ShaderMaterial({
        uniforms: UniformsUtils.merge([
          UniformsLib.fog,
          {
            uNoise: { value: noiseTex },
            uLit: { value: new Color(1, 1, 1) },
            uShadow: { value: new Color(0.4, 0.4, 0.42) },
            uTop: { value: top ? 1 : 0 },
            uTime: { value: 0 },
          },
        ]),
        vertexShader: layerVertex,
        fragmentShader: layerFragment,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        fog: true,
      });
      const mesh = new Mesh(g, m);
      mesh.frustumCulled = false;
      mesh.renderOrder = 4;
      return mesh;
    };
    this.layerTop = makeLayer(true);
    this.layerBottom = makeLayer(false);
    this.group.add(this.layerBottom, this.layerTop, this.puffMesh);
    this.group.name = 'clouds';
  }

  private rebuild(field: CloudField, detail: number): void {
    const subs = SUBS[detail] ?? 1;
    let seed = 1337 + field.clusters.length;
    const rnd = (): number => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const recs: PuffRecord[] = [];
    for (const c of field.clusters) {
      for (const p of c.puffs) {
        for (let k = 0; k < subs; k++) {
          const j = subs === 1 ? 0 : p.r * 0.38;
          recs.push({
            x: c.x + p.dx + (rnd() * 2 - 1) * j,
            y: c.baseM + p.dy + p.r * 0.25 + (rnd() * 2 - 1) * j * 0.45,
            z: c.z + p.dz + (rnd() * 2 - 1) * j,
            size: p.r * (subs === 1 ? 1.25 : 0.95 + rnd() * 0.45),
            cx: c.x,
            top: c.topM,
            cz: c.z,
            base: c.baseM,
            rot: rnd() * Math.PI * 2,
            alpha: subs === 1 ? 0.95 : 0.55 + rnd() * 0.3,
          });
        }
      }
    }
    this.records = recs;
    const n = Math.max(1, recs.length);
    this.offsetAttr = new InstancedBufferAttribute(new Float32Array(n * 4), 4);
    this.clusterAttr = new InstancedBufferAttribute(new Float32Array(n * 4), 4);
    this.miscAttr = new InstancedBufferAttribute(new Float32Array(n * 2), 2);
    this.geometry.setAttribute('aOffset', this.offsetAttr);
    this.geometry.setAttribute('aCluster', this.clusterAttr);
    this.geometry.setAttribute('aMisc', this.miscAttr);
    this.geometry.instanceCount = 0;
    this.lastSort = -10;
  }

  /** 由遠而近排序並寫入屬性（透明混合正確）；節流執行 */
  private sort(cam: Vector3): void {
    const r = this.records;
    const d2 = new Float32Array(r.length);
    const visible: number[] = [];
    for (let i = 0; i < r.length; i++) {
      const dx = r[i].x - cam.x;
      const dy = r[i].y - cam.y;
      const dz = r[i].z - cam.z;
      d2[i] = dx * dx + dy * dy + dz * dz;
      if (d2[i] < DRAW_RANGE * DRAW_RANGE) visible.push(i);
    }
    visible.sort((a, b) => d2[b] - d2[a]);
    const off = this.offsetAttr.array as Float32Array;
    const clu = this.clusterAttr.array as Float32Array;
    const misc = this.miscAttr.array as Float32Array;
    for (let k = 0; k < visible.length; k++) {
      const p = r[visible[k]];
      off[k * 4] = p.x;
      off[k * 4 + 1] = p.y;
      off[k * 4 + 2] = p.z;
      off[k * 4 + 3] = p.size;
      clu[k * 4] = p.cx;
      clu[k * 4 + 1] = p.top;
      clu[k * 4 + 2] = p.cz;
      clu[k * 4 + 3] = p.base;
      misc[k * 2] = p.rot;
      misc[k * 2 + 1] = p.alpha;
    }
    this.offsetAttr.needsUpdate = true;
    this.clusterAttr.needsUpdate = true;
    this.miscAttr.needsUpdate = true;
    this.geometry.instanceCount = visible.length;
  }

  update(
    w: WeatherState,
    cam: Vector3,
    lighting: LightingInfo,
    detail: number,
    time: number,
  ): void {
    const field = getCloudField(w);
    this.field = field;
    if (field.key !== this.fieldKey || detail !== this.detail) {
      this.fieldKey = field.key;
      this.detail = detail;
      this.rebuild(field, detail);
    }
    if (time - this.lastSort > 0.4 || cam.distanceToSquared(this.lastSortPos) > 150 * 150) {
      this.lastSort = time;
      this.lastSortPos.copy(cam);
      this.sort(cam);
    }

    const u = this.material.uniforms;
    (u.uSunDir.value as Vector3).copy(lighting.sunDirection);
    (u.uSunColor.value as Color)
      .copy(lighting.sunColor)
      .multiplyScalar(lighting.sunIntensity * 0.34);
    (u.uAmbient.value as Color)
      .copy(lighting.skyHorizonColor)
      .multiplyScalar(0.55 + lighting.ambientIntensity * 0.45)
      .addScalar(0.04 * (1 - lighting.night));
    u.uFlash.value = w.lightning * 1.5;

    const layer = field.layer;
    this.layerTop.visible = this.layerBottom.visible = layer !== null;
    if (layer) {
      this.layerTop.position.set(cam.x, layer.topM, cam.z);
      this.layerBottom.position.set(cam.x, layer.baseM, cam.z);
      const lit = this.lit
        .copy(lighting.skyHorizonColor)
        .multiplyScalar(0.5)
        .add(this.shadow.copy(lighting.sunColor).multiplyScalar(lighting.sunIntensity * 0.32));
      const shadow = this.shadow
        .copy(lighting.skyHorizonColor)
        .multiplyScalar(0.55 * (1 - w.precipitation * 0.4))
        .addScalar(0.02 * (1 - lighting.night));
      for (const m of [this.layerTop, this.layerBottom]) {
        (m.material.uniforms.uLit.value as Color).copy(lit);
        (m.material.uniforms.uShadow.value as Color).copy(shadow);
        m.material.uniforms.uTime.value = time;
      }
    }
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    for (const m of [this.layerTop, this.layerBottom]) {
      m.geometry.dispose();
      m.material.dispose();
    }
  }
}
