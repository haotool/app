/**
 * 主儀表板：6 DU + ISIS + 時鐘、起落架手柄與 LDG GEAR 指示、AUTO/BRK、A/SKID、FLOOD、DU 亮度鈕。
 */
import {
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { readControl } from '../../sim/controlDefs';
import type { SimState } from '../../sim/types';
import { basis, type CockpitBuilder } from './builder';
import { DynamicCanvas, LCD_FONT } from './labels';

export const DU_SIZE = 0.184;

export interface MainPanelParts {
  clock: DynamicCanvas;
}

export function buildMainPanel(b: CockpitBuilder): MainPanelParts {
  const tilt = -0.12;
  const m = basis(
    new Vector3(0, -0.02, -15.33),
    new Vector3(1, 0, 0),
    new Vector3(0, Math.cos(tilt), Math.sin(tilt)),
  );
  const p = b.panel('MAIN', m, 1.84, 0.58, 0.05, '#4f5d68');
  const c = p.canvas;

  // DU 與亮度旋鈕
  const du = [
    ['pfd1', -0.64, 0.1],
    ['nd1', -0.39, 0.1],
    ['ewd', 0, 0.1],
    ['sd', 0, -0.15],
    ['nd2', 0.39, 0.1],
    ['pfd2', 0.64, 0.1],
  ] as const;
  for (const [id, u, v] of du) {
    b.display(p, id, u, v, DU_SIZE, DU_SIZE);
    if (id !== 'ewd' && id !== 'sd') {
      const pu = u - Math.sign(u) * 0.075;
      b.pot(p, `brt.${id}`, pu, v - 0.126, 0.0065);
      c.text(pu, v - 0.145, id.toUpperCase().replace(/\d/, ''), { size: 0.0042 });
    }
  }
  c.divider(-0.29, 0.28, -0.29, -0.29);
  c.divider(0.29, 0.28, 0.29, -0.29);
  for (const u of [-0.9, -0.3, 0.3, 0.9]) {
    c.screw(u, 0.27);
    c.screw(u, -0.28);
  }

  // ISIS 備用儀表
  b.display(p, 'isis', -0.195, 0.14, 0.086, 0.086);
  c.text(-0.195, 0.078, 'ISIS', { size: 0.004 });

  // 時鐘（UTC + 計時）
  const clock = new DynamicCanvas(256, 128);
  b.addStatic(
    new RoundedBoxGeometry(0.084, 0.05, 0.01, 2, 0.004),
    b.mats.bezel,
    p.local(0.195, 0.19, 0.004),
  );
  const clockMat = new MeshBasicMaterial({ map: clock.texture, toneMapped: false, fog: false });
  const clockMesh = new Mesh(new PlaneGeometry(0.07, 0.035), clockMat);
  clockMesh.position.set(0.195, 0.19, 0.0095);
  p.obj.add(clockMesh);
  c.text(0.195, 0.158, 'CLOCK  UTC', { size: 0.0038 });

  // LDG GEAR 指示燈（前、左、右）
  c.text(0.195, 0.128, 'LDG GEAR', { size: 0.0045 });
  const gearLamp = (i: 0 | 1 | 2) => (s: SimState) => {
    const g = s.gear;
    if (g.downLocked[i]) return { text: 'TRI', color: 'green' as const };
    if (g.position[i] > 0.02 && g.position[i] < 0.98)
      return { text: 'UNLK', color: 'red' as const };
    if (g.lever === 'DOWN' && !g.downLocked[i]) return { text: 'UNLK', color: 'red' as const };
    return null;
  };
  b.lamp(p, 0.195, 0.1, 0.03, 0.016, gearLamp(0));
  b.lamp(p, 0.172, 0.078, 0.03, 0.016, gearLamp(1));
  b.lamp(p, 0.218, 0.078, 0.03, 0.016, gearLamp(2));

  // 起落架手柄
  c.text(0.24, 0.02, 'UP', { size: 0.0048 });
  c.text(0.24, -0.2, 'DOWN', { size: 0.0048 });
  c.text(0.195, -0.245, 'LDG GEAR', { size: 0.0045 });
  b.addStatic(
    new RoundedBoxGeometry(0.02, 0.25, 0.006, 1, 0.003),
    b.mats.dark,
    p.local(0.195, -0.09, 0.002),
  );
  const gear = new Group();
  const arm = new Mesh(
    new RoundedBoxGeometry(0.012, 0.012, 0.07, 1, 0.004).translate(0, 0, 0.035),
    b.mats.metal,
  );
  const wheel = new Mesh(
    new CylinderGeometry(0.024, 0.024, 0.016, 28).rotateZ(Math.PI / 2).translate(0, 0, 0.072),
    b.mats.white,
  );
  const tread = new Mesh(
    new TorusGeometry(0.024, 0.0035, 8, 28).rotateY(Math.PI / 2).translate(0, 0, 0.072),
    b.mats.rubber,
  );
  gear.add(arm, wheel, tread);
  arm.castShadow = true;
  wheel.castShadow = true;
  p.obj.add(gear);
  let gearPos = Number.NaN;
  b.anim((s, cx) => {
    const target = readControl(s, 'gear.lever').value; // 1 = DOWN
    if (Number.isNaN(gearPos)) gearPos = target;
    const prev = gearPos;
    gearPos += Math.sign(target - gearPos) * Math.min(Math.abs(target - gearPos), cx.dt * 2.6);
    const moving = Math.abs(gearPos - prev) > 1e-5 || Math.abs(target - gearPos) > 1e-3;
    gear.position.set(0.195, -0.02 - gearPos * 0.17, moving ? 0.014 : 0.006);
  });
  b.hit('gear.lever', gear, new Vector3(0, 0, 0.06), new Vector3(0.03, 0.03, 0.03));

  // AUTO/BRK
  c.text(-0.195, -0.022, 'AUTO/BRK', { size: 0.0045 });
  b.pb(p, 'abrk.lo', -0.195, -0.05, { style: 'abrk', w: 0.032, h: 0.026 });
  b.pb(p, 'abrk.med', -0.195, -0.09, { style: 'abrk', w: 0.032, h: 0.026 });
  b.pb(p, 'abrk.max', -0.195, -0.13, { style: 'abrk', w: 0.032, h: 0.026 });
  c.text(-0.235, -0.05, 'LO', { size: 0.0042 });
  c.text(-0.235, -0.09, 'MED', { size: 0.0042 });
  c.text(-0.235, -0.13, 'MAX', { size: 0.0042 });

  // A/SKID & N/W STRG、FLOOD
  b.toggle(p, 'brk.antiskid', -0.155, -0.215);
  c.text(-0.155, -0.25, 'A/SKID & N/W STRG', { size: 0.0036 });
  b.pot(p, 'lt.flood', -0.245, -0.215, 0.0065);
  c.text(-0.245, -0.245, 'FLOOD LT', { size: 0.0036 });

  // 儀表板下緣護條與遮光板下方陰影槽
  b.addStatic(
    new RoundedBoxGeometry(1.86, 0.012, 0.06, 1, 0.005),
    b.mats.trim,
    p.local(0, -0.295, 0.02),
  );
  b.addStatic(
    new RoundedBoxGeometry(1.86, 0.02, 0.03, 1, 0.006),
    b.mats.dark,
    new Matrix4().makeTranslation(0, 0.28, -15.3),
  );

  return { clock };
}

export function drawClock(clock: DynamicCanvas, s: SimState, powered: boolean): void {
  const h = Math.floor(s.weather.timeOfDay) % 24;
  const mi = Math.floor((s.weather.timeOfDay % 1) * 60);
  const et = Math.floor(s.meta.time / 60);
  const key = powered ? `${h}:${mi}:${et}` : 'off';
  clock.update(key, (g, w, hh) => {
    g.fillStyle = '#050607';
    g.fillRect(0, 0, w, hh);
    if (!powered) return;
    g.fillStyle = '#e6f0ff';
    g.font = `700 54px ${LCD_FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(`${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`, w / 2, hh * 0.38);
    g.font = `400 30px ${LCD_FONT}`;
    g.fillStyle = '#9fb5c8';
    g.fillText(
      `ET ${String(Math.floor(et / 60)).padStart(2, '0')}:${String(et % 60).padStart(2, '0')}`,
      w / 2,
      hh * 0.8,
    );
  });
}
