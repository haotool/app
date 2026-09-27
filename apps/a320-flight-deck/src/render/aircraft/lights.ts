/**
 * 外部燈光：發光燈體 + 距離自適應光暈 sprite + 可見光錐 + 依畫質限量的 SpotLight。
 * 燈號狀態一律讀 SimState.lights（閃爍時序由 LightSystem 計算）。
 * SpotLight 數量在建構/改畫質時固定，關燈只把 intensity 設 0，避免 shader 重編譯。
 */
import {
  AdditiveBlending,
  Color,
  ConeGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  SphereGeometry,
  SpotLight,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { AIRCRAFT } from '../../sim/constants';
import type { FrameContext, QualitySettings } from '../types';
import type { AircraftMaterials } from './materials';
import { wingStation } from './wings';

/** 光度校準（場景單位，太陽約 3 左右時的相對值） */
const INTENSITY = { land: 5200, noseTo: 3600, noseTaxi: 1500, logo: 90 };

interface Lamp {
  obj: Object3D;
  mat: MeshStandardMaterial;
  sprite: Sprite;
  spriteMat: SpriteMaterial;
  color: Color;
  size: number;
  glow: number; // HDR 強度
}

interface Cone {
  mesh: Mesh;
  mat: MeshBasicMaterial;
}

const _w = new Vector3();
const _cam = new Vector3();

export class ExteriorLights {
  private readonly lamps = new Map<string, Lamp>();
  private readonly cones = new Map<string, Cone>();
  private readonly lampGeo = new SphereGeometry(0.07, 10, 8);
  private readonly spotGroup = new Group();
  private spots: { land: SpotLight[]; nose: SpotLight | null; logo: SpotLight | null } = {
    land: [],
    nose: null,
    logo: null,
  };
  private readonly landHousings: Group[] = [];

  constructor(
    private readonly body: Group,
    private readonly noseMount: Group,
    private readonly mats: AircraftMaterials,
    quality: QualitySettings,
  ) {
    const tipL = wingStation(AIRCRAFT.wing.tipX, -1);
    const tipR = wingStation(AIRCRAFT.wing.tipX, 1);
    this.lamp(
      'navL',
      body,
      new Vector3(-AIRCRAFT.wing.tipX - 0.05, tipL.le.y + 0.02, tipL.le.z + 0.25),
      '#ff2a1a',
      0.9,
      7,
    );
    this.lamp(
      'navR',
      body,
      new Vector3(AIRCRAFT.wing.tipX + 0.05, tipR.le.y + 0.02, tipR.le.z + 0.25),
      '#1dff5a',
      0.9,
      7,
    );
    this.lamp('navTail', body, new Vector3(0, 0.98, AIRCRAFT.tailZ + 0.02), '#ffffff', 0.8, 6);
    this.lamp(
      'strobeL',
      body,
      new Vector3(-AIRCRAFT.wing.tipX - 0.05, tipL.le.y - 0.02, tipL.le.z + 0.6),
      '#f2f6ff',
      3.2,
      40,
    );
    this.lamp(
      'strobeR',
      body,
      new Vector3(AIRCRAFT.wing.tipX + 0.05, tipR.le.y - 0.02, tipR.le.z + 0.6),
      '#f2f6ff',
      3.2,
      40,
    );
    this.lamp('strobeTail', body, new Vector3(0, 1.15, AIRCRAFT.tailZ - 0.05), '#f2f6ff', 2.6, 35);
    this.lamp(
      'beaconTop',
      body,
      new Vector3(0, AIRCRAFT.fuselageHeight / 2 + 0.06, 0.8),
      '#ff1c10',
      1.6,
      16,
    );
    this.lamp('beaconBot', body, new Vector3(0, -2.5, 0.3), '#ff1c10', 1.6, 16);

    // 著陸燈（翼下可收放燈座）
    for (const side of [-1, 1] as const) {
      const st = wingStation(4.6, side);
      const housing = new Group();
      housing.position.set(side * 4.6, st.le.y - 0.075 * st.chord - 0.05, st.le.z + 0.7);
      body.add(housing);
      this.landHousings.push(housing);
      const key = side < 0 ? 'landL' : 'landR';
      this.lamp(key, housing, new Vector3(0, -0.12, -0.05), '#fff3dc', 1.8, 12);
      this.cone(
        key,
        housing,
        new Vector3(0, -0.12, -0.1),
        new Vector3(0, -0.07, -1),
        70,
        (8.5 * Math.PI) / 180,
      );
    }
    // 前架燈（TAXI / T.O / 跑道脫離）
    this.lamp('nose', noseMount, new Vector3(0, 0, -0.05), '#fff6e6', 1.3, 10);
    this.cone(
      'nose',
      noseMount,
      new Vector3(0, 0, -0.1),
      new Vector3(0, -0.08, -1),
      50,
      (11 * Math.PI) / 180,
    );
    for (const side of [-1, 1] as const) {
      const key = side < 0 ? 'turnL' : 'turnR';
      this.lamp(key, noseMount, new Vector3(side * 0.16, 0.1, -0.02), '#fff6e6', 1.0, 8);
      this.cone(
        key,
        noseMount,
        new Vector3(side * 0.16, 0.1, -0.06),
        new Vector3(side * 0.55, -0.1, -0.83),
        26,
        (20 * Math.PI) / 180,
      );
    }
    // 機翼照明（機身側照向前緣與短艙）
    for (const side of [-1, 1] as const) {
      const key = side < 0 ? 'wingL' : 'wingR';
      this.lamp(key, body, new Vector3(side * 1.99, 0.35, -5.6), '#eef3ff', 0.9, 6);
      this.cone(
        key,
        body,
        new Vector3(side * 2.0, 0.35, -5.6),
        new Vector3(side * 0.82, -0.12, 0.55),
        12,
        (13 * Math.PI) / 180,
      );
    }
    // LOGO 燈（水平尾翼上表面照向垂直尾翼）
    for (const side of [-1, 1] as const) {
      this.lamp(
        side < 0 ? 'logoL' : 'logoR',
        body,
        new Vector3(side * 1.6, AIRCRAFT.hstab.y + 0.3, 16.2),
        '#fff1dc',
        0.6,
        5,
      );
    }
    this.spotGroup.name = 'aircraft-spots';
    body.add(this.spotGroup);
    this.buildSpots(quality);
  }

  private lamp(
    key: string,
    parent: Object3D,
    pos: Vector3,
    color: string,
    size: number,
    glow: number,
  ): void {
    const c = new Color(color);
    const mat = new MeshStandardMaterial({
      color: '#202020',
      emissive: c,
      emissiveIntensity: 0,
      roughness: 0.3,
    });
    const obj = new Mesh(this.lampGeo, mat);
    obj.position.copy(pos);
    parent.add(obj);
    const spriteMat = new SpriteMaterial({
      map: this.mats.textures.glow,
      color: c.clone(),
      blending: AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0,
    });
    const sprite = new Sprite(spriteMat);
    sprite.visible = false;
    obj.add(sprite);
    this.lamps.set(key, { obj, mat, sprite, spriteMat, color: c, size, glow });
  }

  private cone(
    key: string,
    parent: Object3D,
    pos: Vector3,
    dir: Vector3,
    length: number,
    halfAngle: number,
  ): void {
    const g = new ConeGeometry(Math.tan(halfAngle) * length, length, 28, 1, true);
    g.translate(0, -length / 2, 0);
    const mat = new MeshBasicMaterial({
      color: '#fff4e2',
      alphaMap: this.mats.textures.cone,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    });
    const mesh = new Mesh(g, mat);
    mesh.position.copy(pos);
    mesh.quaternion.setFromUnitVectors(new Vector3(0, -1, 0), dir.clone().normalize());
    mesh.visible = false;
    mesh.renderOrder = 5;
    parent.add(mesh);
    this.cones.set(key, { mesh, mat });
  }

  private spot(
    parent: Object3D,
    pos: Vector3,
    target: Vector3,
    angle: number,
    distance: number,
  ): SpotLight {
    const sl = new SpotLight('#fff1dc', 0, distance, angle, 0.55, 2);
    sl.position.copy(pos);
    sl.target.position.copy(target);
    parent.add(sl);
    parent.add(sl.target);
    return sl;
  }

  private buildSpots(q: QualitySettings): void {
    for (const sl of [...this.spots.land, this.spots.nose, this.spots.logo]) {
      if (!sl) continue;
      sl.parent?.remove(sl.target);
      sl.removeFromParent();
      sl.dispose();
    }
    this.spots = { land: [], nose: null, logo: null };
    const lvl = q.level;
    if (lvl === 'LOW') return;
    if (lvl === 'ULTRA') {
      for (const h of this.landHousings)
        this.spots.land.push(
          this.spot(h, new Vector3(0, -0.12, -0.2), new Vector3(0, -30, -400), 0.15, 1400),
        );
    } else {
      this.spots.land.push(
        this.spot(
          this.spotGroup,
          new Vector3(0, -2.4, -3.5),
          new Vector3(0, -32, -400),
          0.17,
          1400,
        ),
      );
    }
    this.spots.nose = this.spot(
      this.noseMount,
      new Vector3(0, 0, -0.15),
      new Vector3(0, -3.5, -45),
      0.22,
      500,
    );
    if (lvl === 'ULTRA' || lvl === 'HIGH') {
      this.spots.logo = this.spot(
        this.body,
        new Vector3(1.4, AIRCRAFT.hstab.y + 0.35, 16.6),
        new Vector3(0, 4.8, 15.6),
        0.55,
        30,
      );
    }
  }

  setQuality(q: QualitySettings): void {
    this.buildSpots(q);
  }

  private setLamp(key: string, on: number, night: number): void {
    const l = this.lamps.get(key);
    if (!l) return;
    l.mat.emissiveIntensity = on * l.glow;
    const vis = on > 0.01;
    l.sprite.visible = vis;
    if (!vis) return;
    l.obj.getWorldPosition(_w);
    const dist = _w.distanceTo(_cam);
    const s = Math.max(l.size, dist * 0.0032);
    l.sprite.scale.set(s, s, s);
    l.spriteMat.opacity = on * (0.25 + 0.75 * night);
    l.spriteMat.color.copy(l.color).multiplyScalar(1 + 2 * night);
  }

  private setCone(key: string, on: number, vis: number): void {
    const c = this.cones.get(key);
    if (!c) return;
    c.mesh.visible = on > 0.01 && vis > 0.005;
    c.mat.opacity = on * vis;
  }

  update(frame: FrameContext): void {
    const s = frame.state;
    const L = s.lights;
    const e = s.elec;
    const acPower = e.acBus1 || e.acBus2;
    const dcPower = acPower || e.dcBus1 || e.dcBus2 || e.dcEss;
    const night = frame.lighting.night;
    frame.camera.getWorldPosition(_cam);
    const gearDown = s.gear.position[0] > 0.95;
    const onGround = s.flight.onGround;

    const nav = L.navLogo && dcPower ? 1 : 0;
    this.setLamp('navL', nav, night);
    this.setLamp('navR', nav, night);
    this.setLamp('navTail', nav, night);
    const strobe = L.strobeOn && acPower ? 1 : 0;
    this.setLamp('strobeL', strobe, night);
    this.setLamp('strobeR', strobe, night);
    this.setLamp('strobeTail', strobe, night);
    const beacon = dcPower ? L.beaconOn : 0;
    this.setLamp('beaconTop', beacon, night);
    this.setLamp('beaconBot', beacon, night);

    const coneVis =
      0.015 + 0.17 * night + 0.1 * s.weather.precipitation + 0.2 * s.weather.cloudDensityAtAircraft;
    const [extL, extR] = L.landingLightExtension;
    // 收起時燈面朝下貼平翼下表面，伸出後轉向前方
    this.landHousings[0].rotation.x = -(1 - extL) * 1.4;
    this.landHousings[1].rotation.x = -(1 - extR) * 1.4;
    const landL = acPower && L.landL === 'ON' ? extL : 0;
    const landR = acPower && L.landR === 'ON' ? extR : 0;
    this.setLamp('landL', landL, night);
    this.setLamp('landR', landR, night);
    this.setCone('landL', landL, coneVis);
    this.setCone('landR', landR, coneVis);

    const nose = acPower && gearDown && L.nose !== 'OFF' ? (L.nose === 'TO' ? 1 : 0.55) : 0;
    this.setLamp('nose', nose, night);
    this.setCone('nose', nose, coneVis * 0.8);
    const turn = acPower && gearDown && L.rwyTurnoff ? 1 : 0;
    for (const k of ['turnL', 'turnR']) {
      this.setLamp(k, turn, night);
      this.setCone(k, turn, coneVis * 0.6);
    }
    const wing = acPower && L.wing ? 1 : 0;
    for (const k of ['wingL', 'wingR']) {
      this.setLamp(k, wing, night);
      this.setCone(k, wing, coneVis * 0.9);
    }
    const logo = nav && (onGround || s.controls.flapHandle > 0) ? 1 : 0;
    this.setLamp('logoL', logo, night);
    this.setLamp('logoR', logo, night);

    // SpotLight（intensity 0 = 關）
    if (this.spots.land.length === 2) {
      this.spots.land[0].intensity = landL * INTENSITY.land;
      this.spots.land[1].intensity = landR * INTENSITY.land;
    } else if (this.spots.land.length === 1) {
      this.spots.land[0].intensity = ((landL + landR) / 2) * INTENSITY.land * 1.4;
    }
    if (this.spots.nose) {
      this.spots.nose.intensity =
        nose > 0 ? (L.nose === 'TO' ? INTENSITY.noseTo : INTENSITY.noseTaxi) : 0;
      this.spots.nose.angle = L.nose === 'TO' ? 0.18 : 0.3;
    }
    if (this.spots.logo) this.spots.logo.intensity = logo * INTENSITY.logo;
  }

  dispose(): void {
    this.lampGeo.dispose();
    for (const l of this.lamps.values()) {
      l.mat.dispose();
      l.spriteMat.dispose();
    }
    for (const c of this.cones.values()) {
      c.mesh.geometry.dispose();
      c.mat.dispose();
    }
    for (const sl of [...this.spots.land, this.spots.nose, this.spots.logo]) sl?.dispose();
  }
}
