/**
 * SD 系統頁：ELEC、HYD、FUEL、BLEED、PRESS、COND、APU。數值全部取自 SimState。
 */
import type { SimState } from '../../sim/types';
import {
  C,
  type Ctx,
  arcGauge,
  circle,
  fillRect,
  gaugeTick,
  line,
  rect,
  text,
  valve,
} from './common';

export function pageTitle(ctx: Ctx, t: string): void {
  text(ctx, t, 20, 30, C.white, 30, 'left', true);
  const w = ctx.measureText(t).width;
  line(ctx, 20, 48, 20 + w, 48, C.white, 2);
}

function box(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  fillRect(ctx, x, y, w, h, '#0b0d10');
  rect(ctx, x, y, w, h, color, 2);
}

function busBox(ctx: Ctx, x: number, y: number, name: string, on: boolean): void {
  box(ctx, x, y, 128, 44, C.grey);
  text(ctx, name, x + 64, y + 22, on ? C.green : C.amber, 24, 'center', true);
}

/** 負載顯示：≤1.5 視為比例，否則已是百分比 */
const pct = (v: number): number => Math.round(v <= 1.5 ? v * 100 : v);

function genBox(
  ctx: Ctx,
  x: number,
  y: number,
  name: string,
  online: boolean,
  expected: boolean,
  load: number,
): void {
  box(ctx, x, y, 150, 128, C.grey);
  text(
    ctx,
    name,
    x + 75,
    y + 20,
    online ? C.white : expected ? C.amber : C.white,
    23,
    'center',
    true,
  );
  if (!online) {
    if (!expected) text(ctx, 'OFF', x + 75, y + 70, C.white, 22, 'center');
    return;
  }
  text(ctx, String(pct(load)), x + 90, y + 50, C.green, 24, 'right', true);
  text(ctx, '%', x + 100, y + 50, C.cyan, 20);
  text(ctx, '115', x + 90, y + 80, C.green, 24, 'right', true);
  text(ctx, 'V', x + 100, y + 80, C.cyan, 20);
  text(ctx, '400', x + 90, y + 108, C.green, 24, 'right', true);
  text(ctx, 'HZ', x + 100, y + 108, C.cyan, 20);
}

export function drawElec(ctx: Ctx, s: SimState): void {
  const e = s.elec;
  pageTitle(ctx, 'ELEC');
  const onAc = e.acBus1 || e.acBus2;
  const batBox = (x: number, n: 1 | 2): void => {
    const on = n === 1 ? e.bat1 : e.bat2;
    const v = n === 1 ? e.bat1V : e.bat2V;
    box(ctx, x, 70, 150, 100, C.grey);
    text(ctx, `BAT ${n}`, x + 75, 88, on ? C.white : C.amber, 23, 'center', true);
    if (!on) {
      text(ctx, 'OFF', x + 75, 130, C.white, 22, 'center');
      return;
    }
    const amps = onAc
      ? Math.round((1 - (n === 1 ? e.bat1Charge : e.bat2Charge)) * 60)
      : -Math.round(12 + (e.acEss ? 0 : 20));
    text(ctx, v.toFixed(1), x + 96, 120, v < 25 ? C.amber : C.green, 24, 'right', true);
    text(ctx, 'V', x + 104, 120, C.cyan, 20);
    text(ctx, String(amps), x + 96, 150, amps < 0 ? C.amber : C.green, 24, 'right', true);
    text(ctx, 'A', x + 104, 150, C.cyan, 20);
  };
  batBox(60, 1);
  batBox(558, 2);
  busBox(ctx, 320, 96, 'DC BAT', e.dcBat);
  line(ctx, 210, 118, 320, 118, e.bat1 && e.dcBat ? C.green : C.dim, 3);
  line(ctx, 448, 118, 558, 118, e.bat2 && e.dcBat ? C.green : C.dim, 3);

  busBox(ctx, 60, 230, 'DC 1', e.dcBus1);
  busBox(ctx, 320, 230, 'DC ESS', e.dcEss);
  busBox(ctx, 580, 230, 'DC 2', e.dcBus2);
  line(ctx, 124, 170, 124, 230, e.dcBus1 && e.dcBat ? C.green : C.dim, 3);
  line(ctx, 384, 140, 384, 230, e.dcEss && e.dcBat ? C.green : C.dim, 3);

  // TR
  for (const [x, lbl, on] of [
    [124, 'TR 1', e.acBus1 && e.dcBus1],
    [384, 'ESS TR', e.acEss && e.dcEss],
    [644, 'TR 2', e.acBus2 && e.dcBus2],
  ] as const) {
    line(ctx, x, 274, x, 350, on ? C.green : C.dim, 3);
    fillRect(ctx, x - 44, 296, 88, 30, '#0b0d10');
    text(ctx, lbl, x, 311, on ? C.white : C.dim, 20, 'center');
  }
  busBox(ctx, 60, 350, 'AC 1', e.acBus1);
  busBox(ctx, 320, 350, 'AC ESS', e.acEss);
  busBox(ctx, 580, 350, 'AC 2', e.acBus2);
  line(ctx, 188, 372, 320, 372, e.acEss && e.acBus1 ? C.green : C.dim, 3);

  // 發電來源
  const e1 = s.engines[0].state !== 'OFF';
  const e2 = s.engines[1].state !== 'OFF';
  genBox(ctx, 20, 480, 'GEN 1', e.gen1Online, e.gen1 && e1, e.loads.load1);
  genBox(ctx, 598, 480, 'GEN 2', e.gen2Online, e.gen2 && e2, e.loads.load2);
  if (s.apu.state !== 'OFF' || e.apuGenOnline)
    genBox(
      ctx,
      200,
      480,
      'APU GEN',
      e.apuGenOnline,
      e.apuGen && s.apu.state === 'AVAILABLE',
      e.loads.apuLoad,
    );
  if (e.extPwrAvail) {
    box(ctx, 400, 520, 150, 90, C.grey);
    text(ctx, 'EXT PWR', 475, 540, C.white, 22, 'center', true);
    text(ctx, '115', 494, 574, C.green, 22, 'right', true);
    text(ctx, 'V', 502, 574, C.cyan, 18);
    text(ctx, '400', 494, 600, C.green, 22, 'right', true);
    text(ctx, 'HZ', 502, 600, C.cyan, 18);
  }
  const src = (bus: 1 | 2): string | null => (bus === 1 ? e.ac1Source : e.ac2Source);
  line(ctx, 95, 480, 95, 394, src(1) === 'GEN1' ? C.green : C.dim, 3);
  line(ctx, 673, 480, 673, 394, src(2) === 'GEN2' ? C.green : C.dim, 3);
  const tieOn =
    e.busTie &&
    (src(1) === 'APU' ||
      src(1) === 'EXT' ||
      src(2) === 'APU' ||
      src(2) === 'EXT' ||
      src(1) !== src(2));
  line(ctx, 124, 440, 644, 440, tieOn && e.acBus1 && e.acBus2 ? C.green : C.dim, 3);
  line(ctx, 124, 394, 124, 440, tieOn && e.acBus1 ? C.green : C.dim, 3);
  line(ctx, 644, 394, 644, 440, tieOn && e.acBus2 ? C.green : C.dim, 3);
  if (e.apuGenOnline) line(ctx, 275, 480, 275, 440, C.green, 3);
  if (e.extPwrOn) line(ctx, 475, 520, 475, 440, C.green, 3);
}

export function drawHyd(ctx: Ctx, s: SimState): void {
  const h = s.hyd;
  pageTitle(ctx, 'HYD');
  const cols: [string, number, number][] = [
    ['GREEN', 130, h.green.pressure],
    ['BLUE', 384, h.blue.pressure],
    ['YELLOW', 638, h.yellow.pressure],
  ];
  const qty = [h.green.quantity, h.blue.quantity, h.yellow.quantity];
  cols.forEach(([name, x, p], i) => {
    const ok = p > 1450;
    text(ctx, name, x, 92, ok ? C.white : C.amber, 26, 'center', true);
    text(ctx, String(Math.round(p / 50) * 50), x, 132, ok ? C.green : C.amber, 30, 'center', true);
    // 流向三角
    ctx.fillStyle = ok ? C.green : C.amber;
    ctx.beginPath();
    ctx.moveTo(x, 150);
    ctx.lineTo(x - 12, 170);
    ctx.lineTo(x + 12, 170);
    ctx.closePath();
    ctx.fill();
    line(ctx, x, 170, x, 330, ok ? C.green : C.amber, 3);
    // 油箱量
    rect(ctx, x - 14, 440, 28, 160, C.white, 2);
    const q = Math.max(0, Math.min(1, qty[i]));
    fillRect(ctx, x - 12, 598 - q * 156, 24, q * 156, q < 0.3 ? C.amber : C.green);
    line(ctx, x, 400, x, 440, ok ? C.green : C.dim, 3);
  });
  const pump = (x: number, label: string, on: boolean, pressed: boolean): void => {
    box(ctx, x - 40, 330, 80, 70, C.grey);
    if (!on) text(ctx, 'OFF', x, 365, C.amber, 22, 'center', true);
    else if (!pressed) text(ctx, 'LO', x, 365, C.amber, 24, 'center', true);
    else line(ctx, x, 334, x, 396, C.green, 4);
    text(ctx, label, x, 420, C.white, 20, 'center');
  };
  pump(130, 'ENG 1', h.eng1Pump, h.eng1Pump && s.engines[0].n2 > 50);
  pump(
    384,
    'ELEC',
    h.elecPump,
    h.elecPump &&
      (s.elec.acBus1 || s.elec.acBus2) &&
      (s.engines[0].n2 > 50 || s.engines[1].n2 > 50 || !s.flight.onGround),
  );
  pump(638, 'ENG 2', h.eng2Pump, h.eng2Pump && s.engines[1].n2 > 50);
  // PTU
  const ptuCol = !h.ptu ? C.amber : h.ptuActive ? C.green : C.white;
  line(ctx, 130, 250, 638, 250, ptuCol, 2);
  text(ctx, 'PTU', 384, 226, ptuCol, 22, 'center');
  for (const dir of [-1, 1]) {
    const x = 384 + dir * 70;
    ctx.fillStyle = ptuCol;
    ctx.beginPath();
    ctx.moveTo(x + dir * 14, 250);
    ctx.lineTo(x - dir * 4, 240);
    ctx.lineTo(x - dir * 4, 260);
    ctx.closePath();
    ctx.fill();
  }
  if (h.yellowElecPump) text(ctx, 'ELEC', 720, 300, C.green, 20, 'center');
}

export function drawFuel(ctx: Ctx, s: SimState): void {
  const f = s.fuel;
  pageTitle(ctx, 'FUEL');
  text(ctx, 'F.USED', 384, 40, C.white, 22, 'center');
  text(ctx, '1+2', 384, 64, C.white, 20, 'center');
  text(
    ctx,
    String(Math.round((f.used1 + f.used2) / 10) * 10),
    384,
    94,
    C.green,
    26,
    'center',
    true,
  );
  text(ctx, 'KG', 430, 94, C.cyan, 18);
  // 發動機與 LP 閥
  const eng = (x: number, i: 0 | 1): void => {
    const e = s.engines[i];
    text(ctx, String(i + 1), x, 70, e.state === 'OFF' ? C.amber : C.white, 34, 'center', true);
    text(
      ctx,
      String(Math.round((i === 0 ? f.used1 : f.used2) / 10) * 10),
      x,
      108,
      C.green,
      22,
      'center',
    );
    valve(ctx, x, 170, e.fuelValve, e.fuelValve ? C.green : C.amber);
    line(ctx, x, 184, x, 300, e.fuelValve ? C.green : C.dim, 3);
  };
  eng(130, 0);
  eng(638, 1);
  // X FEED
  valve(ctx, 384, 230, f.xfeed, f.xfeed ? C.green : C.white, false);
  line(ctx, 130, 230, 370, 230, f.xfeed ? C.green : C.dim, 3);
  line(ctx, 398, 230, 638, 230, f.xfeed ? C.green : C.dim, 3);
  if (s.apu.state !== 'OFF') {
    text(ctx, 'APU', 300, 150, C.white, 20, 'center');
    line(ctx, 300, 164, 300, 230, C.green, 2);
  }
  const powered = s.elec.acBus1 || s.elec.acBus2;
  const pumpBox = (x: number, on: boolean): void => {
    box(ctx, x - 26, 300, 52, 52, C.grey);
    if (on && powered) line(ctx, x, 304, x, 348, C.green, 4);
    else text(ctx, 'LO', x, 326, C.amber, 20, 'center', true);
  };
  pumpBox(90, f.pumps.l1);
  pumpBox(170, f.pumps.l2);
  pumpBox(344, f.pumps.c1);
  pumpBox(424, f.pumps.c2);
  pumpBox(598, f.pumps.r1);
  pumpBox(678, f.pumps.r2);
  // 油箱
  const tank = (x: number, w: number, kg: number): void => {
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 370, w, 120);
    text(ctx, String(Math.round(kg / 10) * 10), x + w / 2, 430, C.green, 28, 'center', true);
  };
  tank(30, 210, f.left);
  tank(290, 188, f.center);
  tank(528, 210, f.right);
  text(ctx, 'KG', 384, 470, C.cyan, 18, 'center');
  text(ctx, 'FOB', 60, 560, C.white, 24);
  text(ctx, String(Math.round(f.fob / 10) * 10), 280, 560, C.green, 30, 'right', true);
  text(ctx, 'KG', 292, 560, C.cyan, 20);
  text(ctx, 'FF', 480, 560, C.white, 22);
  text(
    ctx,
    String(Math.round((s.engines[0].ff + s.engines[1].ff) / 20) * 20),
    640,
    560,
    C.green,
    26,
    'right',
    true,
  );
  text(ctx, 'KG/H', 650, 560, C.cyan, 18);
}

export function drawBleed(ctx: Ctx, s: SimState): void {
  const p = s.pneu;
  pageTitle(ctx, 'BLEED');
  const apuAvail = s.apu.state === 'AVAILABLE';
  // RAM AIR
  valve(ctx, 384, 110, false, C.green, false);
  text(ctx, 'RAM AIR', 384, 76, C.white, 20, 'center');
  const side = (x: number, i: 0 | 1): void => {
    const e = s.engines[i];
    const bleedOn = (i === 0 ? p.eng1Bleed : p.eng2Bleed) && e.bleedPress > 8;
    const duct = i === 0 ? p.ductL : p.ductR;
    const pack = i === 0 ? p.pack1 : p.pack2;
    const flow = i === 0 ? p.pack1Flow : p.pack2Flow;
    // 引擎
    text(ctx, String(i + 1), x, 640, e.state === 'OFF' ? C.amber : C.white, 32, 'center', true);
    line(ctx, x, 620, x, 494, bleedOn ? C.green : C.dim, 3);
    valve(
      ctx,
      x,
      480,
      bleedOn,
      bleedOn || !(i === 0 ? p.eng1Bleed : p.eng2Bleed) ? C.green : C.amber,
    );
    line(ctx, x, 466, x, 300, duct > 4 ? C.green : C.dim, 3);
    text(
      ctx,
      String(Math.round(duct)),
      x + 40,
      420,
      duct > 4 && duct < 57 ? C.green : C.amber,
      26,
      'left',
      true,
    );
    text(ctx, 'PSI', x + 40, 448, C.cyan, 18);
    // Pack
    valve(ctx, x, 286, pack && flow > 0.1, pack ? C.green : C.amber);
    box(ctx, x - 70, 170, 140, 90, C.grey);
    text(ctx, `PACK ${i + 1}`, x, 190, pack ? C.white : C.amber, 22, 'center');
    text(
      ctx,
      String(Math.round(pack && flow > 0.1 ? 8 + (1 - flow) * 6 : 0)),
      x - 20,
      226,
      C.green,
      24,
      'right',
      true,
    );
    text(ctx, '°C', x - 12, 226, C.cyan, 18);
    text(ctx, String(Math.round(flow * 100)), x + 58, 226, C.green, 22, 'right', true);
    text(ctx, '%', x + 62, 226, C.cyan, 16);
  };
  side(150, 0);
  side(618, 1);
  // X BLEED 導管
  line(ctx, 150, 360, 370, 360, C.green, 3);
  line(ctx, 398, 360, 618, 360, p.xbleedOpen ? C.green : C.dim, 3);
  valve(ctx, 384, 360, p.xbleedOpen, C.green, false);
  text(ctx, 'X BLEED', 384, 330, C.white, 18, 'center');
  // APU
  const apuBleed = p.apuBleed && apuAvail;
  text(ctx, 'APU', 384, 640, apuAvail ? C.white : C.dim, 26, 'center', true);
  line(ctx, 384, 620, 384, 494, apuBleed ? C.green : C.dim, 3);
  valve(ctx, 384, 480, apuBleed, C.green);
  line(ctx, 384, 466, 384, 374, apuBleed ? C.green : C.dim, 3);
  text(ctx, p.packFlow, 384, 250, C.green, 22, 'center');
  text(ctx, 'FLOW', 384, 226, C.white, 18, 'center');
}

export function drawPress(ctx: Ctx, s: SimState): void {
  const p = s.press;
  pageTitle(ctx, 'CAB PRESS');
  text(ctx, 'LDG ELEV', 400, 30, C.white, 20);
  text(ctx, p.modeMan ? 'MAN' : 'AUTO', 530, 30, C.green, 20);
  text(ctx, String(Math.round(p.landingElev)), 680, 30, C.green, 22, 'right', true);
  text(ctx, 'FT', 690, 30, C.cyan, 18);
  // ΔP
  arcGauge(ctx, 130, 220, 76, (p.deltaP + 1) / 10, p.deltaP > 8.5 ? C.amber : C.green, 9.5 / 10);
  text(ctx, 'ΔP', 130, 118, C.white, 22, 'center');
  text(ctx, p.deltaP.toFixed(1), 170, 262, C.green, 26, 'right', true);
  text(ctx, 'PSI', 130, 296, C.cyan, 18, 'center');
  // CAB V/S
  arcGauge(
    ctx,
    384,
    220,
    76,
    (p.cabinVs + 2000) / 4000,
    Math.abs(p.cabinVs) > 1750 ? C.amber : C.green,
    null,
    180,
  );
  gaugeTick(ctx, 384, 220, 76, 0.5, C.white, 12, 3, 180);
  text(ctx, 'V/S', 384, 118, C.white, 22, 'center');
  text(ctx, String(Math.round(p.cabinVs / 50) * 50), 430, 262, C.green, 26, 'right', true);
  text(ctx, 'FT/MIN', 384, 296, C.cyan, 18, 'center');
  // CAB ALT
  arcGauge(ctx, 638, 220, 76, p.cabinAlt / 10000, p.cabinAlt > 9550 ? C.red : C.green, 0.955);
  text(ctx, 'CAB ALT', 638, 118, C.white, 22, 'center');
  text(
    ctx,
    String(Math.round(p.cabinAlt / 50) * 50),
    690,
    262,
    p.cabinAlt > 9550 ? C.red : C.green,
    26,
    'right',
    true,
  );
  text(ctx, 'FT', 638, 296, C.cyan, 18, 'center');
  // 外流閥
  const ox = 520;
  const oy = 520;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(ox, oy, 90, Math.PI, Math.PI * 1.5);
  ctx.stroke();
  const a = Math.PI + (1 - p.outflowValve) * Math.PI * 0.5;
  line(
    ctx,
    ox,
    oy,
    ox + Math.cos(a) * 96,
    oy + Math.sin(a) * 96,
    p.outflowValve > 0.95 && !s.flight.onGround ? C.amber : C.green,
    5,
  );
  circle(ctx, ox, oy, 8, C.green, 2, true);
  text(ctx, 'OUTFLOW', ox + 30, oy + 30, C.white, 18);
  if (p.modeMan) text(ctx, 'MAN', 220, 400, C.green, 24, 'center');
  if (p.ditching) text(ctx, 'DITCHING', 220, 440, C.amber, 24, 'center');
  text(ctx, 'SAFETY', 690, 400, C.white, 18, 'center');
  valve(ctx, 690, 440, false, C.green, false);
  for (const [x, on] of [
    [100, s.pneu.pack1],
    [300, s.pneu.pack2],
  ] as const) {
    const col = on ? C.green : C.amber;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, 590);
    ctx.lineTo(x - 12, 610);
    ctx.lineTo(x + 12, 610);
    ctx.closePath();
    ctx.fill();
    text(ctx, x === 100 ? 'PACK 1' : 'PACK 2', x, 636, on ? C.white : C.amber, 20, 'center');
  }
}

export function drawCond(ctx: Ctx, s: SimState): void {
  const t = s.pneu.cabinTemp;
  pageTitle(ctx, 'COND');
  text(ctx, 'TEMP :', 560, 30, C.white, 20);
  text(ctx, '°C', 690, 30, C.cyan, 20);
  // 機身俯視輪廓
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(60, 230);
  ctx.quadraticCurveTo(80, 150, 180, 150);
  ctx.lineTo(700, 150);
  ctx.lineTo(730, 190);
  ctx.lineTo(730, 270);
  ctx.lineTo(700, 310);
  ctx.lineTo(180, 310);
  ctx.quadraticCurveTo(80, 310, 60, 230);
  ctx.stroke();
  line(ctx, 250, 150, 250, 310, C.white, 2);
  line(ctx, 480, 150, 480, 310, C.white, 2);
  const packs = s.pneu.pack1 || s.pneu.pack2;
  const zones: [string, number, number][] = [
    ['CKPT', 160, t - 0.5],
    ['FWD', 365, t],
    ['AFT', 590, t + 0.6],
  ];
  for (const [n, x, v] of zones) {
    text(ctx, n, x, 190, C.white, 22, 'center');
    text(ctx, v.toFixed(0), x, 236, C.green, 28, 'center', true);
    text(ctx, packs ? (v - 4).toFixed(0) : 'XX', x, 280, packs ? C.green : C.amber, 20, 'center');
  }
  text(ctx, 'HOT', 384, 420, C.white, 20, 'center');
  text(ctx, 'AIR', 384, 444, C.white, 20, 'center');
  valve(ctx, 384, 500, packs, packs ? C.green : C.amber);
  line(ctx, 160, 540, 610, 540, packs ? C.green : C.dim, 3);
  for (const x of [160, 365, 590]) line(ctx, x, 540, x, 310, packs ? C.green : C.dim, 2);
}

export function drawApu(ctx: Ctx, s: SimState): void {
  const a = s.apu;
  const e = s.elec;
  pageTitle(ctx, 'APU');
  if (a.state === 'AVAILABLE') text(ctx, 'AVAIL', 384, 36, C.green, 28, 'center', true);
  genBox(
    ctx,
    40,
    90,
    'APU GEN',
    e.apuGenOnline,
    e.apuGen && a.state === 'AVAILABLE',
    e.loads.apuLoad,
  );
  // APU BLEED
  text(ctx, 'APU BLEED', 590, 110, C.white, 22, 'center');
  text(
    ctx,
    String(Math.round(a.bleedPress)),
    600,
    150,
    a.bleedPress > 0 ? C.green : C.amber,
    26,
    'right',
    true,
  );
  text(ctx, 'PSI', 610, 150, C.cyan, 18);
  const bleedOpen = s.pneu.apuBleed && a.state === 'AVAILABLE';
  valve(ctx, 590, 214, bleedOpen, C.green);
  line(ctx, 590, 228, 590, 280, bleedOpen ? C.green : C.dim, 3);
  // N / EGT
  arcGauge(ctx, 200, 400, 80, a.n / 110, C.green, 107 / 110);
  text(ctx, 'N', 330, 380, C.white, 24, 'center');
  text(ctx, String(Math.round(a.n)), 250, 440, C.green, 28, 'right', true);
  text(ctx, '%', 330, 410, C.cyan, 18, 'center');
  arcGauge(ctx, 200, 590, 80, a.egt / 1100, a.egt > 1040 ? C.red : C.green, 1090 / 1100);
  text(ctx, 'EGT', 330, 570, C.white, 24, 'center');
  text(ctx, String(Math.round(a.egt / 5) * 5), 250, 630, C.green, 28, 'right', true);
  text(ctx, '°C', 330, 600, C.cyan, 18, 'center');
  if (a.flap > 0.95) text(ctx, 'FLAP OPEN', 560, 420, C.green, 24, 'center');
  if (s.failures.apuFail) text(ctx, 'APU FAULT', 560, 520, C.amber, 22, 'center');
}
