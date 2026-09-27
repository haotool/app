/**
 * 頂板：依 A320 佈局（由後往前）ADIRS / FIRE、HYD、FUEL、ELEC、AIR COND、ANTI ICE + CAB PRESS、
 * EXT LT、APU + SIGNS + INT LT。面板向後上傾斜，印字上緣朝後（仰視可讀）。
 */
import {
  BoxGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CONTROL_MAP, readControl } from '../../sim/controlDefs';
import type { SimState } from '../../sim/types';
import { basis, type CockpitBuilder, type Panel } from './builder';
import { DynamicCanvas, LCD_FONT } from './labels';

export interface OverheadParts {
  volts: { d: DynamicCanvas; bat: 1 | 2 }[];
}

const ALPHA = 15.4 * (Math.PI / 180);

export function buildOverhead(b: CockpitBuilder): OverheadParts {
  const yAxis = new Vector3(0, Math.sin(ALPHA), Math.cos(ALPHA));
  const O = basis(new Vector3(0, 1.5, -14.45), new Vector3(1, 0, 0), yAxis);
  // 背後箱體（遮住與頂棚間縫隙）
  b.addStatic(
    new BoxGeometry(0.84, 1.66, 0.18),
    b.mats.trim,
    O.clone().multiply(new Matrix4().makeTranslation(0, 0, -0.1)),
  );
  const sub = (name: string, u: number, v: number, w: number, h: number): Panel =>
    b.panel(
      name,
      O.clone().multiply(new Matrix4().makeTranslation(u, v, 0.001)),
      w,
      h,
      0.012,
      '#56646f',
    );
  const under = (p: Panel, u: number, v: number, id: string, dy = 0.022): void => {
    const def = CONTROL_MAP.get(id);
    if (!def) return;
    const words = def.label.split(' ');
    if (def.label.length > 9 && words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      p.canvas.text(u, v + dy, words.slice(0, mid).join(' '), { size: 0.0036 });
      p.canvas.text(u, v + dy - 0.0045, words.slice(mid).join(' '), { size: 0.0036 });
    } else p.canvas.text(u, v + dy, def.label, { size: 0.0042 });
  };
  const pb = (p: Panel, id: string, u: number, v: number): void => {
    b.pb(p, id, u, v);
    under(p, u, v, id);
  };
  const frame = (p: Panel, title: string): void => {
    p.canvas.section(0, p.h / 2 - 0.009, p.w - 0.02, title);
    for (const su of [-1, 1])
      for (const sv of [-1, 1]) p.canvas.screw(su * (p.w / 2 - 0.006), sv * (p.h / 2 - 0.006));
  };

  // ---------- ADIRS ----------
  const ad = sub('ADIRS', -0.27, 0.62, 0.22, 0.2);
  frame(ad, 'ADIRS');
  [1, 2, 3].forEach((n, i) => {
    const u = -0.065 + i * 0.065;
    b.selector(ad, `adirs.ir${n}`, u, -0.04, { radius: 0.009, spread: 1.4, labelRadius: 0.02 });
    ad.canvas.text(u, -0.08, `IR ${n}`, { size: 0.0042 });
    b.lamp(
      ad,
      u,
      0.035,
      0.026,
      0.012,
      (s) =>
        s.adirs.ir[i].mode !== 'OFF' && s.adirs.ir[i].alignRemaining > 0
          ? { text: 'ALIGN', color: 'white' }
          : null,
      'ALIGN',
    );
    b.lamp(
      ad,
      u,
      0.018,
      0.026,
      0.012,
      (s) =>
        s.adirs.ir[i].mode !== 'OFF' && !s.elec.acBus1 && !s.elec.acBus2 && !s.elec.acEss
          ? { text: 'ON BAT', color: 'amber' }
          : null,
      'ON BAT',
    );
  });

  // ---------- FIRE ----------
  const fire = sub('FIRE', 0.12, 0.62, 0.5, 0.2);
  frame(fire, 'FIRE');
  for (const [id, u] of [
    ['fire.eng1', -0.16],
    ['fire.apu', 0],
    ['fire.eng2', 0.16],
  ] as const) {
    b.pb(fire, id, u, 0.015, { style: 'fire', w: 0.042, h: 0.036 });
    fire.canvas.text(u, 0.06, CONTROL_MAP.get(id)?.label ?? '', { size: 0.0048 });
    // 保護蓋：上緣鉸鏈
    const hinge = new Group();
    hinge.position.set(u, 0.038, 0.014);
    const cover = new Mesh(
      b.geo('fireGuard', () =>
        new RoundedBoxGeometry(0.052, 0.048, 0.008, 2, 0.003).translate(0, -0.024, 0.004),
      ),
      b.mats.red,
    );
    cover.castShadow = true;
    hinge.add(cover);
    fire.obj.add(hinge);
    let ang = 0;
    const gid = `${id}.guard`;
    b.anim((s, c) => {
      const open = readControl(s, gid).guardOpen === true;
      ang += ((open ? 1.9 : 0) - ang) * Math.min(1, c.dt * 12);
      hinge.rotation.x = -ang;
    });
    b.hit(gid, hinge, new Vector3(0, -0.024, 0.006), new Vector3(0.028, 0.026, 0.008));
    b.lamp(
      fire,
      u - 0.03,
      -0.035,
      0.024,
      0.012,
      (s) => (s.warnings.fireTest ? { text: 'SQUIB', color: 'white' } : null),
      'SQUIB',
    );
    b.lamp(
      fire,
      u + 0.03,
      -0.035,
      0.024,
      0.012,
      (s) => (s.warnings.fireTest ? { text: 'DISCH', color: 'amber' } : null),
      'DISCH',
    );
    fire.canvas.text(u, -0.052, 'AGENT', { size: 0.0036 });
  }
  b.pb(fire, 'fire.test', 0.225, -0.065, { style: 'key', w: 0.024, h: 0.016 });
  fire.canvas.text(0.225, -0.08, 'TEST', { size: 0.0038 });

  // ---------- HYD ----------
  const hyd = sub('HYD', 0, 0.41, 0.76, 0.16);
  frame(hyd, 'HYD');
  pb(hyd, 'hyd.eng1pump', -0.28, -0.01);
  pb(hyd, 'hyd.elecpump', -0.1, -0.01);
  pb(hyd, 'hyd.ptu', 0.04, -0.01);
  pb(hyd, 'hyd.yelecpump', 0.16, -0.01);
  pb(hyd, 'hyd.eng2pump', 0.3, -0.01);
  hyd.canvas.text(-0.28, -0.05, 'GREEN', { size: 0.0038 });
  hyd.canvas.text(-0.1, -0.05, 'BLUE', { size: 0.0038 });
  hyd.canvas.text(0.23, -0.05, 'YELLOW', { size: 0.0038 });

  // ---------- FUEL ----------
  const fuel = sub('FUEL', 0, 0.24, 0.76, 0.16);
  frame(fuel, 'FUEL');
  const fu: [string, number][] = [
    ['fuel.l1', -0.31],
    ['fuel.l2', -0.23],
    ['fuel.c1', -0.1],
    ['fuel.xfeed', 0],
    ['fuel.c2', 0.1],
    ['fuel.r1', 0.23],
    ['fuel.r2', 0.31],
  ];
  for (const [id, u] of fu) pb(fuel, id, u, -0.015);

  // ---------- ELEC ----------
  const el = sub('ELEC', 0, 0.05, 0.76, 0.2);
  frame(el, 'ELEC');
  const volts: OverheadParts['volts'] = [];
  for (const [n, u] of [
    [1, -0.28],
    [2, -0.16],
  ] as const) {
    pb(el, `elec.bat${n}`, u, 0.015);
    const d = new DynamicCanvas(192, 72);
    b.addStatic(
      new RoundedBoxGeometry(0.044, 0.02, 0.005, 1, 0.002),
      b.mats.bezel,
      el.local(u, 0.062, 0.002),
    );
    const mesh = new Mesh(
      new PlaneGeometry(0.038, 0.014),
      new MeshBasicMaterial({ map: d.texture, toneMapped: false, fog: false }),
    );
    mesh.position.set(u, 0.062, 0.0048);
    el.obj.add(mesh);
    volts.push({ d, bat: n });
  }
  el.canvas.text(-0.22, 0.079, 'BAT', { size: 0.0038 });
  pb(el, 'elec.apugen', 0.12, 0.015);
  pb(el, 'elec.extpwr', 0.27, 0.015);
  pb(el, 'elec.gen1', -0.22, -0.055);
  pb(el, 'elec.bustie', 0, -0.055);
  pb(el, 'elec.gen2', 0.22, -0.055);
  el.canvas.line(-0.2, -0.055, -0.02, -0.055, 0.0008);
  el.canvas.line(0.02, -0.055, 0.2, -0.055, 0.0008);

  // ---------- AIR COND ----------
  const air = sub('AIR', 0, -0.15, 0.76, 0.18);
  frame(air, 'AIR COND');
  pb(air, 'air.pack1', -0.32, -0.03);
  pb(air, 'air.eng1bleed', -0.19, -0.03);
  b.selector(air, 'air.xbleed', -0.07, -0.035, { radius: 0.0085, spread: 1.4, labelRadius: 0.019 });
  air.canvas.text(-0.07, -0.063, 'X BLEED', { size: 0.0038 });
  pb(air, 'air.apubleed', 0.07, -0.03);
  pb(air, 'air.eng2bleed', 0.19, -0.03);
  pb(air, 'air.pack2', 0.32, -0.03);
  b.selector(air, 'air.packflow', 0, 0.045, { radius: 0.0075, spread: 1.4, labelRadius: 0.017 });
  air.canvas.text(0, 0.018, 'PACK FLOW', { size: 0.0036 });

  // ---------- ANTI ICE / CAB PRESS ----------
  const ai = sub('ANTIICE', -0.2, -0.33, 0.36, 0.16);
  frame(ai, 'ANTI ICE');
  pb(ai, 'ai.wing', -0.12, -0.015);
  pb(ai, 'ai.eng1', -0.04, -0.015);
  pb(ai, 'ai.eng2', 0.04, -0.015);
  pb(ai, 'ai.probe', 0.125, -0.015);
  const pr = sub('PRESS', 0.2, -0.33, 0.36, 0.16);
  frame(pr, 'CABIN PRESS');
  pb(pr, 'press.modesel', -0.11, -0.015);
  b.toggle(pr, 'press.manvs', 0, -0.015);
  pr.canvas.text(0, 0.03, 'MAN V/S CTL', { size: 0.0036 });
  pb(pr, 'press.ditching', 0.11, -0.015);

  // ---------- EXT LT ----------
  const ext = sub('EXTLT', 0, -0.5, 0.76, 0.16);
  frame(ext, 'EXT LT');
  const lts = [
    'lt.strobe',
    'lt.beacon',
    'lt.wing',
    'lt.navlogo',
    'lt.rwyturnoff',
    'lt.landL',
    'lt.landR',
    'lt.nose',
  ];
  lts.forEach((id, i) => {
    const u = -0.33 + i * 0.094;
    b.toggle(ext, id, u - 0.008, -0.02);
    ext.canvas.text(u, 0.04, CONTROL_MAP.get(id)?.label ?? '', { size: 0.0038 });
  });

  // ---------- APU / SIGNS / INT LT ----------
  const apu = sub('APU', -0.28, -0.7, 0.2, 0.18);
  frame(apu, 'APU');
  pb(apu, 'apu.master', 0, 0.02);
  pb(apu, 'apu.start', 0, -0.045);
  const sg = sub('SIGNS', -0.04, -0.7, 0.26, 0.18);
  frame(sg, 'SIGNS');
  b.toggle(sg, 'sign.seatbelts', -0.06, -0.015);
  sg.canvas.text(-0.06, 0.042, 'SEAT BELTS', { size: 0.0038 });
  b.toggle(sg, 'sign.nosmoking', 0.06, -0.015);
  sg.canvas.text(0.06, 0.042, 'NO SMOKING', { size: 0.0038 });
  const il = sub('INTLT', 0.25, -0.7, 0.26, 0.18);
  frame(il, 'INT LT');
  b.toggle(il, 'lt.dome', -0.08, -0.015);
  il.canvas.text(-0.08, 0.042, 'DOME', { size: 0.0038 });
  b.toggle(il, 'lt.annun', 0.0, -0.015);
  il.canvas.text(0.0, 0.042, 'ANN LT', { size: 0.0038 });
  b.pot(il, 'lt.integral', 0.08, -0.01, 0.007);
  il.canvas.text(0.08, 0.042, 'OVHD INTEG LT', { size: 0.0034 });

  return { volts };
}

export function drawVolts(parts: OverheadParts, s: SimState): void {
  for (const { d, bat } of parts.volts) {
    const on = s.elec.hotBus || s.elec.dcBat;
    const v = bat === 1 ? s.elec.bat1V : s.elec.bat2V;
    d.update(on ? v.toFixed(1) : 'off', (g, w, h) => {
      g.fillStyle = '#070606';
      g.fillRect(0, 0, w, h);
      if (!on) return;
      g.fillStyle = '#ffb347';
      g.font = `700 50px ${LCD_FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(`${v.toFixed(1)}V`, w / 2, h / 2 + 2);
    });
  }
}
