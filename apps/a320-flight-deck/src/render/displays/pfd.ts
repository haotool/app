/**
 * PFD：姿態、速度帶、高度帶、V/S、航向帶、FMA、FD、ILS、無線電高度。全部由 SimState 推導。
 */
import type { SimState } from '../../sim/types';
import { C, type Ctx, angDiff, clamp, fillRect, line, rect, text, wrap360 } from './common';

const W = 768;
const CX = 348;
const CY = 380;
const PPD = 9; // pitch px/deg
const SPD_X = 56;
const SPD_W = 96;
const TAPE_TOP = 160;
const TAPE_BOT = 600;
const PPK = 5.2; // px/kt
const ALT_X = 556;
const ALT_W = 84;
const PPF = 0.4; // px/ft
const DEG = Math.PI / 180;

export function pfdAltitude(s: SimState, side: 0 | 1): number {
  const ef = s.efis[side];
  return ef.baroStd
    ? s.flight.pressureAltitude
    : s.flight.pressureAltitude + (ef.qnh - 1013.25) * 27;
}

export function drawPfd(ctx: Ctx, s: SimState, side: 0 | 1): void {
  fillRect(ctx, 0, 0, W, W, C.bg);
  const ir = s.adirs.ir[side];
  const attValid = ir.aligned || ir.attAvail;
  const adrValid = ir.mode !== 'OFF';
  drawAttitude(ctx, s, side, attValid);
  drawSpeedTape(ctx, s, adrValid);
  drawAltTape(ctx, s, side, adrValid);
  drawVs(ctx, s, adrValid);
  drawHeading(ctx, s, side, attValid);
  drawFma(ctx, s, side);
  if (s.efis[side].ls) drawIls(ctx, s);
}

// ---------------------------------------------------------------------------
// 姿態
// ---------------------------------------------------------------------------
function attClip(ctx: Ctx): void {
  ctx.beginPath();
  ctx.roundRect(CX - 150, CY - 215, 300, 430, 40);
  ctx.clip();
}

function drawAttitude(ctx: Ctx, s: SimState, side: 0 | 1, valid: boolean): void {
  const f = s.flight;
  ctx.save();
  attClip(ctx);
  if (!valid) {
    fillRect(ctx, 0, 0, W, W, C.bg);
    ctx.restore();
    text(ctx, 'ATT', CX, CY, C.red, 44, 'center', true);
    return;
  }
  ctx.translate(CX, CY);
  ctx.rotate(-f.roll * DEG);
  const horizon = f.pitch * PPD;
  fillRect(ctx, -600, -900 + horizon, 1200, 900, C.sky);
  fillRect(ctx, -600, horizon, 1200, 900, C.ground);
  line(ctx, -600, horizon, 600, horizon, C.white, 2.5);
  // Pitch ladder（每 2.5°）
  for (let p = -80; p <= 80; p += 2.5) {
    if (p === 0) continue;
    const y = horizon - p * PPD;
    if (y < -230 || y > 230) continue;
    const major = p % 10 === 0;
    const half = major ? 56 : p % 5 === 0 ? 32 : 14;
    line(ctx, -half, y, half, y, C.white, 2);
    if (major) {
      const lbl = String(Math.abs(p));
      text(ctx, lbl, -half - 22, y, C.white, 20, 'center');
      text(ctx, lbl, half + 22, y, C.white, 20, 'center');
    }
  }
  // 俯仰限制「=」（+30 / -15）
  for (const lim of [30, -15]) {
    const y = horizon - lim * PPD;
    for (const sx of [-1, 1]) {
      line(ctx, sx * 70, y - 4, sx * 84, y - 4, C.green, 3);
      line(ctx, sx * 70, y + 4, sx * 84, y + 4, C.green, 3);
    }
  }
  // 航向標記沿地平線
  for (let d = -40; d <= 40; d += 10) {
    const hdg = Math.round((f.heading + d) / 10) * 10;
    const x = angDiff(hdg, f.heading) * PPD;
    line(ctx, x, horizon, x, horizon + 10, C.white, 2);
  }
  ctx.restore();

  // 坡度刻度（固定）與移動滾轉指標
  ctx.save();
  ctx.translate(CX, CY);
  const R = 188;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, R, (-90 - 45) * DEG, (-90 + 45) * DEG);
  ctx.stroke();
  for (const b of [-45, -30, -20, -10, 10, 20, 30, 45]) {
    const a = (-90 + b) * DEG;
    const len = Math.abs(b) === 30 || Math.abs(b) === 45 ? 18 : 11;
    line(
      ctx,
      Math.cos(a) * R,
      Math.sin(a) * R,
      Math.cos(a) * (R + len),
      Math.sin(a) * (R + len),
      C.white,
      2.5,
    );
  }
  // 零位白三角
  ctx.fillStyle = C.yellow;
  ctx.beginPath();
  ctx.moveTo(0, -R + 1);
  ctx.lineTo(-11, -R - 16);
  ctx.lineTo(11, -R - 16);
  ctx.closePath();
  ctx.fill();
  // 坡度保護「=」：高速保護時 40°，否則 67°
  const protAngle = s.controls.protActive.speed ? 40 : 67;
  for (const sgn of [-1, 1]) {
    const a = (-90 + sgn * protAngle) * DEG;
    for (const off of [-3.5, 3.5]) {
      const ox = -Math.sin(a) * off;
      const oy = Math.cos(a) * off;
      line(
        ctx,
        Math.cos(a) * (R - 4) + ox,
        Math.sin(a) * (R - 4) + oy,
        Math.cos(a) * (R + 12) + ox,
        Math.sin(a) * (R + 12) + oy,
        C.green,
        2.5,
      );
    }
  }
  ctx.rotate(-s.flight.roll * DEG);
  const bankAmber = Math.abs(s.flight.roll) > 45;
  ctx.strokeStyle = bankAmber ? C.amber : C.yellow;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -R + 2);
  ctx.lineTo(-11, -R + 19);
  ctx.lineTo(11, -R + 19);
  ctx.closePath();
  ctx.stroke();
  const slip = clamp(s.flight.beta * 4, -30, 30);
  ctx.beginPath();
  ctx.moveTo(slip - 13, -R + 23);
  ctx.lineTo(slip + 13, -R + 23);
  ctx.lineTo(slip + 16, -R + 31);
  ctx.lineTo(slip - 16, -R + 31);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  drawFlightDirector(ctx, s, side);

  // 飛機符號
  ctx.fillStyle = C.bg;
  ctx.strokeStyle = C.yellow;
  ctx.lineWidth = 3;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(CX + sx * 128, CY - 5);
    ctx.lineTo(CX + sx * 70, CY - 5);
    ctx.lineTo(CX + sx * 70, CY + 22);
    ctx.lineTo(CX + sx * 60, CY + 22);
    ctx.lineTo(CX + sx * 60, CY + 5);
    ctx.lineTo(CX + sx * 128, CY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillRect(CX - 7, CY - 7, 14, 14);
  ctx.strokeRect(CX - 7, CY - 7, 14, 14);

  // 地面側桿位置指示
  if (s.flight.onGround) {
    const k = 62;
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      line(ctx, CX + sx * k, CY + sy * k, CX + sx * (k - 14), CY + sy * k, C.white, 2);
      line(ctx, CX + sx * k, CY + sy * k, CX + sx * k, CY + sy * (k - 14), C.white, 2);
    }
    const px = CX + s.input.roll * k;
    const py = CY - s.input.pitch * k;
    line(ctx, px - 9, py, px + 9, py, C.white, 3);
    line(ctx, px, py - 9, px, py + 9, C.white, 3);
  }

  // 無線電高度
  const ra = s.flight.radioAltitude;
  if (ra < 2500) {
    const v =
      ra < 10 ? Math.round(ra) : ra < 50 ? Math.round(ra / 5) * 5 : Math.round(ra / 10) * 10;
    text(
      ctx,
      String(v),
      CX,
      CY + 172,
      !s.flight.onGround && ra < 100 ? C.amber : C.green,
      30,
      'center',
      true,
    );
  }
}

function drawFlightDirector(ctx: Ctx, s: SimState, side: 0 | 1): void {
  const a = s.afs;
  const fdOn = s.efis[side].fd && (side === 0 ? a.fd1 : a.fd2);
  const active = a.lateral !== null || a.vertical !== null;
  if (!fdOn || !active) return;
  const f = s.flight;
  if (s.fcu.trkFpa) {
    // FPV（bird）與 FPD
    const bx = clamp(angDiff(f.track, f.heading) * PPD, -120, 120);
    const by = clamp(-(f.fpa - f.pitch) * PPD, -160, 160);
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(-f.roll * DEG);
    ctx.translate(bx, by);
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.moveTo(-10, 0);
    ctx.lineTo(-34, 0);
    ctx.moveTo(10, 0);
    ctx.lineTo(34, 0);
    ctx.moveTo(0, -10);
    ctx.lineTo(0, -22);
    ctx.stroke();
    ctx.rotate((f.roll - a.fdRoll) * DEG * 0.6);
    const dy = clamp(-(a.fdPitch - f.fpa) * PPD, -120, 120);
    ctx.beginPath();
    ctx.arc(0, dy, 6, 0, Math.PI * 2);
    ctx.moveTo(-28, dy);
    ctx.lineTo(-8, dy);
    ctx.moveTo(8, dy);
    ctx.lineTo(28, dy);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const dy = clamp(-(a.fdPitch - f.pitch) * PPD, -130, 130);
  const dx = clamp((a.fdRoll - f.roll) * 2.4, -120, 120);
  if (a.vertical !== null) line(ctx, CX - 110, CY + dy, CX + 110, CY + dy, C.green, 4);
  if (a.lateral !== null && !f.onGround)
    line(ctx, CX + dx, CY - 110, CX + dx, CY + 110, C.green, 4);
  if (f.onGround && (a.lateral === 'RWY' || a.lateral === 'ROLL OUT')) {
    const yx = CX + clamp(a.fdYaw * 6, -90, 90);
    line(ctx, yx, CY + 120, yx, CY + 150, C.green, 5);
  }
}

// ---------------------------------------------------------------------------
// 速度帶
// ---------------------------------------------------------------------------
function barber(ctx: Ctx, x: number, y0: number, y1: number, c1: string, c2: string): void {
  const top = Math.max(TAPE_TOP, Math.min(y0, y1));
  const bot = Math.min(TAPE_BOT, Math.max(y0, y1));
  for (let y = top, i = 0; y < bot; y += 8, i++)
    fillRect(ctx, x, y, 8, Math.min(8, bot - y), i % 2 === 0 ? c1 : c2);
}

function drawSpeedTape(ctx: Ctx, s: SimState, valid: boolean): void {
  const f = s.flight;
  fillRect(ctx, SPD_X, TAPE_TOP, SPD_W, TAPE_BOT - TAPE_TOP, '#2a2f36');
  if (!valid) {
    text(ctx, 'SPD', SPD_X + SPD_W / 2, CY, C.red, 34, 'center', true);
    return;
  }
  const ias = Math.max(30, f.ias);
  const y = (v: number): number => CY - (v - ias) * PPK;
  const right = SPD_X + SPD_W;
  ctx.save();
  ctx.beginPath();
  ctx.rect(SPD_X, TAPE_TOP, SPD_W + 40, TAPE_BOT - TAPE_TOP);
  ctx.clip();
  const lo = Math.floor((ias - 45) / 10) * 10;
  for (let v = Math.max(30, lo); v <= ias + 45; v += 10) {
    const yy = y(v);
    line(ctx, right - 14, yy, right, yy, C.white, 2);
    if (v % 20 === 0) text(ctx, String(v).padStart(3, '0'), right - 20, yy, C.white, 24, 'right');
  }
  if (!f.onGround) {
    if (f.vls > 0 && f.vaprot > 0)
      fillRect(ctx, right - 4, y(f.vls), 4, y(f.vaprot) - y(f.vls), C.amber);
    if (f.vaprot > 0 && f.vamax > 0) barber(ctx, right - 4, y(f.vaprot), y(f.vamax), C.amber, C.bg);
    if (f.vamax > 0) fillRect(ctx, right - 4, y(f.vamax), 8, TAPE_BOT - y(f.vamax), C.red);
  }
  if (f.vmax > 0) {
    barber(ctx, right - 4, y(f.vmax), TAPE_TOP, C.red, C.bg);
    const yo = y(f.vmax + 6);
    line(ctx, right + 2, yo - 3, right + 14, yo - 3, C.green, 2.5);
    line(ctx, right + 2, yo + 3, right + 14, yo + 3, C.green, 2.5);
  }
  // 起飛速度
  const a = s.afs;
  if (f.onGround || a.phase === 'TAKEOFF') {
    text(ctx, '1', right + 12, y(a.v1), C.cyan, 24, 'left', true);
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(right + 14, y(a.vr), 6, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const h = s.controls.flapHandle;
    if (h === 0 && f.greenDot > 0) {
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(right + 10, y(f.greenDot), 6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (h === 1 && f.sSpeed > 0) {
      text(ctx, 'S', right + 12, y(f.sSpeed), C.green, 24, 'left', true);
    } else if ((h === 2 || h === 3) && f.fSpeed > 0) {
      text(ctx, 'F', right + 12, y(f.fSpeed), C.green, 24, 'left', true);
    }
  }
  ctx.restore();

  // 目標速度三角
  const machRatio = f.mach > 0.05 ? f.ias / f.mach : 600;
  const tgt = s.fcu.spdManaged
    ? a.targetSpeed
    : s.fcu.spdMach === 'MACH'
      ? s.fcu.mach * machRatio
      : s.fcu.spd;
  const tcol = s.fcu.spdManaged ? C.magenta : C.cyan;
  const ty = y(tgt);
  if (ty < TAPE_TOP)
    text(ctx, String(Math.round(tgt)), SPD_X + SPD_W / 2, TAPE_TOP - 16, tcol, 24, 'center');
  else if (ty > TAPE_BOT)
    text(ctx, String(Math.round(tgt)), SPD_X + SPD_W / 2, TAPE_BOT + 16, tcol, 24, 'center');
  else {
    ctx.fillStyle = tcol;
    ctx.beginPath();
    ctx.moveTo(right, ty);
    ctx.lineTo(right + 16, ty - 10);
    ctx.lineTo(right + 16, ty + 10);
    ctx.closePath();
    ctx.fill();
  }
  // 趨勢箭頭
  if (Math.abs(f.speedTrend) > 2) {
    const ey = clamp(CY - f.speedTrend * PPK, TAPE_TOP, TAPE_BOT);
    const sx = right + 4;
    line(ctx, sx, CY, sx, ey, C.yellow, 3);
    const d = ey < CY ? 1 : -1;
    line(ctx, sx - 7, ey + d * 10, sx, ey, C.yellow, 3);
    line(ctx, sx + 7, ey + d * 10, sx, ey, C.yellow, 3);
  }
  // 參考線
  line(ctx, SPD_X - 6, CY, right - 2, CY, C.yellow, 4);
  ctx.fillStyle = C.yellow;
  ctx.beginPath();
  ctx.moveTo(right - 2, CY);
  ctx.lineTo(right + 14, CY - 9);
  ctx.lineTo(right + 14, CY + 9);
  ctx.closePath();
  ctx.fill();
  if (f.mach > 0.5)
    text(
      ctx,
      '.' +
        String(Math.round(f.mach * 1000))
          .padStart(3, '0')
          .slice(0, 2),
      SPD_X + SPD_W / 2,
      630,
      C.green,
      28,
      'center',
    );
}

// ---------------------------------------------------------------------------
// 高度帶 + BARO
// ---------------------------------------------------------------------------
function drawAltTape(ctx: Ctx, s: SimState, side: 0 | 1, valid: boolean): void {
  const f = s.flight;
  fillRect(ctx, ALT_X, TAPE_TOP, ALT_W, TAPE_BOT - TAPE_TOP, '#2a2f36');
  const ef = s.efis[side];
  if (!valid) {
    text(ctx, 'ALT', ALT_X + ALT_W / 2, CY, C.red, 34, 'center', true);
  } else {
    const alt = pfdAltitude(s, side);
    const y = (v: number): number => CY - (v - alt) * PPF;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ALT_X - 30, TAPE_TOP, ALT_W + 40, TAPE_BOT - TAPE_TOP);
    ctx.clip();
    for (let v = Math.floor((alt - 600) / 100) * 100; v <= alt + 600; v += 100) {
      const yy = y(v);
      line(ctx, ALT_X, yy, ALT_X + 12, yy, C.white, 2);
      if (v % 500 === 0)
        text(ctx, String(Math.round(v / 100)).padStart(3, '0'), ALT_X + 18, yy, C.white, 22);
    }
    // 地面參考紅帶
    if (f.radioAltitude < 570) {
      const gy = y(alt - f.radioAltitude);
      fillRect(ctx, ALT_X + ALT_W - 8, gy, 8, TAPE_BOT - gy, C.red);
    }
    // 選定高度
    const managed =
      (s.afs.vertical === 'CLB' ||
        s.afs.vertical === 'DES' ||
        s.afs.vertical === 'ALT CST' ||
        s.afs.vertical === 'ALT CST*') &&
      s.afs.targetAltitude !== s.fcu.alt;
    const sel = managed ? s.afs.targetAltitude : s.fcu.alt;
    const scol = managed ? C.magenta : C.cyan;
    const sy = y(sel);
    ctx.restore();
    if (sy < TAPE_TOP)
      text(
        ctx,
        sel >= 10000 && ef.baroStd ? 'FL' + String(Math.round(sel / 100)) : String(Math.round(sel)),
        ALT_X + ALT_W / 2,
        TAPE_TOP - 16,
        scol,
        24,
        'center',
      );
    else if (sy > TAPE_BOT)
      text(
        ctx,
        sel >= 10000 && ef.baroStd ? 'FL' + String(Math.round(sel / 100)) : String(Math.round(sel)),
        ALT_X + ALT_W / 2,
        TAPE_BOT + 16,
        scol,
        24,
        'center',
      );
    else {
      rect(ctx, ALT_X - 4, sy - 26, ALT_W + 8, 52, scol, 2.5);
      text(ctx, String(Math.round(sel)), ALT_X + ALT_W / 2, sy - 14, scol, 18, 'center');
    }
    // 數字窗（百位 + 滾筒）
    const neg = alt < 0;
    const a = Math.abs(alt);
    const hundreds = Math.floor(a / 100);
    fillRect(ctx, ALT_X - 8, CY - 26, 70, 52, C.bg);
    text(
      ctx,
      (neg ? '-' : '') + String(hundreds).padStart(3, '0'),
      ALT_X + 56,
      CY,
      C.green,
      32,
      'right',
      true,
    );
    ctx.save();
    ctx.beginPath();
    ctx.rect(ALT_X + 62, CY - 44, 58, 88);
    ctx.clip();
    fillRect(ctx, ALT_X + 62, CY - 44, 58, 88, C.bg);
    const tens = a % 100;
    const base = Math.floor(tens / 20) * 20;
    const frac = (tens - base) / 20;
    for (let k = -2; k <= 3; k++) {
      const v = (((base + k * 20) % 100) + 100) % 100;
      text(
        ctx,
        String(v).padStart(2, '0'),
        ALT_X + 90,
        CY + (frac - k) * 32,
        C.green,
        26,
        'center',
        true,
      );
    }
    ctx.restore();
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ALT_X - 8, CY - 26);
    ctx.lineTo(ALT_X + 62, CY - 26);
    ctx.lineTo(ALT_X + 62, CY - 44);
    ctx.lineTo(ALT_X + 120, CY - 44);
    ctx.lineTo(ALT_X + 120, CY + 44);
    ctx.lineTo(ALT_X + 62, CY + 44);
    ctx.lineTo(ALT_X + 62, CY + 26);
    ctx.lineTo(ALT_X - 8, CY + 26);
    ctx.closePath();
    ctx.stroke();
    line(ctx, ALT_X - 22, CY, ALT_X - 8, CY, C.yellow, 4);
    if (s.fcu.metric) {
      fillRect(ctx, ALT_X - 10, TAPE_TOP - 64, 130, 30, C.bg);
      text(
        ctx,
        String(Math.round((alt * 0.3048) / 10) * 10) + ' M',
        ALT_X + 110,
        TAPE_TOP - 49,
        C.green,
        22,
        'right',
      );
    }
  }
  // BARO
  if (ef.baroStd) {
    rect(ctx, ALT_X + 4, 634, 76, 34, C.yellow, 2);
    text(ctx, 'STD', ALT_X + 42, 651, C.cyan, 26, 'center', true);
  } else {
    text(ctx, 'QNH', ALT_X - 14, 651, C.white, 20);
    const v = ef.baroUnit === 'hPa' ? String(Math.round(ef.qnh)) : (ef.qnh * 0.02953).toFixed(2);
    text(ctx, v, ALT_X + 106, 651, C.cyan, 26, 'right', true);
  }
}

// ---------------------------------------------------------------------------
// V/S
// ---------------------------------------------------------------------------
function vsOffset(vs: number): number {
  const a = Math.min(Math.abs(vs), 6200);
  const o = a <= 1000 ? a * 0.08 : a <= 2000 ? 80 + (a - 1000) * 0.06 : 140 + (a - 2000) * 0.0125;
  return Math.sign(vs) * o;
}

function drawVs(ctx: Ctx, s: SimState, valid: boolean): void {
  const x0 = 682;
  ctx.fillStyle = '#2a2f36';
  ctx.beginPath();
  ctx.moveTo(x0, CY - 210);
  ctx.lineTo(x0 + 34, CY - 210);
  ctx.lineTo(x0 + 58, CY - 80);
  ctx.lineTo(x0 + 58, CY + 80);
  ctx.lineTo(x0 + 34, CY + 210);
  ctx.lineTo(x0, CY + 210);
  ctx.closePath();
  ctx.fill();
  if (!valid) {
    text(ctx, 'V/S', x0 + 28, CY, C.red, 22, 'center', true);
    return;
  }
  for (const v of [-6000, -2000, -1500, -1000, -500, 500, 1000, 1500, 2000, 6000]) {
    const yy = CY - vsOffset(v);
    const major = Math.abs(v) === 1000 || Math.abs(v) === 2000 || Math.abs(v) === 6000;
    line(ctx, x0, yy, x0 + (major ? 14 : 8), yy, C.white, 2);
    if (major) text(ctx, String(Math.abs(v) / 1000), x0 - 4, yy, C.white, 18, 'right');
  }
  line(ctx, x0, CY, x0 + 16, CY, C.yellow, 4);
  const vs = s.flight.vs;
  const amber =
    Math.abs(vs) > 6000 ||
    (vs < -2000 && s.flight.radioAltitude < 2500) ||
    (vs < -1200 && s.flight.radioAltitude < 1000 && !s.flight.onGround);
  const col = amber ? C.amber : C.green;
  const tipY = CY - vsOffset(vs);
  line(ctx, x0 + 58 + 40, CY, x0 + 4, tipY, col, 4);
  if (Math.abs(vs) >= 200) {
    const v = Math.round(Math.abs(vs) / 100);
    const by = tipY + (vs > 0 ? -22 : 22);
    fillRect(ctx, x0 + 6, by - 13, 44, 26, C.bg);
    text(ctx, String(v).padStart(2, '0'), x0 + 28, by, col, 22, 'center', true);
  }
}

// ---------------------------------------------------------------------------
// 航向帶
// ---------------------------------------------------------------------------
function drawHeading(ctx: Ctx, s: SimState, side: 0 | 1, valid: boolean): void {
  const y0 = 664;
  const h = 48;
  fillRect(ctx, CX - 160, y0, 320, h, '#2a2f36');
  if (!valid) {
    text(ctx, 'HDG', CX, y0 + h / 2, C.red, 30, 'center', true);
    return;
  }
  const hdg = s.flight.heading;
  const px = 7.2;
  const x = (d: number): number => CX + angDiff(d, hdg) * px;
  ctx.save();
  ctx.beginPath();
  ctx.rect(CX - 160, y0 - 30, 320, h + 60);
  ctx.clip();
  for (let d = Math.floor((hdg - 25) / 5) * 5; d <= hdg + 25; d += 5) {
    const xx = x(d);
    const w = wrap360(d);
    const major = w % 10 === 0;
    line(ctx, xx, y0, xx, y0 + (major ? 14 : 8), C.white, 2);
    if (major)
      text(
        ctx,
        String(Math.round(w / 10) % 36),
        xx,
        y0 + 30,
        C.white,
        w % 30 === 0 ? 24 : 18,
        'center',
      );
  }
  // 航跡菱形
  const tx = x(s.flight.track);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tx, y0 + 2);
  ctx.lineTo(tx + 8, y0 + 12);
  ctx.lineTo(tx, y0 + 22);
  ctx.lineTo(tx - 8, y0 + 12);
  ctx.closePath();
  ctx.stroke();
  if (s.efis[side].ls && s.ils.tuned) {
    const cx = x(s.ils.course);
    line(ctx, cx, y0 - 20, cx, y0 + 6, C.magenta, 3);
  }
  ctx.restore();
  // 選定航向
  if (!s.fcu.hdgManaged || s.fcu.hdgPreset) {
    const d = angDiff(s.fcu.hdg, hdg);
    if (Math.abs(d) <= 22) {
      const sx = CX + d * px;
      ctx.fillStyle = C.cyan;
      ctx.beginPath();
      ctx.moveTo(sx, y0);
      ctx.lineTo(sx - 9, y0 - 16);
      ctx.lineTo(sx + 9, y0 - 16);
      ctx.closePath();
      ctx.fill();
    } else {
      text(
        ctx,
        String(Math.round(wrap360(s.fcu.hdg))).padStart(3, '0'),
        d < 0 ? CX - 150 : CX + 150,
        y0 - 16,
        C.cyan,
        22,
        d < 0 ? 'left' : 'right',
      );
    }
  }
  line(ctx, CX, y0 - 14, CX, y0 + 20, C.yellow, 4);
}

// ---------------------------------------------------------------------------
// FMA
// ---------------------------------------------------------------------------
const COLS = [0, 150, 312, 470, 596, W];
const ROW = [24, 56, 86];

function fmaText(ctx: Ctx, col: number, row: number, s: string, color: string, span = 1): void {
  const x = (COLS[col] + COLS[col + span]) / 2;
  text(ctx, s, x, ROW[row], color, 25, 'center');
}

function fmaBox(ctx: Ctx, col: number, rows: number, color: string, span = 1): void {
  rect(ctx, COLS[col] + 6, 6, COLS[col + span] - COLS[col] - 12, rows * 32 + 4, color, 2);
}

function drawFma(ctx: Ctx, s: SimState, side: 0 | 1): void {
  const a = s.afs;
  const t = s.meta.time;
  const recent = (k: number): boolean => t - k < 10 && t >= k;
  for (let i = 1; i < 5; i++) line(ctx, COLS[i], 6, COLS[i], 102, C.dim, 2);
  line(ctx, 0, 110, W, 110, C.dim, 1);

  // 欄 1：A/THR
  const m = a.athrMode;
  if (m === 'MAN TOGA' || m === 'MAN FLX' || m === 'MAN THR') {
    fmaText(ctx, 0, 0, 'MAN', C.white);
    fmaText(
      ctx,
      0,
      1,
      m === 'MAN TOGA' ? 'TOGA' : m === 'MAN FLX' ? `FLX ${a.flexTemp ?? ''}` : 'THR',
      C.white,
    );
    fmaBox(ctx, 0, 2, m === 'MAN THR' ? C.amber : C.white);
  } else if (m !== null) {
    fmaText(ctx, 0, 0, m, C.green);
    if (m === 'A.FLOOR' || m === 'TOGA LK') fmaBox(ctx, 0, 1, C.amber);
    else if (recent(a.modeChangeTime.athr)) fmaBox(ctx, 0, 1, C.white);
  }
  const lvrClb =
    (m === 'MAN TOGA' || m === 'MAN FLX') &&
    !s.flight.onGround &&
    s.flight.altitudeMsl > a.thrRedAlt;
  if (lvrClb && Math.floor(t * 2) % 2 === 0) fmaText(ctx, 0, 2, 'LVR CLB', C.white);
  else if (a.athrActive && Math.abs(s.engines[0].tla - s.engines[1].tla) > 3)
    fmaText(ctx, 0, 2, 'LVR ASYM', C.amber);

  // 欄 2–3：垂直/側向
  const v = a.vertical;
  if (v === 'LAND' || v === 'FLARE' || v === 'ROLL OUT') {
    fmaText(ctx, 1, 0, v, C.green, 2);
    if (recent(a.modeChangeTime.vert)) fmaBox(ctx, 1, 1, C.white, 2);
  } else {
    if (v !== null) {
      const vtxt =
        v === 'V/S'
          ? `V/S ${s.fcu.vs >= 0 ? '+' : ''}${Math.round(s.fcu.vs)}`
          : v === 'FPA'
            ? `FPA ${s.fcu.fpa >= 0 ? '+' : ''}${s.fcu.fpa.toFixed(1)}°`
            : v;
      fmaText(ctx, 1, 0, vtxt, C.green);
      if (recent(a.modeChangeTime.vert)) fmaBox(ctx, 1, 1, C.white);
    }
    if (a.lateral !== null) {
      fmaText(ctx, 2, 0, a.lateral, C.green);
      if (recent(a.modeChangeTime.lat)) fmaBox(ctx, 2, 1, C.white);
    }
  }
  if (a.verticalArmed.length > 0) {
    let x = COLS[1] + 12;
    for (const arm of a.verticalArmed) {
      const col = arm === 'ALT' && a.targetAltitude !== s.fcu.alt ? C.magenta : C.cyan;
      text(ctx, arm, x, ROW[1], col, 23);
      x += ctx.measureText(arm).width + 12;
    }
  }
  if (a.lateralArmed !== null) fmaText(ctx, 2, 1, a.lateralArmed, C.cyan);

  // 欄 4：進場能力
  if (a.approachCap !== null) {
    const [c1, c2] =
      a.approachCap === 'CAT3 SINGLE'
        ? ['CAT3', 'SINGLE']
        : a.approachCap === 'CAT3 DUAL'
          ? ['CAT3', 'DUAL']
          : [a.approachCap, ''];
    fmaText(ctx, 3, 0, c1, C.white);
    if (c2) fmaText(ctx, 3, 1, c2, C.white);
    if (recent(a.modeChangeTime.cap)) fmaBox(ctx, 3, c2 ? 2 : 1, C.white);
  }

  // 欄 5：AP / FD / A/THR
  const ap = a.ap1 && a.ap2 ? 'AP1+2' : a.ap1 ? 'AP1' : a.ap2 ? 'AP2' : '';
  if (ap) {
    fmaText(ctx, 4, 0, ap, C.white);
    if (recent(a.modeChangeTime.ap)) fmaBox(ctx, 4, 1, C.white);
  }
  const fd1 = a.fd1 && s.efis[0].fd;
  const fd2 = a.fd2 && s.efis[1].fd;
  if (fd1 || fd2) {
    const own = side === 0 ? [fd1, fd2] : [fd2, fd1];
    fmaText(
      ctx,
      4,
      1,
      `${own[0] ? (side === 0 ? '1' : '2') : '-'}FD${own[1] ? (side === 0 ? '2' : '1') : '-'}`,
      C.white,
    );
  }
  if (a.athrActive) fmaText(ctx, 4, 2, 'A/THR', C.white);
  else if (a.athrArmed) fmaText(ctx, 4, 2, 'A/THR', C.cyan);
}

// ---------------------------------------------------------------------------
// ILS
// ---------------------------------------------------------------------------
function drawIls(ctx: Ctx, s: SimState): void {
  const ils = s.ils;
  if (!ils.tuned) return;
  const dot = 36;
  // LOC（水平，姿態下方）
  const ly = CY + 150;
  for (const k of [-2, -1, 1, 2]) {
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CX + k * dot, ly, 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  line(ctx, CX, ly - 12, CX, ly + 12, C.yellow, 3);
  if (ils.locValid) diamond(ctx, CX + clamp(ils.locDev, -2.2, 2.2) * dot, ly, true);
  // G/S（垂直，姿態右側）
  const gx = CX + 172;
  for (const k of [-2, -1, 1, 2]) {
    ctx.beginPath();
    ctx.arc(gx, CY + k * dot, 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  line(ctx, gx - 12, CY, gx + 12, CY, C.yellow, 3);
  if (ils.gsValid) diamond(ctx, gx, CY - clamp(ils.gsDev, -2.2, 2.2) * dot, false);
  text(ctx, ils.ident, 18, 686, C.magenta, 22);
  text(ctx, ils.freq.toFixed(2), 18, 712, C.magenta, 22);
  if (ils.dme > 0) text(ctx, `${ils.dme.toFixed(1)}NM`, 18, 738, C.magenta, 22);
}

function diamond(ctx: Ctx, x: number, y: number, horiz: boolean): void {
  const a = horiz ? 14 : 9;
  const b = horiz ? 9 : 14;
  ctx.strokeStyle = C.magenta;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - a, y);
  ctx.lineTo(x, y - b);
  ctx.lineTo(x + a, y);
  ctx.lineTo(x, y + b);
  ctx.closePath();
  ctx.stroke();
}
