/**
 * A320neo 外部模型：組裝機身、機翼/尾翼操縱面、發動機、起落架、外部燈與觸地輪胎煙，
 * 每幀只讀 FrameContext（SimState 單一真相來源）驅動所有動態部件。
 * root 需為 scene 直屬子物件（煙霧粒子以 root 反矩陣換回世界座標）。
 */
import {
  type BufferGeometry,
  BoxGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  type Object3D,
  Shape,
  ShapeGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { AIRCRAFT, DEG } from '../../sim/constants';
import type { FrameContext, QualitySettings } from '../types';
import { buildEngine, type EngineParts } from './engines';
import { buildGear, type GearParts, updateGear } from './gear';
import {
  FWD_SPLIT_Z,
  fuselageNormal,
  fuselagePatch,
  fuselagePoint,
  fuselageShell,
  ringStations,
} from './geometry';
import { ExteriorLights } from './lights';
import { type AircraftMaterials, createMaterials } from './materials';
import { buildWings, type Hinged, type WingParts } from './wings';

const SMOKE_POOL = 36;

interface Smoke {
  sprite: Sprite;
  mat: SpriteMaterial;
  vel: Vector3;
  age: number;
  life: number;
}

const _m = new Matrix4();
const _p = new Vector3();
const _n = new Vector3();

function setHinged(h: Hinged, angleRad: number, f: number): void {
  h.obj.position.copy(h.base).addScaledVector(h.slide, f);
  h.obj.quaternion.setFromAxisAngle(h.axis, angleRad);
}

export class AircraftModel {
  readonly root = new Group();
  private readonly mats: AircraftMaterials;
  private readonly forward = new Group();
  private readonly wings: WingParts;
  private readonly engines: [EngineParts, EngineParts];
  private readonly gear: GearParts;
  private readonly lights: ExteriorLights;
  private readonly smokeGroup = new Group();
  private readonly smoke: Smoke[] = [];
  private readonly prevSpin = [0, 0, 0];

  constructor(quality: QualitySettings) {
    this.root.name = 'A320neo';
    this.mats = createMaterials();
    const mats = this.mats;
    const body = this.root;

    // 機身：前段（座艙視角隱藏）與主段共用分界環，無縫
    const fwd = new Mesh(
      fuselageShell(ringStations(AIRCRAFT.noseZ, FWD_SPLIT_Z, 0.12, true), 72),
      mats.livery,
    );
    fwd.castShadow = true;
    fwd.receiveShadow = true;
    this.forward.add(fwd);
    this.forward.name = 'fuselage-forward';
    body.add(this.forward);
    const zs = [
      ...ringStations(FWD_SPLIT_Z, 8, 0.7),
      ...ringStations(8, AIRCRAFT.tailZ, 0.3).slice(1),
    ];
    const main = new Mesh(fuselageShell(zs, 72), mats.livery);
    main.castShadow = true;
    main.receiveShadow = true;
    body.add(main);
    this.buildCockpitWindows();
    this.buildCabinWindows();
    this.buildDetails();

    this.wings = buildWings(mats);
    body.add(this.wings.group);
    this.engines = [buildEngine(-1, mats), buildEngine(1, mats)];
    for (const e of this.engines) body.add(e.group);
    this.gear = buildGear(mats, body);
    this.lights = new ExteriorLights(body, this.gear.noseLightMount, mats, quality);

    // 觸地輪胎煙：世界座標粒子池
    this.smokeGroup.matrixAutoUpdate = false;
    body.add(this.smokeGroup);
    for (let i = 0; i < SMOKE_POOL; i++) {
      const mat = new SpriteMaterial({
        map: mats.textures.smoke,
        color: '#d9d9d9',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new Sprite(mat);
      sprite.visible = false;
      this.smokeGroup.add(sprite);
      this.smoke.push({ sprite, mat, vel: new Vector3(), age: 0, life: 0 });
    }
  }

  /** 6 片駕駛艙窗（左右各：擋風、側窗、滑窗） */
  private buildCockpitWindows(): void {
    const d = DEG;
    const wins: [number, number, number, number, number, number][] = [
      [-16.55, -15.6, 28, 86, 36, 88],
      [-15.5, -14.8, 24, 60, 20, 58],
      [-14.7, -13.9, 20, 54, 18, 50],
    ];
    for (const [z0, z1, a0, a1, b0, b1] of wins) {
      for (const mirror of [false, true]) {
        const f = (t: number): number => (mirror ? 180 - t : t) * d;
        const g = mirror
          ? fuselagePatch(z0, z1, f(a1), f(a0), f(b1), f(b0))
          : fuselagePatch(z0, z1, f(a0), f(a1), f(b0), f(b1));
        const m = new Mesh(g, this.mats.glass);
        this.forward.add(m);
      }
    }
  }

  private buildCabinWindows(): void {
    const s = new Shape();
    const w = 0.23;
    const h = 0.33;
    const r = 0.09;
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const geo = new ShapeGeometry(s, 4);
    const zsList: number[] = [];
    for (let z = -10.9; z < 7.3; z += 0.533) {
      if (z > -1.4 && z < 0.2) continue; // 翼上逃生門
      zsList.push(z);
    }
    const inst = new InstancedMesh(geo, this.mats.cabinWindow, zsList.length * 2);
    const up = new Vector3();
    const xAxis = new Vector3();
    let k = 0;
    for (const z of zsList) {
      for (const th of [16 * DEG, 164 * DEG]) {
        fuselagePoint(z, th, _p);
        fuselageNormal(z, th, _n);
        _p.addScaledVector(_n, 0.006);
        up.set(0, 1, 0).addScaledVector(_n, -_n.y).normalize();
        xAxis.crossVectors(up, _n);
        _m.makeBasis(xAxis, up, _n).setPosition(_p);
        inst.setMatrixAt(k++, _m);
      }
    }
    this.root.add(inst);
  }

  /** 天線、皮託管、AOA 感測器、APU 排氣口 */
  private buildDetails(): void {
    const mats = this.mats;
    const add = (
      parent: Object3D,
      geo: BoxGeometry | CylinderGeometry,
      mat: typeof mats.metal,
      pos: Vector3,
      rotX = 0,
      rotZ = 0,
    ): void => {
      const m = new Mesh(geo, mat);
      m.position.copy(pos);
      m.rotation.set(rotX, 0, rotZ);
      m.castShadow = true;
      parent.add(m);
    };
    const blade = new BoxGeometry(0.04, 0.28, 0.36);
    add(this.root, blade, mats.black, new Vector3(0, AIRCRAFT.fuselageHeight / 2 + 0.12, -7.5));
    add(this.root, blade, mats.black, new Vector3(0, AIRCRAFT.fuselageHeight / 2 + 0.12, 4.2));
    add(this.root, blade, mats.black, new Vector3(0, -2.2, -8.8), Math.PI);
    // 皮託管與 AOA（前段）
    const pitot = new CylinderGeometry(0.018, 0.024, 0.28, 8);
    const vane = new BoxGeometry(0.015, 0.1, 0.12);
    for (const th of [-12, 192, -30, 210]) {
      fuselagePoint(-15.3, th * DEG, _p);
      fuselageNormal(-15.3, th * DEG, _n);
      _p.addScaledVector(_n, 0.1);
      add(this.forward, pitot, mats.metal, _p.clone(), Math.PI / 2);
      fuselagePoint(-14.6, (th + 8) * DEG, _p);
      add(this.forward, vane, mats.black, _p.clone(), 0, (th + 8) * DEG);
    }
    // APU 排氣口
    const apu = new Mesh(new CylinderGeometry(0.2, 0.26, 0.3, 20, 1, true), mats.darkMetal);
    apu.rotation.x = Math.PI / 2;
    fuselagePoint(AIRCRAFT.tailZ - 0.12, Math.PI / 2, _p);
    apu.position.set(0, _p.y - 0.3, AIRCRAFT.tailZ - 0.05);
    this.root.add(apu);
  }

  setQuality(q: QualitySettings): void {
    this.lights.setQuality(q);
  }

  update(frame: FrameContext): void {
    const s = frame.state;
    this.root.position.copy(frame.pose.position);
    this.root.quaternion.copy(frame.pose.quaternion);
    this.root.updateMatrixWorld(true);
    this.forward.visible = !frame.cameraInCockpit;

    // 操縱面
    const c = s.controls;
    const w = this.wings;
    setHinged(w.aileronL, c.aileronL * DEG, 0);
    setHinged(w.aileronR, c.aileronR * DEG, 0);
    for (let i = 0; i < 5; i++) {
      setHinged(w.spoilersL[i], -c.spoilersL[i] * DEG, 0);
      setHinged(w.spoilersR[i], -c.spoilersR[i] * DEG, 0);
    }
    const ff = Math.min(1, c.flapsAngle / 40);
    for (const f of [...w.flapsL, ...w.flapsR]) setHinged(f, c.flapsAngle * DEG, ff);
    const sf = Math.min(1, c.slatsAngle / 27);
    for (const sl of [...w.slatsL, ...w.slatsR]) setHinged(sl, -c.slatsAngle * 0.85 * DEG, sf);
    w.ths.rotation.x = -c.ths * DEG;
    setHinged(w.elevatorL, c.elevator * DEG, 0);
    setHinged(w.elevatorR, c.elevator * DEG, 0);
    setHinged(w.rudder, c.rudder * DEG, 0);

    // 發動機
    for (let i = 0; i < 2; i++) {
      const e = this.engines[i];
      const st = s.engines[i];
      e.fan.rotation.z = st.fanAngle;
      e.transCowl.position.z = st.reverser * 0.62;
      e.blurMat.opacity = Math.min(0.55, Math.max(0, (st.n1 - 12) / 55));
    }

    // 起落架
    updateGear(this.gear, s.gear);
    this.lights.update(frame);

    // 客艙窗夜間透光
    const cabinPower = s.elec.acBus1 || s.elec.acBus2;
    this.mats.cabinWindow.emissiveIntensity = cabinPower ? frame.lighting.night * 1.3 : 0;

    this.updateSmoke(frame);
  }

  private updateSmoke(frame: FrameContext): void {
    const g = frame.state.gear;
    this.smokeGroup.matrix.copy(this.root.matrixWorld).invert();
    this.smokeGroup.matrixWorldNeedsUpdate = true;
    for (let i = 1; i < 3; i++) {
      const spin = g.wheelSpin[i];
      if (this.prevSpin[i] < 3 && spin > 15 && g.compression[i] > 0.02) {
        const G = AIRCRAFT.gear[i];
        for (let k = 0; k < 9; k++) {
          _p.set(
            G.x + (Math.random() - 0.5) * 0.9,
            G.y + g.compression[i] + 0.1,
            G.z + Math.random() * 0.6,
          );
          this.root.localToWorld(_p);
          this.spawnSmoke(_p);
        }
      }
      this.prevSpin[i] = spin;
    }
    const dt = Math.min(frame.dt, 0.1);
    for (const p of this.smoke) {
      if (p.life <= 0) continue;
      p.age += dt;
      const t = p.age / p.life;
      if (t >= 1) {
        p.life = 0;
        p.sprite.visible = false;
        continue;
      }
      p.sprite.position.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(1 - dt * 1.4);
      p.vel.y += dt * 0.6;
      const sc = 1.2 + t * 7;
      p.sprite.scale.set(sc, sc, sc);
      p.mat.opacity = 0.55 * (1 - t) * Math.min(1, t * 8);
    }
  }

  private spawnSmoke(at: Vector3): void {
    const p = this.smoke.find((x) => x.life <= 0);
    if (!p) return;
    p.sprite.position.copy(at);
    p.vel.set((Math.random() - 0.5) * 2.5, 0.6 + Math.random(), (Math.random() - 0.5) * 2.5);
    p.age = 0;
    p.life = 1.6 + Math.random() * 1.2;
    p.sprite.visible = true;
  }

  dispose(): void {
    this.root.traverse((o) => {
      if (o instanceof Mesh) (o.geometry as BufferGeometry).dispose();
    });
    for (const p of this.smoke) p.mat.dispose();
    this.lights.dispose();
    this.mats.dispose();
    this.root.removeFromParent();
  }
}
