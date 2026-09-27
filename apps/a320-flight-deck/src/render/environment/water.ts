/**
 * 海面：大型平面（固定世界座標），頂點色依海床深度（淺水藍綠 → 深海藍），
 * 片段以三層捲動法線模擬波浪，PBR 低粗糙度提供菲涅耳環境反射與太陽/月光鏡面閃光。
 */
import {
  BufferAttribute,
  Color,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  type DataTexture,
} from 'three';
import { WORLD } from '../../sim/constants';
import { terrainHeight } from '../../sim/terrain';

const WIDTH = 260_000;
const DEPTH = 150_000;
const Z_START = 1_500;

export class WaterSystem {
  readonly mesh: Mesh<PlaneGeometry, MeshStandardMaterial>;
  private readonly timeUniform = { value: 0 };

  constructor(normalTex: DataTexture) {
    const geo = new PlaneGeometry(WIDTH, DEPTH, 520, 200);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, WORLD.seaLevelY, Z_START + DEPTH / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const deep = new Color(0.012, 0.05, 0.085);
    const mid = new Color(0.02, 0.11, 0.14);
    const shallow = new Color(0.06, 0.26, 0.27);
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const inWorld = Math.abs(x) < WORLD.halfSize && z < WORLD.halfSize;
      const depth = inWorld ? WORLD.seaLevelY - terrainHeight(x, z, 3) : 60;
      if (depth < 12) c.copy(shallow).lerp(mid, Math.max(0, depth) / 12);
      else c.copy(mid).lerp(deep, Math.min(1, (depth - 12) / 30));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new BufferAttribute(colors, 3));

    const mat = new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.07,
      metalness: 0,
      envMapIntensity: 1.1,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWaterNormal = { value: normalTex };
      shader.uniforms.uWaterTime = this.timeUniform;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(position, 1.0)).xyz;',
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying vec3 vWPos;\nuniform sampler2D uWaterNormal;\nuniform float uWaterTime;',
        )
        .replace(
          '#include <normal_fragment_maps>',
          `{
  vec2 wuv = vWPos.xz;
  float t = uWaterTime;
  vec3 a = texture2D(uWaterNormal, wuv / 131.0 + t * vec2(0.011, 0.007)).xyz * 2.0 - 1.0;
  vec3 b = texture2D(uWaterNormal, wuv / 29.0 - t * vec2(0.019, -0.012)).xyz * 2.0 - 1.0;
  vec3 c = texture2D(uWaterNormal, wuv / 870.0 + t * vec2(0.0021, 0.0034)).xyz * 2.0 - 1.0;
  float dist = length(vWPos - cameraPosition);
  float strength = mix(0.55, 0.12, smoothstep(1500.0, 25000.0, dist));
  vec2 slope = (a.xy * 0.8 + b.xy * 0.55 + c.xy * 0.9) * strength;
  vec3 wn = normalize(vec3(slope.x, 1.0, slope.y));
  normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
}`,
        );
    };
    mat.customProgramCacheKey = () => 'ocean-v1';
    this.mesh = new Mesh(geo, mat);
    this.mesh.name = 'ocean';
    this.mesh.receiveShadow = true;
    this.mesh.matrixAutoUpdate = false;
  }

  update(time: number, night: number): void {
    this.timeUniform.value = time;
    this.mesh.material.envMapIntensity = 1.1 - night * 0.5;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
