/**
 * 天空：Preetham 物理散射天空 + 陰天罩 + 夜空（星、月、地平光害）。
 * 太陽位置由本地時與緯度計算；同一組天空物件也放入環境場景供 PMREM 產生反射環境圖。
 */
import {
  AdditiveBlending,
  NormalBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Vector3,
} from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import type { LightingInfo } from '../types';
import type { WeatherState } from '../../sim/types';

const LATITUDE = 25 * (Math.PI / 180);
const DECLINATION = -1.6 * (Math.PI / 180); // 九月下旬
const STAR_RADIUS = 52_000;
const DUSK_HORIZON = new Color(0.95, 0.55, 0.36);
const NIGHT_HORIZON = new Color(0.02, 0.035, 0.07);
const LIGHTNING_FOG = new Color(0.8, 0.82, 0.95);
const MOON_DISTANCE = 46_000;

const smooth = (e0: number, e1: number, v: number): number => {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** 太陽方向（世界座標：北 = -z、東 = +x），回傳高度角（度） */
export function sunDirectionAt(timeOfDay: number, out: Vector3): number {
  const H = (timeOfDay - 12) * 15 * (Math.PI / 180);
  const sinEl =
    Math.sin(LATITUDE) * Math.sin(DECLINATION) +
    Math.cos(LATITUDE) * Math.cos(DECLINATION) * Math.cos(H);
  const el = Math.asin(sinEl);
  const az = Math.atan2(
    -Math.cos(DECLINATION) * Math.sin(H),
    Math.sin(DECLINATION) * Math.cos(LATITUDE) -
      Math.cos(DECLINATION) * Math.cos(H) * Math.sin(LATITUDE),
  );
  out.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
  return el * (180 / Math.PI);
}

function makeSkyMesh(): Sky {
  const sky = new Sky();
  const m = sky.material;
  m.fragmentShader = m.fragmentShader
    .replace('uniform float time;', 'uniform float time;\nuniform float skyExposure;')
    .replace(
      'gl_FragColor = vec4( texColor, 1.0 );',
      'gl_FragColor = vec4( texColor * skyExposure, 1.0 );',
    );
  m.uniforms.skyExposure = { value: 0.5 };
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  return sky;
}

/** 陰天/夜空以頂點色漸層圓頂呈現 */
function makeGradientDome(
  radius: number,
  additive: boolean,
): Mesh<SphereGeometry, MeshBasicMaterial> {
  const geo = new SphereGeometry(radius, 32, 16);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  geo.setAttribute('color', new BufferAttribute(colors, 3));
  const mat = new MeshBasicMaterial({
    vertexColors: true,
    side: BackSide,
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: additive ? AdditiveBlending : NormalBlending,
  });
  const mesh = new Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

function paintDome(
  mesh: Mesh<SphereGeometry, MeshBasicMaterial>,
  zenith: Color,
  horizon: Color,
  below: Color,
): void {
  const pos = mesh.geometry.attributes.position;
  const col = mesh.geometry.getAttribute('color') as BufferAttribute;
  const r = mesh.geometry.parameters.radius;
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / r;
    if (y >= 0) c.copy(horizon).lerp(zenith, Math.pow(y, 0.55));
    else c.copy(horizon).lerp(below, Math.min(1, -y * 4));
    col.setXYZ(i, c.r, c.g, c.b);
  }
  col.needsUpdate = true;
}

export class SkySystem {
  /** 跟隨相機的天空群組（主場景） */
  readonly group = new Group();
  /** PMREM 用環境場景（原點） */
  readonly envScene = new Scene();
  readonly sunDir = new Vector3(0, 1, 0);
  readonly moonDir = new Vector3(0, 1, 0);
  sunElevation = 45;

  private readonly sky = makeSkyMesh();
  private readonly envSky = new Sky();
  private readonly overcast = makeGradientDome(40_000, false);
  private readonly envOvercast: Mesh<SphereGeometry, MeshBasicMaterial>;
  private readonly nightGlow = makeGradientDome(41_000, true);
  private readonly envNightGlow: Mesh<SphereGeometry, MeshBasicMaterial>;
  private readonly stars: Points<BufferGeometry, PointsMaterial>;
  private readonly moon: Mesh<SphereGeometry, MeshBasicMaterial>;
  private readonly moonHalo: Mesh<SphereGeometry, MeshBasicMaterial>;
  private lastPaintKey = '';
  private readonly grey = new Color();

  constructor() {
    this.sky.scale.setScalar(80_000);
    this.group.add(this.sky, this.nightGlow, this.overcast);
    this.overcast.renderOrder = -8;
    this.nightGlow.renderOrder = -9;

    // 環境場景共用天空材質（縮小尺度以符合 cube camera 近遠平面）
    this.envSky.material.dispose();
    this.envSky.material = this.sky.material;
    this.envSky.scale.setScalar(900);
    this.envOvercast = new Mesh(new SphereGeometry(400, 32, 16), this.overcast.material);
    this.envOvercast.geometry.setAttribute('color', this.overcast.geometry.getAttribute('color'));
    this.envNightGlow = new Mesh(new SphereGeometry(420, 32, 16), this.nightGlow.material);
    this.envNightGlow.geometry.setAttribute('color', this.nightGlow.geometry.getAttribute('color'));
    this.envScene.add(this.envSky, this.envNightGlow, this.envOvercast);

    // 星空：亮度與色溫隨機，天頂較密
    const n = 4200;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    let seed = 99991;
    const rnd = (): number => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < n; i++) {
      const u = rnd();
      const y = Math.pow(u, 0.7) * 1.02 - 0.02;
      const a = rnd() * Math.PI * 2;
      const rr = Math.sqrt(Math.max(0, 1 - y * y));
      pos.set(
        [Math.cos(a) * rr * STAR_RADIUS, y * STAR_RADIUS, Math.sin(a) * rr * STAR_RADIUS],
        i * 3,
      );
      const b = Math.pow(rnd(), 3.2) * 1.6 + 0.12;
      const t = rnd();
      col.set([b * (0.85 + t * 0.2), b * 0.92, b * (1.1 - t * 0.25)], i * 3);
    }
    const sg = new BufferGeometry();
    sg.setAttribute('position', new BufferAttribute(pos, 3));
    sg.setAttribute('color', new BufferAttribute(col, 3));
    this.stars = new Points(
      sg,
      new PointsMaterial({
        size: 1.7,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
    );
    this.stars.frustumCulled = false;
    this.stars.renderOrder = -7;

    this.moon = new Mesh(
      new SphereGeometry(300, 24, 12),
      new MeshBasicMaterial({ color: new Color(1.7, 1.65, 1.5), fog: false, transparent: true }),
    );
    this.moonHalo = new Mesh(
      new SphereGeometry(1400, 16, 8),
      new MeshBasicMaterial({
        color: new Color(0.16, 0.18, 0.24),
        fog: false,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.moon.frustumCulled = false;
    this.moonHalo.frustumCulled = false;
    this.group.add(this.stars, this.moonHalo, this.moon);
  }

  /** 依天氣與時間填寫 lighting；回傳是否需要重建環境圖的特徵值 */
  computeLighting(w: WeatherState, out: LightingInfo, aboveLayer: boolean): void {
    this.sunElevation = sunDirectionAt(w.timeOfDay, this.sunDir);
    const el = this.sunElevation;
    // 月亮：大致在太陽對側（接近滿月）
    this.moonDir.set(-this.sunDir.x, -this.sunDir.y * 0.8 + 0.25, -this.sunDir.z).normalize();

    const day = smooth(-4, 10, el);
    const night = 1 - smooth(-10, 2, el);
    const dusk = smooth(-7, 1, el) * (1 - smooth(5, 20, el));
    const overcast = aboveLayer ? 0 : smooth(0.55, 0.98, w.cloudCover);
    const rain = w.precipitation;

    // 太陽色：低仰角偏橙紅
    const warm = smooth(-2, 28, el);
    out.sunColor.setRGB(1.0, 0.42 + 0.54 * warm, 0.18 + 0.72 * warm);
    const moonLight = night * Math.max(0, this.moonDir.y) * 0.35;
    if (el > -3) {
      out.sunDirection.copy(this.sunDir);
      out.sunIntensity = 3.4 * smooth(-3, 8, el) * (1 - overcast * 0.82) * (1 - rain * 0.3);
    } else {
      out.sunDirection.copy(this.moonDir);
      out.sunColor.setRGB(0.55, 0.66, 0.95);
      out.sunIntensity = moonLight * (1 - overcast * 0.85);
    }
    out.night = night;
    out.dusk = dusk;
    out.ambientIntensity =
      (0.05 + 0.75 * day + overcast * 0.35 * day) * (1 - rain * 0.2) +
      night * 0.06 +
      w.lightning * 2.5;

    // 地平線色：白天淡藍霧、黃昏橘粉、夜間深藍；陰天灰
    const hz = out.skyHorizonColor;
    hz.setRGB(0.66, 0.76, 0.88).lerp(DUSK_HORIZON, dusk * 0.85);
    hz.multiplyScalar(0.08 + 0.92 * smooth(-8, 6, el));
    if (night > 0) hz.lerp(NIGHT_HORIZON, night);
    this.grey.setRGB(0.62, 0.64, 0.67).multiplyScalar(0.08 + 0.92 * day);
    hz.lerp(this.grey, overcast * 0.85);
    out.fogColor.copy(hz);
    if (w.lightning > 0) out.fogColor.lerp(LIGHTNING_FOG, w.lightning * 0.6);
  }

  /** 每幀：跟隨相機、更新 uniforms 與夜空透明度 */
  update(
    cameraPos: Vector3,
    w: WeatherState,
    lighting: LightingInfo,
    aboveLayer: boolean,
    time: number,
  ): void {
    this.group.position.copy(cameraPos);
    const u = this.sky.material.uniforms;
    const el = this.sunElevation;
    (u.sunPosition.value as Vector3).copy(this.sunDir);
    const haze = 1 - Math.min(1, w.visibility / 30000);
    u.turbidity.value = 2 + haze * 7 + w.cloudCover * 2;
    u.rayleigh.value = 1 + lighting.dusk * 1.4 + haze * 0.6;
    u.mieCoefficient.value = 0.004 + haze * 0.01;
    u.mieDirectionalG.value = 0.8;
    u.cloudCoverage.value = Math.min(0.65, 0.12 + w.cloudCover * 0.4);
    u.cloudDensity.value = 0.35 + w.cloudCover * 0.3;
    u.time.value = time;
    u.skyExposure.value = 0.5 * (1 - lighting.night * 0.6);

    const overcast = aboveLayer ? 0 : smooth(0.55, 0.98, w.cloudCover);
    const day = smooth(-4, 10, el);
    const key = `${overcast.toFixed(2)}|${day.toFixed(2)}|${w.precipitation.toFixed(1)}|${lighting.dusk.toFixed(2)}`;
    if (key !== this.lastPaintKey) {
      this.lastPaintKey = key;
      const lvl = 0.06 + 0.94 * day;
      const rainDark = 1 - w.precipitation * 0.35;
      paintDome(
        this.overcast,
        new Color(0.55, 0.57, 0.6).multiplyScalar(lvl * rainDark),
        new Color(0.7, 0.71, 0.72)
          .multiplyScalar(lvl * rainDark)
          .lerp(new Color(0.8, 0.55, 0.42).multiplyScalar(lvl), lighting.dusk * 0.3),
        new Color(0.35, 0.36, 0.38).multiplyScalar(lvl),
      );
      paintDome(
        this.nightGlow,
        new Color(0.004, 0.008, 0.02),
        new Color(0.05, 0.045, 0.06),
        new Color(0.02, 0.02, 0.03),
      );
    }
    this.overcast.material.opacity = overcast;
    this.overcast.visible = overcast > 0.01;
    this.envOvercast.visible = this.overcast.visible;
    this.nightGlow.material.opacity = lighting.night;
    this.nightGlow.visible = lighting.night > 0.01;
    this.envNightGlow.visible = this.nightGlow.visible;

    const starVis =
      lighting.night * (1 - Math.min(1, w.cloudCover * 1.1)) * (aboveLayer ? 1 : 1 - overcast);
    this.stars.material.opacity = starVis;
    this.stars.visible = starVis > 0.02;

    const moonVis =
      Math.max(0, Math.min(1, this.moonDir.y * 8)) * (1 - overcast * 0.95) * smooth(-2, -10, el);
    this.moon.position.copy(this.moonDir).multiplyScalar(MOON_DISTANCE);
    this.moonHalo.position.copy(this.moon.position);
    this.moon.material.opacity = moonVis;
    this.moonHalo.material.opacity = moonVis;
    this.moon.visible = this.moonHalo.visible = moonVis > 0.01;
  }

  /** 產生環境圖前：隱藏太陽盤避免高亮噪點 */
  setSunDisc(show: boolean): void {
    this.sky.material.uniforms.showSunDisc.value = show ? 1 : 0;
  }

  dispose(): void {
    this.sky.geometry.dispose();
    this.sky.material.dispose();
    this.envSky.geometry.dispose();
    for (const m of [this.overcast, this.nightGlow, this.moon, this.moonHalo]) {
      m.geometry.dispose();
      m.material.dispose();
    }
    this.envOvercast.geometry.dispose();
    this.envNightGlow.geometry.dispose();
    this.stars.geometry.dispose();
    this.stars.material.dispose();
  }
}
