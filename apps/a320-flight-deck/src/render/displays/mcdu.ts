/**
 * MCDU 螢幕：繪製 buildMcduScreen 回傳的 14 行 × 24 欄字格（大/小字、色彩、翻頁箭頭）。
 */
import type { McduColor, McduScreen } from '../../sim/types';
import { C, type Ctx, fillRect, font } from './common';

const W = 768;
const H = 640;
const CW = W / 24;
const RH = H / 14;

const COLORS: Record<McduColor, string> = {
  white: C.white,
  cyan: C.cyan,
  green: C.green,
  amber: C.amber,
  magenta: C.magenta,
  yellow: C.yellow,
  red: C.red,
};

export function drawMcdu(ctx: Ctx, scr: McduScreen): void {
  fillRect(ctx, 0, 0, W, H, '#020304');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 6;
  for (let r = 0; r < scr.rows.length && r < 14; r++) {
    const y = RH * r + RH * 0.55;
    for (const seg of scr.rows[r]) {
      const small = seg.small === true || (r % 2 === 1 && r < 13 && seg.small !== false);
      font(ctx, small ? 25 : 33, !small);
      const col = COLORS[seg.color];
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      for (let i = 0; i < seg.text.length; i++) {
        const c = seg.col + i;
        if (c < 0 || c > 23) continue;
        const ch = seg.text[i];
        if (ch !== ' ') ctx.fillText(ch, c * CW + CW / 2, y);
      }
    }
  }
  ctx.shadowBlur = 0;
  // 翻頁箭頭
  const a = scr.arrows;
  ctx.fillStyle = C.white;
  const tri = (x: number, y: number, dir: 'up' | 'down' | 'left' | 'right'): void => {
    ctx.beginPath();
    if (dir === 'up') {
      ctx.moveTo(x, y - 9);
      ctx.lineTo(x - 8, y + 7);
      ctx.lineTo(x + 8, y + 7);
    } else if (dir === 'down') {
      ctx.moveTo(x, y + 9);
      ctx.lineTo(x - 8, y - 7);
      ctx.lineTo(x + 8, y - 7);
    } else if (dir === 'left') {
      ctx.moveTo(x - 9, y);
      ctx.lineTo(x + 7, y - 8);
      ctx.lineTo(x + 7, y + 8);
    } else {
      ctx.moveTo(x + 9, y);
      ctx.lineTo(x - 7, y - 8);
      ctx.lineTo(x - 7, y + 8);
    }
    ctx.closePath();
    ctx.fill();
  };
  const sy = RH * 13 + RH * 0.55;
  if (a.up) tri(W - CW * 1.5, sy, 'up');
  if (a.down) tri(W - CW * 0.5, sy, 'down');
  const ty = RH * 0.55;
  if (a.left) tri(W - CW * 1.5, ty, 'left');
  if (a.right) tri(W - CW * 0.5, ty, 'right');
}
