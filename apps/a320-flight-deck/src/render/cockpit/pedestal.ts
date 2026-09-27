/**
 * 中央操縱台：MCDU ×2、ECAM 控制盤、油門象限（含卡位刻度與 A/THR 瞬斷鈕）、減速板、襟翼、
 * ENG MASTER / MODE、方向舵配平與顯示、停機剎車。
 */
import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { readControl } from '../../sim/controlDefs';
import { TLA } from '../../sim/constants';
import type { SimState } from '../../sim/types';
import { basis, type CockpitBuilder, type Panel } from './builder';
import { DynamicCanvas, LCD_FONT } from './labels';
import { PED_HALF, PED_TOP } from './shell';

const DEG = Math.PI / 180;
export const THR_ANGLE = (tla: number): number => (5 - tla) * 0.9 * DEG;
const SPD_ANGLE = (h: number): number => (-15 + h * 45) * DEG;
const FLAP_ANGLE = (pos: number): number => (-25 + pos * 12) * DEG;
const PIVOT_DEPTH = 0.1;

export interface PedestalParts {
  trimDisplay: DynamicCanvas;
}

const KEY_LABEL: Record<string, string> = {
  DOT: '.',
  PLUSMINUS: '+/-',
  SLASH: '/',
  SP: 'SP',
  PREV: '←',
  NEXT: '→',
  UP: '↑',
  DOWN: '↓',
  RADNAV: 'RAD\nNAV',
  AIRPORT: 'AIR\nPORT',
  FUEL: 'FUEL\nPRED',
  MENU: 'MCDU\nMENU',
  FPLN: 'F-PLN',
};

function flatPanel(b: CockpitBuilder, name: string, z: number, depth: number): Panel {
  const m = basis(new Vector3(0, PED_TOP + 0.001, z), new Vector3(1, 0, 0), new Vector3(0, 0, -1));
  return b.panel(name, m, PED_HALF * 2 - 0.02, depth, 0.012, '#4a5762');
}

function buildMcdu(b: CockpitBuilder, side: 1 | 2): void {
  const dir = new Vector3(0, 0.105, -0.42).normalize();
  const x = side === 1 ? -0.135 : 0.135;
  const p = b.panel(
    `MCDU${side}`,
    basis(new Vector3(x, -0.3025 + 0.004, -15.19), new Vector3(1, 0, 0), dir),
    0.215,
    0.41,
    0.02,
    '#3e4953',
  );
  const sw = 0.118;
  const sh = 0.098;
  const sv = 0.125;
  b.display(p, side === 1 ? 'mcdu1' : 'mcdu2', 0, sv, sw, sh);
  const rowV = (r: number): number => sv + sh / 2 - (r + 0.5) * (sh / 14);
  for (let i = 0; i < 6; i++) {
    const v = rowV(2 + i * 2);
    b.pb(p, `mcdu${side}.L${i + 1}`, -0.078, v, { style: 'key', w: 0.014, h: 0.0085, label: '—' });
    b.pb(p, `mcdu${side}.R${i + 1}`, 0.078, v, { style: 'key', w: 0.014, h: 0.0085, label: '—' });
  }
  const fn1 = ['DIR', 'PROG', 'PERF', 'INIT', 'DATA'];
  const fn2 = ['FPLN', 'RADNAV', 'FUEL', 'MENU', 'AIRPORT'];
  [fn1, fn2].forEach((row, r) =>
    row.forEach((k, i) =>
      b.pb(p, `mcdu${side}.${k}`, -0.072 + i * 0.036, 0.05 - r * 0.022, {
        style: 'keyLight',
        w: 0.03,
        h: 0.016,
        label: KEY_LABEL[k] ?? k,
      }),
    ),
  );
  const nav: [string, number, number][] = [
    ['UP', -0.075, 0.004],
    ['DOWN', -0.075, -0.017],
    ['PREV', -0.05, 0.004],
    ['NEXT', -0.05, -0.017],
  ];
  for (const [k, u, v] of nav)
    b.pb(p, `mcdu${side}.${k}`, u, v, {
      style: 'keyLight',
      w: 0.019,
      h: 0.015,
      label: KEY_LABEL[k] ?? k,
    });
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXY'.split('').concat(['Z', 'SLASH', 'SP', 'OVFY', 'CLR']);
  letters.forEach((k, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    b.pb(p, `mcdu${side}.${k}`, -0.005 + col * 0.021, 0.004 - row * 0.021, {
      style: 'key',
      w: 0.017,
      h: 0.015,
      label: KEY_LABEL[k] ?? k,
    });
  });
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'DOT', '0', 'PLUSMINUS'];
  digits.forEach((k, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    b.pb(p, `mcdu${side}.${k}`, -0.075 + col * 0.021, -0.038 - row * 0.021, {
      style: 'key',
      w: 0.017,
      h: 0.015,
      label: KEY_LABEL[k] ?? k,
    });
  });
  p.canvas.text(0, -0.175, side === 1 ? 'MCDU 1' : 'MCDU 2', { size: 0.0045 });
  for (const u of [-0.098, 0.098]) {
    p.canvas.screw(u, 0.195);
    p.canvas.screw(u, -0.195);
  }
}

/** 撥桿式手柄（繞面板 X 軸） */
function leverPivot(b: CockpitBuilder, p: Panel, u: number): Group {
  const g = new Group();
  g.position.set(u, 0, -PIVOT_DEPTH);
  // 面板座標：v 為前方、z 為上方；手柄沿 +z 伸出，繞 X 軸旋轉 → 前傾需負角
  p.obj.add(g);
  b.addStatic(
    new RoundedBoxGeometry(0.022, 0.2, 0.01, 1, 0.003),
    b.mats.black,
    p.local(u, 0, 0.0005),
  );
  return g;
}

export function buildPedestal(b: CockpitBuilder): PedestalParts {
  const m = b.mats;
  buildMcdu(b, 1);
  buildMcdu(b, 2);

  // ---------------- ECAM 控制盤 ----------------
  const ecp = flatPanel(b, 'ECP', -14.88, 0.14);
  const row1 = ['TO CONF', 'ENG', 'BLEED', 'PRESS', 'ELEC', 'HYD', 'FUEL', 'EMER CANC'];
  const row2 = ['CLR', 'APU', 'COND', 'DOOR', 'WHEEL', 'F/CTL', 'ALL', 'STS'];
  const us = [-0.2, -0.12, -0.07, -0.02, 0.03, 0.08, 0.13, 0.2];
  row1.forEach((k, i) =>
    b.pb(ecp, `ecp.${k}`, us[i], 0.04, {
      style: 'ecp',
      w: 0.042,
      h: 0.028,
      label: k === 'TO CONF' ? 'T.O\nCONFIG' : k === 'EMER CANC' ? 'EMER\nCANC' : k,
    }),
  );
  row2.forEach((k, i) =>
    b.pb(ecp, `ecp.${k}`, us[i], -0.002, { style: 'ecp', w: 0.042, h: 0.028, label: k }),
  );
  b.pb(ecp, 'ecp.RCL', 0.2, -0.045, { style: 'ecp', w: 0.042, h: 0.028 });
  b.pot(ecp, 'brt.ewd', -0.21, -0.045, 0.0075);
  b.pot(ecp, 'brt.sd', -0.13, -0.045, 0.0075);
  ecp.canvas.text(-0.21, -0.064, 'UPPER DISPLAY', { size: 0.0032 });
  ecp.canvas.text(-0.13, -0.064, 'LOWER DISPLAY', { size: 0.0032 });
  ecp.canvas.text(0.02, -0.045, 'ECAM', { size: 0.006 });

  // ---------------- 油門象限 ----------------
  const tq = flatPanel(b, 'THR', -14.55, 0.34);
  const detents: [string, number][] = [
    ['TOGA', TLA.TOGA],
    ['FLX\nMCT', TLA.FLX],
    ['CL', TLA.CL],
    ['0', TLA.IDLE],
    ['REV', TLA.MAX_REV],
  ];
  for (const [name, tla] of detents) {
    const v = -PIVOT_DEPTH * Math.tan(THR_ANGLE(tla));
    const lines = name.split('\n');
    lines.forEach((ln, k) =>
      tq.canvas.text(-0.1, v + (lines.length - 1) * 0.004 - k * 0.008, ln, { size: 0.0055 }),
    );
    tq.canvas.line(-0.082, v, -0.068, v, 0.0012);
    tq.canvas.line(0.068, v, 0.082, v, 0.0012);
  }
  tq.canvas.text(-0.1, 0.14, 'THR', { size: 0.005 });
  for (const side of [1, 2] as const) {
    const u = side === 1 ? -0.042 : 0.042;
    const piv = leverPivot(b, tq, u);
    const arm = new Mesh(
      b.geo('thrArm', () =>
        new RoundedBoxGeometry(0.016, 0.012, 0.24, 2, 0.004).translate(0, 0, 0.12),
      ),
      m.metal,
    );
    const grip = new Mesh(
      b.geo('thrGrip', () => new RoundedBoxGeometry(0.075, 0.034, 0.03, 3, 0.012)),
      m.dark,
    );
    grip.position.set(side === 1 ? -0.012 : 0.012, 0, 0.245);
    const disc = new Mesh(
      b.geo('thrDisc', () => new CylinderGeometry(0.0065, 0.0065, 0.008, 16).rotateZ(Math.PI / 2)),
      m.red,
    );
    const du = side === 1 ? -0.054 : 0.054;
    disc.position.set(du, 0, 0.245);
    piv.add(arm, grip, disc);
    arm.castShadow = true;
    grip.castShadow = true;
    const id = side === 1 ? 'thr.lever1' : 'thr.lever2';
    let cur = Number.NaN;
    b.anim((s, c) => {
      const target = THR_ANGLE(readControl(s, id).value);
      cur = Number.isNaN(cur) ? target : cur + (target - cur) * Math.min(1, c.dt * 22);
      piv.rotation.x = cur;
    });
    b.hit(
      id,
      piv,
      new Vector3(side === 1 ? -0.012 : 0.012, 0, 0.215),
      new Vector3(0.042, 0.024, 0.05),
    );
    b.hit('thr.instdisc', piv, new Vector3(du, 0, 0.245), new Vector3(0.008, 0.012, 0.012));
  }

  // 減速板（左）
  {
    const u = -0.19;
    const piv = leverPivot(b, tq, u);
    const arm = new Mesh(
      new RoundedBoxGeometry(0.012, 0.01, 0.2, 2, 0.003).translate(0, 0, 0.1),
      m.metal,
    );
    const grip = new Mesh(new RoundedBoxGeometry(0.03, 0.05, 0.028, 3, 0.01), m.knob);
    grip.position.z = 0.205;
    piv.add(arm, grip);
    grip.castShadow = true;
    for (const [name, h] of [
      ['RET', 0],
      ['1/2', 0.5],
      ['FULL', 1],
    ] as const) {
      const v = -PIVOT_DEPTH * Math.tan(SPD_ANGLE(h));
      tq.canvas.text(u - 0.04, v, name, { size: 0.005 });
    }
    tq.canvas.text(u, 0.14, 'SPEED BRAKE', { size: 0.0045 });
    tq.canvas.text(u - 0.04, -PIVOT_DEPTH * Math.tan(SPD_ANGLE(0)) + 0.014, 'ARM', {
      size: 0.0045,
    });
    let cur = Number.NaN;
    let lift = 0;
    b.anim((s, c) => {
      const val = readControl(s, 'spdbrk').value;
      const target = SPD_ANGLE(Math.max(0, val));
      cur = Number.isNaN(cur) ? target : cur + (target - cur) * Math.min(1, c.dt * 18);
      piv.rotation.x = cur;
      lift += ((val < 0 ? 0.018 : 0) - lift) * Math.min(1, c.dt * 15);
      piv.position.z = -PIVOT_DEPTH + lift;
    });
    b.hit('spdbrk', piv, new Vector3(0, 0, 0.19), new Vector3(0.022, 0.03, 0.04));
  }

  // 襟翼（右）
  {
    const u = 0.19;
    const piv = leverPivot(b, tq, u);
    const arm = new Mesh(
      new RoundedBoxGeometry(0.012, 0.01, 0.2, 2, 0.003).translate(0, 0, 0.1),
      m.metal,
    );
    const grip = new Mesh(new RoundedBoxGeometry(0.05, 0.022, 0.03, 3, 0.009), m.white);
    grip.position.z = 0.205;
    piv.add(arm, grip);
    grip.castShadow = true;
    ['0', '1', '2', '3', 'FULL'].forEach((name, i) => {
      const v = -PIVOT_DEPTH * Math.tan(FLAP_ANGLE(i));
      tq.canvas.text(u + 0.045, v, name, { size: 0.0055 });
      tq.canvas.line(u + 0.022, v, u + 0.03, v, 0.001);
    });
    tq.canvas.text(u, 0.14, 'FLAPS', { size: 0.0045 });
    let cur = Number.NaN;
    b.anim((s, c) => {
      const target = FLAP_ANGLE(readControl(s, 'flaps').value);
      cur = Number.isNaN(cur) ? target : cur + (target - cur) * Math.min(1, c.dt * 14);
      piv.rotation.x = cur;
    });
    b.hit('flaps', piv, new Vector3(0, 0, 0.19), new Vector3(0.03, 0.02, 0.04));
  }

  // ---------------- ENG ----------------
  const eng = flatPanel(b, 'ENG', -14.27, 0.14);
  eng.canvas.section(0, 0.06, 0.4, 'ENG');
  for (const n of [1, 2] as const) {
    const u = n === 1 ? -0.09 : 0.09;
    b.toggle(eng, `eng.master${n}`, u, 0.012, { big: true });
    eng.canvas.text(u, -0.03, `ENG ${n}`, { size: 0.0055 });
    const lu = n === 1 ? -0.16 : 0.16;
    b.lamp(
      eng,
      lu,
      0.022,
      0.03,
      0.016,
      (s) =>
        s.warnings.fireTest || (s.engines[n - 1].firePushed && s.engines[n - 1].state !== 'OFF')
          ? { text: 'FIRE', color: 'red' }
          : null,
      'FIRE',
    );
    b.lamp(
      eng,
      lu,
      0.0,
      0.03,
      0.016,
      (s) =>
        s.engines[n - 1].state === 'STARTING' && s.engines[n - 1].startTimer > 45
          ? { text: 'FAULT', color: 'amber' }
          : null,
      'FAULT',
    );
  }
  b.selector(eng, 'eng.mode', 0, -0.02, {
    radius: 0.011,
    spread: 1.6,
    labels: ['CRANK', 'NORM', 'IGN\nSTART'].map((l) => l.replaceAll('\n', ' ')),
    labelRadius: 0.026,
  });
  eng.canvas.text(0, -0.058, 'MODE', { size: 0.0045 });

  // ---------------- RUD TRIM / PARK BRK ----------------
  const rt = flatPanel(b, 'RUDTRIM', -14.08, 0.14);
  rt.canvas.section(-0.08, 0.06, 0.2, 'RUD TRIM');
  b.knob(rt, 'rudtrim', -0.12, 0.0, 0.014);
  rt.canvas.text(-0.12, -0.03, 'NOSE L    NOSE R', { size: 0.0035 });
  b.pb(rt, 'rudtrim.reset', -0.035, -0.03, { style: 'key', w: 0.024, h: 0.014, label: 'RESET' });
  const trimDisplay = new DynamicCanvas(256, 96);
  b.addStatic(
    new RoundedBoxGeometry(0.058, 0.026, 0.006, 1, 0.003),
    m.bezel,
    rt.local(-0.035, 0.015, 0.002),
  );
  const trimMesh = new Mesh(
    new PlaneGeometry(0.05, 0.019),
    new MeshBasicMaterial({ map: trimDisplay.texture, toneMapped: false, fog: false }),
  );
  trimMesh.position.set(-0.035, 0.015, 0.0055);
  rt.obj.add(trimMesh);

  rt.canvas.section(0.14, 0.06, 0.18, 'PARK BRK');
  const pb = new Group();
  pb.position.set(0.14, 0.0, 0.0);
  const stem = new Mesh(
    new CylinderGeometry(0.008, 0.01, 0.02, 16).rotateX(Math.PI / 2).translate(0, 0, 0.01),
    m.metal,
  );
  const handle = new Mesh(
    new RoundedBoxGeometry(0.075, 0.018, 0.016, 3, 0.007).translate(0, 0, 0.026),
    m.dark,
  );
  const tip = new Mesh(new SphereGeometry(0.011, 16, 12).translate(0.037, 0, 0.026), m.dark);
  pb.add(stem, handle, tip);
  handle.castShadow = true;
  rt.obj.add(pb);
  rt.canvas.text(0.19, -0.03, 'ON', { size: 0.005 });
  rt.canvas.text(0.14, -0.045, 'OFF', { size: 0.005 });
  let pbAng = Number.NaN;
  b.anim((s, c) => {
    const target = readControl(s, 'pbrk').value ? -Math.PI / 2 : 0;
    pbAng = Number.isNaN(pbAng) ? target : pbAng + (target - pbAng) * Math.min(1, c.dt * 10);
    pb.rotation.z = pbAng;
  });
  b.hit('pbrk', pb, new Vector3(0, 0, 0.026), new Vector3(0.05, 0.05, 0.02));

  // 前段空白面板（無線電/文件區，無按鈕）
  const blank = flatPanel(b, 'BLANK', -14.765, 0.085);
  blank.canvas.text(0, 0, 'COCKPIT DOCUMENTS', { size: 0.0045 });
  const tail = flatPanel(b, 'TAIL', -13.955, 0.1);
  tail.canvas.text(0, 0, 'A320neo', { size: 0.006 });

  return { trimDisplay };
}

export function drawTrim(d: DynamicCanvas, s: SimState, powered: boolean): void {
  const t = s.controls.rudderTrim;
  d.update(powered ? t.toFixed(1) : 'off', (g, w, h) => {
    g.fillStyle = '#070606';
    g.fillRect(0, 0, w, h);
    if (!powered) return;
    g.fillStyle = '#f7dcae';
    g.font = `700 60px ${LCD_FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(
      `${Math.abs(t) < 0.05 ? ' ' : t < 0 ? 'L' : 'R'} ${Math.abs(t).toFixed(1)}`,
      w / 2,
      h / 2,
    );
  });
}
