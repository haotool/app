/**
 * 駕駛操縱：側桿（含 AP DISC / TAKEOVER 鈕）、舵踏板（含腳尖剎車）、前輪轉向手輪（tiller）。
 * 側桿偏轉讀 controls.sidestickCapt/Fo；踏板與手輪讀 input。
 */
import {
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { AIRCRAFT } from '../../sim/constants';
import type { CockpitBuilder } from './builder';
import { FLOOR_Y } from './shell';

const STICK_MAX = 16 * (Math.PI / 180);
const T = (x: number, y: number, z: number): Matrix4 => new Matrix4().makeTranslation(x, y, z);

export function buildPilotControls(b: CockpitBuilder): void {
  const m = b.mats;
  for (const side of [1, 2] as const) {
    const s = side === 1 ? -1 : 1;
    // ---- 側桿 ----
    const base = new Vector3(s * 0.93, -0.083, -14.95);
    b.addStatic(
      new CylinderGeometry(0.045, 0.05, 0.012, 24),
      m.trim,
      T(base.x, base.y + 0.004, base.z),
    );
    const pivot = new Group();
    pivot.position.copy(base);
    const boot = new Mesh(
      new SphereGeometry(0.036, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      m.rubber,
    );
    const shaft = new Mesh(
      new CylinderGeometry(0.011, 0.013, 0.05, 14).translate(0, 0.045, 0),
      m.black,
    );
    const grip = new Mesh(new CapsuleGeometry(0.019, 0.075, 6, 16).translate(0, 0.11, 0), m.dark);
    grip.rotation.x = -0.12;
    grip.castShadow = true;
    const ridge = new Mesh(
      new RoundedBoxGeometry(0.02, 0.05, 0.03, 2, 0.008).translate(0, 0.11, 0.012),
      m.dark,
    );
    const apDisc = new Mesh(
      new CylinderGeometry(0.0065, 0.0065, 0.006, 14)
        .rotateX(-0.35)
        .translate(-s * 0.012, 0.155, -0.008),
      m.red,
    );
    const trigger = new Mesh(
      new RoundedBoxGeometry(0.01, 0.028, 0.012, 1, 0.003).translate(0, 0.11, -0.021),
      m.black,
    );
    pivot.add(boot, shaft, grip, ridge, apDisc, trigger);
    b.root.add(pivot);
    const key = side === 1 ? 'sidestickCapt' : 'sidestickFo';
    b.anim((st) => {
      const d = st.controls[key];
      pivot.rotation.set(d.y * STICK_MAX, 0, -d.x * STICK_MAX);
    });
    b.hit(`sidestick${side}`, pivot, new Vector3(0, 0.1, 0), new Vector3(0.028, 0.055, 0.028));
    b.hit(
      `sidestick${side}.apdisc`,
      pivot,
      new Vector3(-s * 0.012, 0.157, -0.008),
      new Vector3(0.009, 0.007, 0.009),
    );

    // ---- 前輪轉向手輪 ----
    const tb = new Vector3(s * 0.93, -0.078, -15.26);
    const tiller = new Group();
    tiller.position.copy(tb);
    const hub = new Mesh(new CylinderGeometry(0.018, 0.02, 0.012, 16), m.metal);
    const rim = new Mesh(
      new TorusGeometry(0.052, 0.006, 8, 32).rotateX(Math.PI / 2).translate(0, 0.012, 0),
      m.dark,
    );
    const knob = new Mesh(
      new CylinderGeometry(0.008, 0.008, 0.03, 10).translate(0.052, 0.03, 0),
      m.dark,
    );
    const spoke = new Mesh(
      new RoundedBoxGeometry(0.1, 0.006, 0.012, 1, 0.002).translate(0, 0.01, 0),
      m.metal,
    );
    tiller.add(hub, rim, knob, spoke);
    b.root.add(tiller);
    b.anim((st) => {
      tiller.rotation.y = -st.input.tiller * 1.3;
    });

    // ---- 舵踏板 ----
    const ex = side === 1 ? AIRCRAFT.eyeCaptain.x : AIRCRAFT.eyeFo.x;
    for (const lr of [-1, 1] as const) {
      const hinge = new Group();
      hinge.position.set(ex + lr * 0.12, FLOOR_Y + 0.33, -15.66);
      const arm = new Mesh(
        new RoundedBoxGeometry(0.02, 0.22, 0.02, 1, 0.005).translate(0, -0.11, 0),
        m.metal,
      );
      const plate = new Mesh(
        new RoundedBoxGeometry(0.09, 0.16, 0.016, 2, 0.006).translate(0, -0.2, 0.012),
        m.rubber,
      );
      plate.rotation.x = -0.35;
      plate.castShadow = true;
      hinge.add(arm, plate);
      b.root.add(hinge);
      b.addStatic(
        new RoundedBoxGeometry(0.05, 0.03, 0.12, 1, 0.006),
        m.seatFrame,
        T(hinge.position.x, hinge.position.y + 0.02, hinge.position.z + 0.02),
      );
      b.anim((st) => {
        const r = st.input.rudder * lr; // 正值 = 此踏板被踩前
        hinge.position.z = -15.66 - r * 0.05;
        const brake = lr < 0 ? st.input.brakeL : st.input.brakeR;
        plate.rotation.x = -0.35 - brake * 0.28;
      });
    }
  }
}
