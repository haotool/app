/**
 * E/WD（上 ECAM）：N1/EGT 圓弧錶、N2、FF、推力限制、FOB、縫翼/襟翼指示、警告與 memo。
 */
import { TLA } from '../../sim/constants';
import type { EngineState, SimState } from '../../sim/types';
import { C, type Ctx, arcGauge, clamp, fillRect, gaugeTick, line, rect, text } from './common';

const W = 768;
const GX = [200, 568];
const N1Y = 176;
const EGTY = 350;

export interface ThrustLimit {
  mode: 'TOGA' | 'FLX' | 'MCT' | 'CLB';
  n1: number;
}

/** 推力限制（FADEC 依高度/溫度的簡化額定表） */
export function thrustLimit(
  s: SimState,
): ThrustLimit & { toga: number; mct: number; clb: number; flx: number } {
  const alt = s.flight.altitudeMsl;
  const oat = s.flight.oat;
  const toga = clamp(93.8 + (alt / 10000) * 3.5 - Math.max(0, oat - 15) * 0.15, 80, 101);
  const mct = toga - 3.2;
  const clb = toga - 5.5 + (alt / 10000) * 1.2;
  const flx =
    s.afs.flexTemp !== null ? Math.max(clb, toga - Math.max(0, s.afs.flexTemp - 15) * 0.14) : mct;
  const tla = Math.max(s.engines[0].tla, s.engines[1].tla);
  let mode: ThrustLimit['mode'];
  if (tla >= TLA.TOGA - 1) mode = 'TOGA';
  else if (s.flight.onGround || s.afs.phase === 'TAKEOFF' || s.afs.athrMode === 'MAN FLX')
    mode = s.afs.flexTemp !== null ? 'FLX' : 'TOGA';
  else if (tla >= TLA.FLX - 1) mode = 'MCT';
  else mode = 'CLB';
  const n1 = mode === 'TOGA' ? toga : mode === 'FLX' ? flx : mode === 'MCT' ? mct : clb;
  return { mode, n1, toga, mct, clb, flx };
}

/** TLA → N1 對應（卡位內線性） */
function tlaToN1(tla: number, lim: ReturnType<typeof thrustLimit>): number {
  const idle = 19.5;
  if (tla <= 0) return idle;
  if (tla <= TLA.CL) return idle + (lim.clb - idle) * (tla / TLA.CL);
  if (tla <= TLA.FLX) return lim.clb + (lim.mct - lim.clb) * ((tla - TLA.CL) / (TLA.FLX - TLA.CL));
  return lim.mct + (lim.toga - lim.mct) * ((tla - TLA.FLX) / (TLA.TOGA - TLA.FLX));
}

function fadecOn(e: EngineState, s: SimState): boolean {
  return (
    (e.master || e.n2 > 5 || e.starterValve || s.mech.engMode === 'IGN/START') &&
    (s.elec.acBus1 || s.elec.acBus2 || s.elec.dcBat)
  );
}

export function drawEwd(ctx: Ctx, s: SimState): void {
  fillRect(ctx, 0, 0, W, W, C.bg);
  const lim = thrustLimit(s);

  // 推力限制
  text(ctx, lim.mode, 560, 28, C.cyan, 24, 'right');
  text(ctx, lim.n1.toFixed(1), 660, 28, C.green, 26, 'right', true);
  text(ctx, '%', 690, 28, C.cyan, 20, 'right');
  if (lim.mode === 'FLX' && s.afs.flexTemp !== null)
    text(ctx, `+${s.afs.flexTemp}°C`, 660, 56, C.green, 22, 'right');
  if (s.afs.alphaFloor) {
    text(ctx, 'A FLOOR', 30, 28, C.green, 24);
    rect(ctx, 20, 12, 130, 32, C.amber, 2);
  }

  for (let i = 0; i < 2; i++) drawEngine(ctx, s, s.engines[i], GX[i], lim);

  text(ctx, 'N1', W / 2, N1Y - 8, C.white, 22, 'center');
  text(ctx, '%', W / 2, N1Y + 18, C.cyan, 20, 'center');
  text(ctx, 'EGT', W / 2, EGTY - 8, C.white, 22, 'center');
  text(ctx, '°C', W / 2, EGTY + 18, C.cyan, 20, 'center');
  text(ctx, 'N2', W / 2, 440, C.white, 22, 'center');
  text(ctx, '%', W / 2 + 36, 440, C.cyan, 18, 'center');
  text(ctx, 'FF', W / 2, 476, C.white, 22, 'center');
  text(ctx, 'KG/H', W / 2 + 56, 476, C.cyan, 16, 'center');

  // FOB
  text(ctx, 'FOB :', 26, 530, C.white, 24);
  text(ctx, String(Math.round(s.fuel.fob / 10) * 10), 230, 530, C.green, 28, 'right', true);
  text(ctx, 'KG', 244, 530, C.cyan, 20);

  drawSlatFlap(ctx, s);

  line(ctx, 8, 584, W - 8, 584, C.white, 2);
  line(ctx, 470, 596, 470, 756, C.white, 2);
  drawMessages(ctx, s);
}

function drawEngine(
  ctx: Ctx,
  s: SimState,
  e: EngineState,
  cx: number,
  lim: ReturnType<typeof thrustLimit>,
): void {
  const on = fadecOn(e, s);
  if (!on) {
    ctx.strokeStyle = C.dim;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, N1Y, 96, (160 * Math.PI) / 180, (380 * Math.PI) / 180);
    ctx.stroke();
    text(ctx, 'XX', cx + 30, N1Y + 34, C.amber, 30, 'center', true);
    text(ctx, 'XX', cx + 20, EGTY + 22, C.amber, 26, 'center', true);
    text(ctx, 'XX', cx, 440, C.amber, 26, 'center', true);
    text(ctx, 'XX', cx, 476, C.amber, 26, 'center', true);
    return;
  }
  // N1
  const f = (v: number): number => v / 110;
  arcGauge(ctx, cx, N1Y, 96, f(e.n1), C.green, 104 / 110);
  for (const v of [0, 50, 100]) gaugeTick(ctx, cx, N1Y, 96, f(v), C.white, 12, 3);
  text(ctx, '5', cx - 62, N1Y + 34, C.white, 18, 'center');
  text(ctx, '10', cx + 60, N1Y - 42, C.white, 18, 'center');
  gaugeTick(ctx, cx, N1Y, 106, f(lim.n1), C.amber, 14, 4);
  // TLA 位置（藍圈）與 A/THR 指令弧
  const tlaN1 = e.tla >= 0 ? tlaToN1(e.tla, lim) : 19.5;
  const a = ((f(tlaN1) * 220 - 200) * Math.PI) / 180;
  ctx.strokeStyle = C.cyan;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx + Math.cos(a) * 110, N1Y + Math.sin(a) * 110, 6, 0, Math.PI * 2);
  ctx.stroke();
  if (s.afs.athrActive && Math.abs(e.n1Cmd - e.n1) > 0.8) {
    const a0 = ((f(e.n1) * 220 - 200) * Math.PI) / 180;
    const a1 = ((f(e.n1Cmd) * 220 - 200) * Math.PI) / 180;
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, N1Y, 88, Math.min(a0, a1), Math.max(a0, a1));
    ctx.stroke();
  }
  fillRect(ctx, cx + 2, N1Y + 16, 90, 38, C.bg);
  rect(ctx, cx + 2, N1Y + 16, 90, 38, C.grey, 1.5);
  text(ctx, e.n1.toFixed(1), cx + 86, N1Y + 36, C.green, 30, 'right', true);
  if (e.reverser > 0.02) {
    const col = e.reverser > 0.98 ? C.green : C.amber;
    fillRect(ctx, cx - 30, N1Y - 60, 60, 30, C.bg);
    rect(ctx, cx - 30, N1Y - 60, 60, 30, col, 2);
    text(ctx, 'REV', cx, N1Y - 45, col, 22, 'center', true);
  }
  if (e.state === 'STARTING' || e.state === 'IDLE') {
    if (e.state === 'IDLE' && s.meta.phase === 'ENGINE_START')
      text(ctx, 'AVAIL', cx - 40, N1Y - 30, C.green, 20, 'center');
  }
  // EGT
  const g = (v: number): number => v / 1100;
  arcGauge(
    ctx,
    cx,
    EGTY,
    60,
    g(e.egt),
    e.egt > 1060 ? C.red : e.egt > 1025 ? C.amber : C.green,
    1060 / 1100,
  );
  gaugeTick(ctx, cx, EGTY, 60, g(1025), C.amber, 10, 3);
  text(
    ctx,
    String(Math.round(e.egt / 5) * 5),
    cx + 62,
    EGTY + 22,
    e.egt > 1060 ? C.red : C.green,
    26,
    'right',
    true,
  );
  // N2 / FF
  const n2col = e.state === 'STARTING' ? C.green : C.green;
  if (e.state === 'STARTING') fillRect(ctx, cx - 48, 426, 96, 28, '#3a3f46');
  text(ctx, e.n2.toFixed(1), cx + 44, 440, n2col, 26, 'right', true);
  text(ctx, String(Math.round(e.ff / 20) * 20), cx + 44, 476, C.green, 26, 'right', true);
  if (e.ignition && e.state === 'STARTING') text(ctx, 'IGN', cx - 76, 440, C.green, 18, 'center');
}

function drawSlatFlap(ctx: Ctx, s: SimState): void {
  const c = s.controls;
  const ox = 588;
  const oy = 508;
  text(ctx, 'S', ox - 92, oy + 30, C.white, 22, 'center');
  text(ctx, 'F', ox + 108, oy + 30, C.white, 22, 'center');
  // 機翼參考
  fillRect(ctx, ox - 22, oy - 8, 48, 14, C.white);
  // 縫翼停點
  const sPt = (deg: number): [number, number] => {
    const t = deg / 27;
    return [ox - 24 - t * 66, oy + t * 30];
  };
  const fPt = (deg: number): [number, number] => {
    const t = deg / 40;
    return [ox + 28 + t * 72, oy + t * 30];
  };
  for (const d of [18, 22, 27]) {
    const [x, y] = sPt(d);
    ctx.fillStyle = C.white;
    ctx.fillRect(x - 3, y - 3, 6, 6);
  }
  for (const d of [10, 15, 20, 40]) {
    const [x, y] = fPt(d);
    ctx.fillStyle = C.white;
    ctx.fillRect(x - 3, y - 3, 6, 6);
  }
  const [sx, sy] = sPt(c.slatsAngle);
  const [fx, fy] = fPt(c.flapsAngle);
  line(ctx, ox - 24, oy, sx, sy, C.green, 5);
  line(ctx, ox + 28, oy, fx, fy, C.green, 5);
  const moving =
    Math.abs(c.slatsAngle - c.slatsTarget) > 0.5 || Math.abs(c.flapsAngle - c.flapsTarget) > 0.5;
  if (c.flapConfig !== '0' || moving)
    text(ctx, c.flapConfig, ox + 4, oy + 50, moving ? C.cyan : C.green, 26, 'center', true);
}

function drawMessages(ctx: Ctx, s: SimState): void {
  const w = s.warnings;
  let y = 612;
  const LH = 29;
  let shown = 0;
  for (const m of w.messages) {
    if (w.cleared.includes(m.id) || m.level === 'MEMO') continue;
    if (y > 740) break;
    const col = m.level === 'WARNING' ? C.red : m.level === 'CAUTION' ? C.amber : C.white;
    text(ctx, m.title, 20, y, col, 23);
    y += LH;
    for (const act of m.actions) {
      if (y > 740) break;
      text(ctx, act, 40, y, C.cyan, 21);
      y += LH;
    }
    shown++;
  }
  let my = shown > 0 ? 612 : y;
  const mx = shown > 0 ? 490 : 20;
  for (const memo of w.memos) {
    if (my > 740) break;
    text(ctx, memo, mx, my, memo.startsWith('-') ? C.cyan : C.green, 22);
    my += LH;
  }
  if (w.toConfigTest > 0 && shown === 0)
    text(ctx, 'T.O CONFIG NORMAL', mx, Math.min(my, 740), C.green, 22);
}
