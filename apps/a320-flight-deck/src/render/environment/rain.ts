/**
 * 雨絲：相機周圍箱體內的 InstancedBufferGeometry 細長四邊形，頂點著色器以 fract 環繞。
 * 方向 = 空氣中雨滴速度（下落 + 風）相對於相機速度，因此高速飛行時雨絲呈斜線迎面而來。
 */
import {
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector3,
  BufferAttribute,
} from 'three';

const BOX = 64;

const vertex = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
attribute vec3 aSeed;
uniform vec3 uCam;
uniform vec3 uOffset;
uniform vec3 uVel;
uniform float uLen;
uniform float uMinDist;
varying float vAlpha;
varying float vAlong;
void main() {
  vec3 local = fract(aSeed + uOffset / ${BOX.toFixed(1)}) * ${BOX.toFixed(1)} - ${(BOX / 2).toFixed(1)};
  vec3 world = uCam + local;
  float dist = length(local);
  vec3 dir = normalize(uVel);
  vec3 toCam = normalize(world - cameraPosition);
  vec3 side = normalize(cross(dir, toCam) + vec3(1e-4, 0.0, 0.0));
  vec3 wp = world - dir * position.y * uLen + side * position.x * (0.006 + dist * 0.0006);
  vAlong = position.y;
  vAlpha = smoothstep(uMinDist, uMinDist + 1.5, dist) * (1.0 - smoothstep(${(BOX * 0.32).toFixed(1)}, ${(BOX * 0.5).toFixed(1)}, dist));
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <fog_vertex>
}`;

const fragment = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uIntensity;
varying float vAlpha;
varying float vAlong;
void main() {
  #include <logdepthbuf_fragment>
  float a = vAlpha * uIntensity * (1.0 - abs(vAlong * 2.0 - 1.0) * 0.6);
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

export class RainSystem {
  readonly mesh: Mesh<InstancedBufferGeometry, ShaderMaterial>;
  private readonly geometry = new InstancedBufferGeometry();
  private readonly offset = new Vector3();
  private readonly lastCam = new Vector3();
  private readonly camVel = new Vector3();
  private hasLast = false;

  constructor(count: number) {
    // 單位四邊形：x ∈ [-1, 1] 寬度、y ∈ [0, 1] 沿雨絲
    this.geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0]), 3),
    );
    this.geometry.setIndex([0, 1, 2, 1, 3, 2]);
    this.mesh = new Mesh(
      this.geometry,
      new ShaderMaterial({
        uniforms: UniformsUtils.merge([
          UniformsLib.fog,
          {
            uCam: { value: new Vector3() },
            uOffset: { value: new Vector3() },
            uVel: { value: new Vector3(0, -9, 0) },
            uLen: { value: 1 },
            uMinDist: { value: 0.5 },
            uColor: { value: new Color(0.7, 0.72, 0.75) },
            uIntensity: { value: 0 },
          },
        ]),
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        fog: true,
      }),
    );
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    this.mesh.name = 'rain';
    this.setCount(count);
  }

  setCount(count: number): void {
    const seeds = new Float32Array(count * 3);
    let s = 7777;
    for (let i = 0; i < seeds.length; i++) {
      s = (s * 16807) % 2147483647;
      seeds[i] = s / 2147483647;
    }
    this.geometry.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 3));
    this.geometry.instanceCount = count;
  }

  /**
   * @param intensity 0..1（降雨量 × 是否在雲底之下）
   * @param wind 世界風速（m/s）
   */
  update(
    cam: Vector3,
    dt: number,
    intensity: number,
    wind: Vector3,
    color: Color,
    inCockpit: boolean,
  ): void {
    if (this.hasLast && dt > 0) {
      this.camVel.subVectors(cam, this.lastCam).divideScalar(dt);
      if (this.camVel.lengthSq() > 400 * 400) this.camVel.set(0, 0, 0); // 相機切換瞬移
    }
    this.lastCam.copy(cam);
    this.hasLast = true;
    this.mesh.visible = intensity > 0.01;
    if (!this.mesh.visible) return;
    const u = this.mesh.material.uniforms;
    const vel = u.uVel.value as Vector3;
    vel.set(wind.x, -9, wind.z).sub(this.camVel);
    this.offset.addScaledVector(vel, dt);
    this.offset.set(
      ((this.offset.x % BOX) + BOX) % BOX,
      ((this.offset.y % BOX) + BOX) % BOX,
      ((this.offset.z % BOX) + BOX) % BOX,
    );
    (u.uOffset.value as Vector3).copy(this.offset);
    (u.uCam.value as Vector3).copy(cam);
    u.uLen.value = Math.min(4, Math.max(0.5, vel.length() * 0.022));
    u.uMinDist.value = inCockpit ? 3.8 : 0.6;
    u.uIntensity.value = 0.32 * intensity;
    (u.uColor.value as Color).copy(color);
  }

  dispose(): void {
    this.geometry.dispose();
    this.mesh.material.dispose();
  }
}
