/**
 * SD（下 ECAM）：依 ecam.sdPage 分派 13 頁 + 底部永久資料列（TAT/SAT、時間、GW）。
 */
import type { SimState } from '../../sim/types';
import { C, type Ctx, arcGauge, circle, clamp, fillRect, line, rect, text } from './common';
import {
  drawApu,
  drawBleed,
  drawCond,
  drawElec,
  drawFuel,
  drawHyd,
  drawPress,
  pageTitle,
} from './sdSystems';

const W = 768;

export function drawSd(ctx: Ctx, s: SimState): void {
  fillRect(ctx, 0, 0, W, W, C.bg);
  switch (s.ecam.sdPage) {
    case 'ENG':
      drawEng(ctx, s);
      break;
    case 'BLEED':
      drawBleed(ctx, s);
      break;
    case 'PRESS':
      drawPress(ctx, s);
      break;
    case 'ELEC':
      drawElec(ctx, s);
      break;
    case 'HYD':
      drawHyd(ctx, s);
      break;
    case 'FUEL':
      drawFuel(ctx, s);
      break;
    case 'APU':
      drawApu(ctx, s);
      break;
    case 'COND':
      drawCond(ctx, s);
      break;
    case 'DOOR':
      drawDoor(ctx, s);
      break;
    case 'WHEEL':
      drawWheel(ctx, s);
      break;
    case 'F/CTL':
      drawFctl(ctx, s);
      break;
    case 'STS':
      drawSts(ctx, s);
      break;
    case 'CRUISE':
      drawCruise(ctx, s);
      break;
  }
  drawPermanent(ctx, s);
}

function drawPermanent(ctx: Ctx, s: SimState): void {
  line(ctx, 0, 690, W, 690, C.white, 2);
  line(ctx, 256, 700, 256, 760, C.white, 2);
  line(ctx, 512, 700, 512, 760, C.white, 2);
  const f = s.flight;
  const sgn = (v: number): string => (v >= 0 ? '+' : '') + String(Math.round(v));
  text(ctx, 'TAT', 20, 714, C.white, 22);
  text(ctx, sgn(f.tat), 160, 714, C.green, 24, 'right', true);
  text(ctx, '°C', 170, 714, C.cyan, 18);
  text(ctx, 'SAT', 20, 744, C.white, 22);
  text(ctx, sgn(f.oat), 160, 744, C.green, 24, 'right', true);
  text(ctx, '°C', 170, 744, C.cyan, 18);
  const tod = s.weather.timeOfDay;
  const hh = Math.floor(tod) % 24;
  const mm = Math.floor((tod - Math.floor(tod)) * 60);
  text(ctx, String(hh).padStart(2, '0'), 350, 730, C.green, 28, 'right', true);
  text(ctx, 'H', 372, 730, C.cyan, 20, 'center');
  text(ctx, String(mm).padStart(2, '0'), 394, 730, C.green, 28, 'left', true);
  text(ctx, 'GW', 530, 730, C.white, 22);
  text(ctx, String(Math.round(s.aircraft.mass / 100) * 100), 690, 730, C.green, 26, 'right', true);
  text(ctx, 'KG', 700, 730, C.cyan, 18);
}

/** 振動值由轉速推導（顯示量，非獨立狀態） */
const vib = (n: number): number => (n > 5 ? 0.3 + (n / 100) * 0.6 : 0);

function drawEng(ctx: Ctx, s: SimState): void {
  pageTitle(ctx, 'ENGINE');
  const xs = [200, 568];
  text(ctx, 'F.USED', W / 2, 110, C.white, 22, 'center');
  text(ctx, 'KG', W / 2, 136, C.cyan, 18, 'center');
  text(ctx, 'OIL', W / 2, 240, C.white, 22, 'center');
  text(ctx, 'PSI', W / 2, 266, C.cyan, 18, 'center');
  text(ctx, 'VIB N1', W / 2, 420, C.white, 22, 'center');
  text(ctx, 'N2', W / 2, 452, C.white, 22, 'center');
  text(ctx, 'NAC', W / 2, 510, C.white, 22, 'center');
  s.engines.forEach((e, i) => {
    const x = xs[i];
    const used = i === 0 ? s.fuel.used1 : s.fuel.used2;
    text(ctx, String(Math.round(used / 10) * 10), x, 120, C.green, 28, 'center', true);
    arcGauge(
      ctx,
      x,
      260,
      64,
      e.oilPress / 100,
      e.oilPress < 13 && e.n2 > 50 ? C.red : C.green,
      null,
      180,
    );
    text(
      ctx,
      String(Math.round(e.oilPress)),
      x + 22,
      300,
      e.oilPress < 13 && e.n2 > 50 ? C.red : C.green,
      24,
      'right',
      true,
    );
    text(ctx, vib(e.n1).toFixed(1), x, 420, C.green, 24, 'center', true);
    text(ctx, vib(e.n2).toFixed(1), x, 452, C.green, 24, 'center', true);
    text(ctx, String(Math.round(60 + e.n2 * 1.1)), x, 510, C.green, 24, 'center', true);
    // 起動閥
    const open = e.starterValve;
    circle(ctx, x, 600, 16, C.green, 2.5);
    if (open) line(ctx, x, 584, x, 616, C.green, 3);
    else line(ctx, x - 16, 600, x + 16, 600, C.green, 3);
    line(ctx, x, 616, x, 650, open ? C.green : C.dim, 3);
    text(
      ctx,
      `${Math.round(e.bleedPress)}`,
      x,
      666,
      e.bleedPress > 0 ? C.green : C.amber,
      22,
      'center',
    );
    if (e.ignition) text(ctx, 'IGN  A B', x, 556, C.green, 22, 'center');
  });
}

function drawDoor(ctx: Ctx, s: SimState): void {
  pageTitle(ctx, 'DOOR/OXY');
  text(ctx, 'CKPT OXY', 560, 70, C.white, 20);
  text(ctx, '1850', 690, 100, C.green, 26, 'right', true);
  text(ctx, 'PSI', 700, 100, C.cyan, 18);
  // 機身側視輪廓
  const cx = W / 2;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 70, 150);
  ctx.quadraticCurveTo(cx, 80, cx + 70, 150);
  ctx.lineTo(cx + 70, 560);
  ctx.quadraticCurveTo(cx, 660, cx - 70, 560);
  ctx.closePath();
  ctx.stroke();
  // 艙門：關閉綠色實心；開啟琥珀色外框並標示名稱
  const d = s.doors;
  const door = (x: number, y: number, label: string, left: boolean, open: number): void => {
    if (open > 0.05) {
      ctx.strokeStyle = C.amber;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x - 7, y - 16, 14, 32);
      text(ctx, label, left ? x - 20 : x + 20, y, C.amber, 18, left ? 'right' : 'left');
    } else {
      fillRect(ctx, x - 7, y - 16, 14, 32, C.green);
    }
  };
  door(cx - 70, 180, 'CABIN', true, d.cabinFwdL);
  door(cx + 70, 180, 'CABIN', false, d.cabinFwdR);
  door(cx - 70, 360, 'EMER EXIT', true, 0);
  door(cx + 70, 360, 'EMER EXIT', false, 0);
  door(cx - 70, 520, 'CABIN', true, d.cabinAftL);
  door(cx + 70, 520, 'CABIN', false, d.cabinAftR);
  door(cx + 70, 260, 'CARGO', false, d.cargoFwd);
  door(cx + 70, 460, 'CARGO', false, d.cargoAft);
  door(cx, 137, 'AVIONICS', true, d.avionics);
  text(ctx, 'CAB V/S', 560, 600, C.white, 20);
  text(ctx, String(Math.round(s.press.cabinVs / 50) * 50), 690, 630, C.green, 24, 'right', true);
  text(ctx, 'FT/MIN', 700, 630, C.cyan, 16);
}

function spoilerRow(ctx: Ctx, s: SimState, y: number, numbers: boolean): void {
  const c = s.controls;
  const draw = (x: number, deg: number, n: number): void => {
    const up = deg > 3;
    const col =
      s.hyd.green.pressure > 1450 || s.hyd.yellow.pressure > 1450 || s.hyd.blue.pressure > 1450
        ? C.green
        : C.amber;
    if (up) {
      line(ctx, x, y + 20, x, y - 8, col, 3);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x - 9, y - 4);
      ctx.lineTo(x + 9, y - 4);
      ctx.closePath();
      ctx.fill();
    }
    line(ctx, x - 14, y + 20, x + 14, y + 20, col, 3);
    if (numbers) text(ctx, String(n), x, y + 40, C.white, 18, 'center');
  };
  for (let i = 0; i < 5; i++) {
    draw(90 + i * 48, c.spoilersL[4 - i], 5 - i);
    draw(486 + i * 48, c.spoilersR[i], i + 1);
  }
}

function drawWheel(ctx: Ctx, s: SimState): void {
  const g = s.gear;
  pageTitle(ctx, 'WHEEL');
  spoilerRow(ctx, s, 90, false);
  // 起落架指示（LGCIU 1 / 2 兩組三角）
  const gearInd = (x: number, y: number, i: number): void => {
    const down = g.downLocked[i];
    const up = g.upLocked[i];
    const col = down ? C.green : up ? null : C.red;
    for (const dx of [-24, 24]) {
      if (col === null) {
        line(ctx, x + dx - 14, y, x + dx + 14, y, C.dim, 3);
        continue;
      }
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x + dx, y + 18);
      ctx.lineTo(x + dx - 16, y - 12);
      ctx.lineTo(x + dx + 16, y - 12);
      ctx.closePath();
      ctx.fill();
    }
    if (g.doors[i] > 0.1)
      text(ctx, 'DOOR', x, y - 34, g.doors[i] > 0.9 ? C.green : C.amber, 16, 'center');
  };
  gearInd(384, 220, 0);
  gearInd(160, 330, 1);
  gearInd(608, 330, 2);
  text(ctx, 'LDG GEAR', 384, 290, C.white, 18, 'center');
  // 剎車
  const brake = (x: number, t: number, press: number, n1: number, n2: number): void => {
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, 470, 70, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    const hot = t > 300;
    text(
      ctx,
      String(Math.round(t / 5) * 5),
      x - 34,
      470,
      hot ? C.amber : C.green,
      24,
      'center',
      true,
    );
    text(
      ctx,
      String(Math.round(t / 5) * 5),
      x + 34,
      470,
      hot ? C.amber : C.green,
      24,
      'center',
      true,
    );
    text(ctx, String(n1), x - 34, 510, C.white, 20, 'center');
    text(ctx, String(n2), x + 34, 510, C.white, 20, 'center');
    if (press > 0.1 && s.flight.onGround && s.flight.gs > 5)
      text(ctx, 'REL', x, 426, C.green, 20, 'center');
  };
  brake(160, g.brakeTemp[0], g.brakePressL, 1, 2);
  brake(608, g.brakeTemp[1], g.brakePressR, 3, 4);
  text(ctx, '°C', 384, 470, C.cyan, 20, 'center');
  if (g.autobrake !== 'OFF') {
    text(ctx, 'AUTO BRK', 384, 570, C.green, 22, 'center');
    text(ctx, g.autobrake, 384, 598, C.green, 22, 'center', true);
  }
  if (!g.antiSkid) text(ctx, 'ANTI SKID', 160, 630, C.amber, 22, 'center');
  if (s.hyd.yellow.pressure < 1450 || !g.antiSkid)
    text(ctx, 'N/W STEERING', 590, 630, C.amber, 22, 'center');
  if (g.parkingBrake) text(ctx, 'PARK BRK', 384, 650, C.amber, 20, 'center');
}

function hydLetters(ctx: Ctx, s: SimState, x: number, y: number, sys: string): void {
  let dx = x - ((sys.length - 1) * 22) / 2;
  for (const ch of sys) {
    const p =
      ch === 'G' ? s.hyd.green.pressure : ch === 'B' ? s.hyd.blue.pressure : s.hyd.yellow.pressure;
    text(ctx, ch, dx, y, p > 1450 ? C.green : C.amber, 20, 'center', true);
    dx += 22;
  }
}

function vScale(ctx: Ctx, x: number, top: number, bot: number, frac: number, color: string): void {
  line(ctx, x, top, x, bot, C.white, 2);
  for (let i = 0; i <= 4; i++) {
    const y = top + ((bot - top) * i) / 4;
    line(ctx, x - 6, y, x + 6, y, C.white, 2);
  }
  const y = top + (bot - top) * clamp(frac, 0, 1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + 22, y - 9);
  ctx.lineTo(x + 22, y + 9);
  ctx.closePath();
  ctx.fill();
}

function drawFctl(ctx: Ctx, s: SimState): void {
  const c = s.controls;
  pageTitle(ctx, 'F/CTL');
  spoilerRow(ctx, s, 90, true);
  text(ctx, 'SPD BRK', 384, 70, C.white, 18, 'center');
  const col = s.hyd.green.pressure > 1450 || s.hyd.blue.pressure > 1450 ? C.green : C.amber;
  // 副翼（±25°，後緣下為正 → 指標下移）
  text(ctx, 'L AIL', 90, 170, C.white, 20, 'center');
  vScale(ctx, 90, 200, 380, (c.aileronL + 25) / 50, col);
  hydLetters(ctx, s, 90, 406, 'BG');
  text(ctx, 'R AIL', 678, 170, C.white, 20, 'center');
  vScale(ctx, 678, 200, 380, (c.aileronR + 25) / 50, col);
  hydLetters(ctx, s, 678, 406, 'GB');
  // 升降舵（-30 上 .. +17 下）
  text(ctx, 'L ELEV', 190, 440, C.white, 20, 'center');
  vScale(ctx, 190, 470, 640, (c.elevator + 30) / 47, col);
  hydLetters(ctx, s, 190, 666, 'BG');
  text(ctx, 'R ELEV', 578, 440, C.white, 20, 'center');
  vScale(ctx, 578, 470, 640, (c.elevator + 30) / 47, col);
  hydLetters(ctx, s, 578, 666, 'YB');
  // ELAC / SEC
  const dc = s.elec.dcEss || s.elec.dcBus1;
  const comp = (x: number, y: number, lbl: string, n: number): void => {
    rect(ctx, x, y, 44, 36, dc ? C.green : C.amber, 2);
    text(ctx, String(n), x + 22, y + 18, dc ? C.green : C.amber, 22, 'center', true);
    if (n === 1) text(ctx, lbl, x - 8, y + 18, C.white, 18, 'right');
  };
  comp(300, 220, 'ELAC', 1);
  comp(350, 220, 'ELAC', 2);
  comp(300, 280, 'SEC', 1);
  comp(350, 280, 'SEC', 2);
  comp(400, 280, 'SEC', 3);
  // 配平
  text(ctx, 'PITCH TRIM', 384, 360, C.white, 20, 'center');
  text(ctx, Math.abs(c.ths).toFixed(1), 380, 392, C.green, 24, 'right', true);
  text(ctx, `° ${c.ths >= 0 ? 'UP' : 'DN'}`, 386, 392, C.cyan, 20);
  hydLetters(ctx, s, 384, 420, 'GY');
  // 方向舵
  const rx = 384;
  const ry = 520;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(rx, ry - 60, 110, Math.PI * 0.32, Math.PI * 0.68);
  ctx.stroke();
  const ra = Math.PI / 2 - (c.rudder / 25) * Math.PI * 0.18;
  line(ctx, rx, ry - 60, rx + Math.cos(ra) * 118, ry - 60 + Math.sin(ra) * 118, col, 4);
  const ta = Math.PI / 2 - (c.rudderTrim / 25) * Math.PI * 0.18;
  ctx.setLineDash([4, 4]);
  line(
    ctx,
    rx + Math.cos(ta) * 100,
    ry - 60 + Math.sin(ta) * 100,
    rx + Math.cos(ta) * 130,
    ry - 60 + Math.sin(ta) * 130,
    C.cyan,
    3,
  );
  ctx.setLineDash([]);
  text(ctx, 'RUD', rx, ry + 90, C.white, 20, 'center');
  hydLetters(ctx, s, rx, ry + 118, 'GBY');
}

function drawSts(ctx: Ctx, s: SimState): void {
  pageTitle(ctx, 'STATUS');
  const inop: string[] = [];
  const fl = s.failures;
  if (fl.eng1Fail) inop.push('ENG 1');
  if (fl.eng2Fail) inop.push('ENG 2');
  if (fl.gen1Fail) inop.push('GEN 1');
  if (fl.hydGreenLeak) inop.push('G HYD');
  if (fl.apuFail) inop.push('APU');
  for (const m of s.warnings.messages) {
    if (s.warnings.cleared.includes(m.id) && m.level !== 'MEMO') inop.push(m.title);
  }
  if (inop.length === 0 && s.warnings.messages.length === 0) {
    text(ctx, 'NORMAL', W / 2, 340, C.green, 30, 'center', true);
    return;
  }
  text(ctx, 'INOP SYS', 470, 90, C.white, 22);
  line(ctx, 470, 104, 580, 104, C.white, 2);
  inop.slice(0, 14).forEach((t, i) => text(ctx, t, 470, 132 + i * 30, C.amber, 22));
  if (fl.hydGreenLeak) {
    text(ctx, 'LDG DIST PROC....APPLY', 20, 100, C.cyan, 20);
    text(ctx, 'SLATS SLOW', 20, 130, C.cyan, 20);
  }
  if (fl.eng1Fail || fl.eng2Fail) text(ctx, 'APPR PROC: ONE ENG', 20, 170, C.cyan, 20);
}

function drawCruise(ctx: Ctx, s: SimState): void {
  pageTitle(ctx, 'CRUISE');
  text(ctx, 'ENG', 30, 80, C.white, 24, 'left', true);
  const xs = [220, 548];
  text(ctx, 'F.USED', W / 2, 120, C.white, 20, 'center');
  text(ctx, 'OIL', W / 2, 160, C.white, 20, 'center');
  text(ctx, 'VIB N1', W / 2, 200, C.white, 20, 'center');
  text(ctx, 'N2', W / 2, 232, C.white, 20, 'center');
  s.engines.forEach((e, i) => {
    text(
      ctx,
      String(Math.round((i === 0 ? s.fuel.used1 : s.fuel.used2) / 10) * 10),
      xs[i],
      120,
      C.green,
      24,
      'center',
      true,
    );
    text(ctx, String(Math.round(e.oilPress)), xs[i], 160, C.green, 24, 'center', true);
    text(ctx, vib(e.n1).toFixed(1), xs[i], 200, C.green, 24, 'center', true);
    text(ctx, vib(e.n2).toFixed(1), xs[i], 232, C.green, 24, 'center', true);
  });
  line(ctx, 20, 270, W - 20, 270, C.dim, 2);
  text(ctx, 'AIR', 30, 300, C.white, 24, 'left', true);
  const p = s.press;
  text(ctx, 'LDG ELEV', 60, 350, C.white, 20);
  text(ctx, p.modeMan ? 'MAN' : 'AUTO', 210, 350, C.green, 20);
  text(ctx, String(Math.round(p.landingElev)), 330, 350, C.green, 22, 'right', true);
  text(ctx, 'FT', 338, 350, C.cyan, 18);
  text(ctx, 'ΔP', 440, 350, C.white, 20);
  text(ctx, p.deltaP.toFixed(1), 580, 350, C.green, 22, 'right', true);
  text(ctx, 'PSI', 588, 350, C.cyan, 18);
  text(ctx, 'CAB V/S', 440, 400, C.white, 20);
  text(ctx, String(Math.round(p.cabinVs / 50) * 50), 640, 400, C.green, 22, 'right', true);
  text(ctx, 'FT/MIN', 648, 400, C.cyan, 16);
  text(ctx, 'CAB ALT', 440, 450, C.white, 20);
  text(ctx, String(Math.round(p.cabinAlt / 50) * 50), 640, 450, C.green, 22, 'right', true);
  text(ctx, 'FT', 648, 450, C.cyan, 16);
  const t = s.pneu.cabinTemp;
  text(ctx, 'CKPT', 80, 560, C.white, 20, 'center');
  text(ctx, 'FWD', 200, 560, C.white, 20, 'center');
  text(ctx, 'AFT', 320, 560, C.white, 20, 'center');
  text(ctx, (t - 0.5).toFixed(0), 80, 596, C.green, 24, 'center', true);
  text(ctx, t.toFixed(0), 200, 596, C.green, 24, 'center', true);
  text(ctx, (t + 0.6).toFixed(0), 320, 596, C.green, 24, 'center', true);
  text(ctx, '°C', 380, 596, C.cyan, 18);
}
