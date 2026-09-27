/**
 * ISIS 整合備用儀表：姿態、速度帶、高度帶、BARO（ISIS 風格：白色刻度、灰底帶）。
 */
import type { SimState } from '../../sim/types';
import { C, type Ctx, clamp, fillRect, line, text } from './common';
import { pfdAltitude } from './pfd';

const S = 384;
const CX = 196;
const CY = 172;
const DEG = Math.PI / 180;

export function drawIsis(ctx: Ctx, s: SimState): void {
  fillRect(ctx, 0, 0, S, S, '#050608');
  const f = s.flight;
  const attOk = s.adirs.ir[2].aligned || s.adirs.ir[2].attAvail || s.adirs.ir[0].aligned;
  // 姿態
  ctx.save();
  ctx.beginPath();
  ctx.rect(76, 20, 240, 300);
  ctx.clip();
  if (attOk) {
    ctx.translate(CX, CY);
    ctx.rotate(-f.roll * DEG);
    const ppd = 6;
    const hz = f.pitch * ppd;
    fillRect(ctx, -400, -600 + hz, 800, 600, '#2f7fd0');
    fillRect(ctx, -400, hz, 800, 600, '#7a4f25');
    line(ctx, -400, hz, 400, hz, C.white, 2);
    for (let p = -30; p <= 30; p += 5) {
      if (p === 0) continue;
      const y = hz - p * ppd;
      const half = p % 10 === 0 ? 30 : 14;
      line(ctx, -half, y, half, y, C.white, 2);
      if (p % 10 === 0) text(ctx, String(Math.abs(p)), half + 14, y, C.white, 14, 'center');
    }
  } else {
    fillRect(ctx, 0, 0, S, S, '#050608');
  }
  ctx.restore();
  if (!attOk) text(ctx, 'ATT', CX, CY, C.red, 30, 'center', true);
  // 坡度指標
  ctx.save();
  ctx.translate(CX, CY);
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 118, -Math.PI * 0.75, -Math.PI * 0.25);
  ctx.stroke();
  for (const b of [-45, -30, -20, -10, 0, 10, 20, 30, 45]) {
    const a = (-90 + b) * DEG;
    line(
      ctx,
      Math.cos(a) * 118,
      Math.sin(a) * 118,
      Math.cos(a) * 128,
      Math.sin(a) * 128,
      C.white,
      2,
    );
  }
  ctx.rotate(-f.roll * DEG);
  ctx.fillStyle = C.yellow;
  ctx.beginPath();
  ctx.moveTo(0, -116);
  ctx.lineTo(-8, -102);
  ctx.lineTo(8, -102);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 飛機符號
  ctx.strokeStyle = C.yellow;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(CX - 70, CY);
  ctx.lineTo(CX - 30, CY);
  ctx.lineTo(CX - 30, CY + 10);
  ctx.moveTo(CX + 70, CY);
  ctx.lineTo(CX + 30, CY);
  ctx.lineTo(CX + 30, CY + 10);
  ctx.stroke();
  fillRect(ctx, CX - 4, CY - 4, 8, 8, C.yellow);

  // 速度帶
  fillRect(ctx, 4, 20, 70, 300, '#3a3d42');
  const ias = Math.max(30, f.ias);
  ctx.save();
  ctx.beginPath();
  ctx.rect(4, 20, 70, 300);
  ctx.clip();
  for (let v = Math.floor((ias - 40) / 10) * 10; v <= ias + 40; v += 10) {
    if (v < 30) continue;
    const y = CY - (v - ias) * 3.6;
    line(ctx, 62, y, 74, y, C.white, 2);
    if (v % 20 === 0) text(ctx, String(v), 56, y, C.white, 16, 'right');
  }
  ctx.restore();
  fillRect(ctx, 8, CY - 16, 62, 32, C.bg);
  text(ctx, String(Math.round(f.ias)), 64, CY, C.white, 22, 'right', true);
  // 高度帶
  const alt = pfdAltitude(s, 0);
  fillRect(ctx, 318, 20, 62, 300, '#3a3d42');
  ctx.save();
  ctx.beginPath();
  ctx.rect(318, 20, 62, 300);
  ctx.clip();
  for (let v = Math.floor((alt - 500) / 100) * 100; v <= alt + 500; v += 100) {
    const y = CY - (v - alt) * 0.3;
    line(ctx, 318, y, 328, y, C.white, 2);
    if (v % 200 === 0) text(ctx, String(v), 376, y, C.white, 14, 'right');
  }
  ctx.restore();
  fillRect(ctx, 314, CY - 16, 70, 32, C.bg);
  text(
    ctx,
    String(Math.round(clamp(alt, -2000, 50000) / 10) * 10),
    380,
    CY,
    C.white,
    20,
    'right',
    true,
  );
  // 航向/BARO
  const ef = s.efis[0];
  text(ctx, ef.baroStd ? 'STD' : `${Math.round(ef.qnh)} HPA`, CX, 350, C.cyan, 20, 'center', true);
  text(
    ctx,
    `${String(Math.round(((f.heading % 360) + 360) % 360)).padStart(3, '0')}`,
    CX,
    26,
    C.white,
    16,
    'center',
  );
}
