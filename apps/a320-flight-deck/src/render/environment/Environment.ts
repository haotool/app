/**
 * 環境總成：天空/日月星、太陽與天光、PMREM 環境反射、霧與能見度、地形、海、樹、雲、雨。
 * 只讀 FrameContext；lighting 每幀更新供其他渲染模組（機場燈、座艙、外部燈光）取用。
 */
import {
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  PMREMGenerator,
  Vector3,
  type Scene,
  type WebGLRenderTarget,
  type WebGLRenderer,
} from 'three';
import { FT } from '../../sim/constants';
import { windVector } from '../../sim/weather';
import type { FrameContext, LightingInfo, QualitySettings } from '../types';
import { CloudSystem } from './clouds';
import { RainSystem } from './rain';
import { SkySystem } from './sky';
import { TerrainSystem } from './terrain';
import { makeCloudPuffTexture, makeNoiseTexture, makeWaterNormalTexture } from './textures';
import { TreeSystem } from './trees';
import { WaterSystem } from './water';

const smooth = (e0: number, e1: number, v: number): number => {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

const HEMI_SKY = new Color(0.55, 0.65, 0.85);

export class Environment {
  readonly lighting: LightingInfo = {
    sunDirection: new Vector3(0, 1, 0),
    sunColor: new Color(1, 1, 1),
    sunIntensity: 3,
    ambientIntensity: 0.6,
    night: 0,
    dusk: 0,
    fogColor: new Color(0.7, 0.78, 0.88),
    skyHorizonColor: new Color(0.7, 0.78, 0.88),
  };
  readonly sun = new DirectionalLight(0xffffff, 3);

  private readonly scene: Scene;
  private readonly hemi = new HemisphereLight(0xbcd4ff, 0x3a3326, 0.6);
  private readonly fog = new FogExp2(0xb4c4d8, 0.00005);
  private readonly pmrem: PMREMGenerator;
  private envTarget: WebGLRenderTarget | null = null;
  private envKey = '';
  private envTime = -99;
  private quality: QualitySettings;

  private readonly sky = new SkySystem();
  private readonly terrain: TerrainSystem;
  private readonly water: WaterSystem;
  private readonly trees: TreeSystem;
  private readonly clouds: CloudSystem;
  private readonly rain: RainSystem;
  private readonly noiseTex;
  private readonly waterNormalTex;
  private readonly puffTex;

  private readonly focus = new Vector3();
  private focusRadius = 60;
  private readonly tmpA = new Vector3();
  private readonly tmpB = new Vector3();
  private readonly tmpC = new Vector3();
  private readonly wind = new Vector3();
  private readonly windXZ = { x: 0, z: 0 };
  private readonly rainColor = new Color();
  private readonly groundColor = new Color();
  private readonly cloudFog = new Color();

  constructor(scene: Scene, renderer: WebGLRenderer, quality: QualitySettings) {
    this.scene = scene;
    this.quality = quality;
    this.pmrem = new PMREMGenerator(renderer);
    this.noiseTex = makeNoiseTexture(256, quality.anisotropy);
    this.waterNormalTex = makeWaterNormalTexture(256, quality.anisotropy);
    this.puffTex = makeCloudPuffTexture(128);

    scene.fog = this.fog;
    scene.add(this.sky.group);

    this.sun.name = 'sun';
    this.sun.shadow.bias = -0.0004;
    this.applyShadowSettings(quality);
    scene.add(this.sun, this.sun.target, this.hemi);

    this.terrain = new TerrainSystem(quality, this.noiseTex);
    this.water = new WaterSystem(this.waterNormalTex);
    this.trees = new TreeSystem(
      quality.treeCount,
      quality.level === 'HIGH' || quality.level === 'ULTRA',
    );
    this.clouds = new CloudSystem(this.puffTex, this.noiseTex);
    this.rain = new RainSystem(quality.rainDrops);
    scene.add(
      this.terrain.group,
      this.water.mesh,
      this.trees.group,
      this.clouds.group,
      this.rain.mesh,
    );
  }

  private applyShadowSettings(q: QualitySettings): void {
    this.sun.castShadow = q.shadows;
    if (this.sun.shadow.mapSize.x !== q.shadowMapSize) {
      this.sun.shadow.mapSize.set(q.shadowMapSize, q.shadowMapSize);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
    }
  }

  setShadowFocus(center: Vector3, radius: number): void {
    this.focus.copy(center);
    this.focusRadius = Math.max(2, radius);
  }

  /** 陰影相機：以焦點為中心、依 texel 大小對齊避免移動時閃爍 */
  private updateShadowCamera(): void {
    const dir = this.lighting.sunDirection;
    const r = this.focusRadius;
    const cam = this.sun.shadow.camera;
    cam.left = -r;
    cam.right = r;
    cam.top = r;
    cam.bottom = -r;
    const dist = r * 4 + 400;
    cam.near = 1;
    cam.far = dist + r * 3;
    cam.updateProjectionMatrix();
    this.sun.shadow.normalBias = r * 0.0009;

    // 光空間基底
    const right = this.tmpA.set(0, 1, 0).cross(dir);
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    right.normalize();
    const up = this.tmpB.copy(dir).cross(right).normalize();
    const texel = (2 * r) / this.sun.shadow.mapSize.x;
    const fr = Math.round(this.focus.dot(right) / texel) * texel;
    const fu = Math.round(this.focus.dot(up) / texel) * texel;
    const fd = this.focus.dot(dir);
    const snapped = this.tmpC
      .copy(right)
      .multiplyScalar(fr)
      .addScaledVector(up, fu)
      .addScaledVector(dir, fd);
    this.sun.target.position.copy(snapped);
    this.sun.position.copy(snapped).addScaledVector(dir, dist);
    this.sun.target.updateMatrixWorld();
  }

  update(frame: FrameContext): void {
    const w = frame.state.weather;
    const cam = frame.camera.position;
    const L = this.lighting;
    const field = this.clouds.field;
    const aboveLayer = field?.layer ? cam.y > field.layer.topM : false;

    this.sky.computeLighting(w, L, aboveLayer);

    // 在雲中：光線漫射化
    const inCloud = Math.min(1, w.cloudDensityAtAircraft * 1.3);
    const camCloud = frame.cameraInCockpit ? inCloud : inCloud * 0.6;
    L.sunIntensity *= 1 - camCloud * 0.7;

    // 霧：能見度 → FogExp2 密度（5% 對比門檻），雲中大幅加濃
    const baseVis = Math.max(40, w.visibility);
    const vis = baseVis * (1 - camCloud) + 55 * camCloud;
    this.fog.density = 1.9 / Math.min(vis, 70000);
    this.fog.color.copy(L.fogColor);
    if (camCloud > 0) {
      this.cloudFog.setRGB(0.78, 0.8, 0.84).multiplyScalar(0.12 + 0.88 * (1 - L.night));
      this.fog.color.lerp(this.cloudFog, camCloud);
    }

    this.sky.update(cam, w, L, aboveLayer, frame.time);

    // 光源
    this.sun.color.copy(L.sunColor);
    this.sun.intensity = L.sunIntensity;
    this.sun.castShadow = frame.quality.shadows && L.sunIntensity > 0.05;
    this.hemi.color.copy(L.skyHorizonColor).lerp(HEMI_SKY, 0.35 * (1 - L.night));
    this.groundColor.setRGB(0.22, 0.2, 0.15).multiplyScalar(0.3 + 0.7 * (1 - L.night));
    this.hemi.groundColor.copy(this.groundColor);
    this.hemi.intensity = L.ambientIntensity * 0.55;
    // PMREM 來源為物理散射天空（HDR 輻亮度高），需縮放以免整體過曝
    this.scene.environmentIntensity =
      0.05 + 0.2 * (1 - L.night) * (1 - camCloud * 0.4) + w.lightning * 0.5;
    this.updateShadowCamera();

    this.updateEnvMap(w.cloudCover, w.precipitation, aboveLayer, frame.time);

    this.terrain.update(cam, frame.time);
    this.water.update(frame.time, L.night);
    this.clouds.update(w, cam, L, frame.quality.cloudDetail, frame.time);

    // 雨：只在雲頂以下
    windVector(w, cam.y, this.windXZ);
    this.wind.set(this.windXZ.x, 0, this.windXZ.z);
    const belowTop = 1 - smooth(w.cloudTop * FT - 200, w.cloudTop * FT + 200, cam.y);
    this.rainColor
      .copy(L.fogColor)
      .multiplyScalar(1.15)
      .addScalar(0.05 + w.lightning * 0.8);
    this.rain.update(
      cam,
      frame.dt,
      w.precipitation * belowTop,
      this.wind,
      this.rainColor,
      frame.cameraInCockpit,
    );
  }

  /** 天空變化超過門檻才重建 PMREM（節流 1.5 s） */
  private updateEnvMap(cover: number, precip: number, aboveLayer: boolean, time: number): void {
    const key = `${Math.round(this.sky.sunElevation / 1.5)}|${cover.toFixed(1)}|${precip.toFixed(1)}|${aboveLayer ? 1 : 0}`;
    if (key === this.envKey) return;
    if (this.envTarget && time - this.envTime < 1.5) return;
    this.envKey = key;
    this.envTime = time;
    this.sky.setSunDisc(false);
    const rt = this.pmrem.fromScene(this.sky.envScene, 0.02, 0.1, 2000);
    this.sky.setSunDisc(true);
    this.envTarget?.dispose();
    this.envTarget = rt;
    this.scene.environment = rt.texture;
  }

  setQuality(q: QualitySettings): void {
    const prev = this.quality;
    this.quality = q;
    this.applyShadowSettings(q);
    if (q.terrainSegments !== prev.terrainSegments) this.terrain.rebuild(q);
    if (q.treeCount !== prev.treeCount || q.level !== prev.level) {
      this.trees.build(q.treeCount, q.level === 'HIGH' || q.level === 'ULTRA');
    }
    if (q.rainDrops !== prev.rainDrops) this.rain.setCount(q.rainDrops);
    for (const t of [this.noiseTex, this.waterNormalTex]) {
      t.anisotropy = q.anisotropy;
      t.needsUpdate = true;
    }
  }

  dispose(): void {
    this.scene.remove(this.sky.group, this.sun, this.sun.target, this.hemi);
    this.scene.remove(
      this.terrain.group,
      this.water.mesh,
      this.trees.group,
      this.clouds.group,
      this.rain.mesh,
    );
    if (this.scene.fog === this.fog) this.scene.fog = null;
    if (this.scene.environment && this.scene.environment === this.envTarget?.texture) {
      this.scene.environment = null;
    }
    this.envTarget?.dispose();
    this.pmrem.dispose();
    this.sky.dispose();
    this.terrain.dispose();
    this.water.dispose();
    this.trees.dispose();
    this.clouds.dispose();
    this.rain.dispose();
    this.noiseTex.dispose();
    this.waterNormalTex.dispose();
    this.puffTex.dispose();
    this.sun.shadow.map?.dispose();
  }
}
