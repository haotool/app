/**
 * 航電顯示共用：色彩、字型、繪圖工具、電源判定、狀態雜湊（dirty 比對）。
 */
import type { DuId, SimState } from '../../sim/types';

export const C = {
  green: '#3dff4a',
  cyan: '#22d3ff',
  magenta: '#ff4dff',
  amber: '#ffae1a',
  red: '#ff2d2d',
  yellow: '#fff23a',
  white: '#ffffff',
  grey: '#9aa3ad',
  dim: '#4a5058',
  sky: '#1a8fe0',
  ground: '#8a5a2b',
  bg: '#000000',
} as const;

export type Ctx = CanvasRenderingContext2D;

const FAMILY = '"B612 Mono", "B612", monospace';
const fontCache = new Map<number, string>();

/** 設定字型（字串快取，避免每次組字串） */
export function font(ctx: Ctx, px: number, bold = false): void {
  const key = bold ? -px : px;
  let f = fontCache.get(key);
  if (f === undefined) {
    f = `${bold ? '700 ' : ''}${px}px ${FAMILY}`;
    fontCache.set(key, f);
  }
  ctx.font = f;
}

export function text(
  ctx: Ctx,
  s: string,
  x: number,
  y: number,
  color: string,
  px: number,
  align: CanvasTextAlign = 'left',
  bold = false,
): void {
  font(ctx, px, bold);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

export function line(
  ctx: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  w = 2,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function rect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  lw = 2,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.strokeRect(x, y, w, h);
}

export function fillRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function circle(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  color: string,
  lw = 2,
  fill = false,
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

/** 閥門符號：圓 + 流向線（open = 與流向平行） */
export function valve(
  ctx: Ctx,
  x: number,
  y: number,
  open: boolean,
  color: string,
  vertical = true,
): void {
  circle(ctx, x, y, 14, color, 2.5);
  const along = open === vertical;
  if (along) line(ctx, x, y - 14, x, y + 14, color, 2.5);
  else line(ctx, x - 14, y, x + 14, y, color, 2.5);
}

/** 以度為單位的圓弧錶指針角：Airbus 錶盤 0 值在左下（210°）順時針掃 */
export function gaugeAngle(frac: number, sweepDeg = 220, startDeg = 200): number {
  const d = startDeg - Math.min(1.08, Math.max(0, frac)) * sweepDeg;
  return (-d * Math.PI) / 180;
}

/** 圓弧錶：回傳指針角度 */
export function arcGauge(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  frac: number,
  color: string,
  redFrac: number | null,
  sweepDeg = 220,
): void {
  const a0 = gaugeAngle(0, sweepDeg);
  const a1 = gaugeAngle(1, sweepDeg);
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, redFrac === null ? a1 : gaugeAngle(redFrac, sweepDeg), false);
  ctx.stroke();
  if (redFrac !== null) {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, gaugeAngle(redFrac, sweepDeg), a1, false);
    ctx.stroke();
  }
  const a = gaugeAngle(frac, sweepDeg);
  line(
    ctx,
    cx + Math.cos(a) * r * 0.2,
    cy + Math.sin(a) * r * 0.2,
    cx + Math.cos(a) * (r + 8),
    cy + Math.sin(a) * (r + 8),
    color,
    4,
  );
}

export function gaugeTick(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  frac: number,
  color: string,
  len = 10,
  w = 2,
  sweepDeg = 220,
): void {
  const a = gaugeAngle(frac, sweepDeg);
  line(
    ctx,
    cx + Math.cos(a) * (r - len),
    cy + Math.sin(a) * (r - len),
    cx + Math.cos(a) * r,
    cy + Math.sin(a) * r,
    color,
    w,
  );
}

export const fmt = (v: number, digits = 0): string => v.toFixed(digits);
export const pad = (v: number, n: number): string => String(Math.round(v)).padStart(n, '0');
export const signed = (v: number, d = 0): string => (v >= 0 ? '+' : '') + v.toFixed(d);
export const wrap360 = (d: number): number => ((d % 360) + 360) % 360;
export const angDiff = (a: number, b: number): number => ((((a - b) % 360) + 540) % 360) - 180;
export const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

// ---------------------------------------------------------------------------
// 電源與亮度
// ---------------------------------------------------------------------------
export function duPowered(s: SimState, du: DuId): boolean {
  const e = s.elec;
  switch (du) {
    case 'pfd1':
    case 'nd1':
    case 'ewd':
    case 'mcdu1':
      return e.acEss || e.acBus1;
    case 'sd':
    case 'nd2':
    case 'pfd2':
    case 'mcdu2':
      return e.acBus2 || (e.busTie && e.acBus1);
    case 'isis':
      return e.dcEss || (e.hotBus && e.bat1);
  }
}

// ---------------------------------------------------------------------------
// 狀態雜湊：遞迴混入數值/布林/字串，不配置記憶體
// ---------------------------------------------------------------------------
export const HASH_SEED = 2166136261;

export function mix(h: number, n: number): number {
  return Math.imul(h ^ (Math.round(n * 100) | 0), 16777619);
}

export function hashValue(h: number, v: unknown): number {
  switch (typeof v) {
    case 'number':
      return mix(h, v);
    case 'boolean':
      return mix(h, v ? 1 : 2);
    case 'string': {
      let x = mix(h, v.length);
      for (let i = 0; i < v.length; i++) x = Math.imul(x ^ v.charCodeAt(i), 16777619);
      return x;
    }
    case 'object': {
      if (v === null) return mix(h, -7);
      if (Array.isArray(v)) {
        let x = h;
        for (const item of v) x = hashValue(x, item);
        return x;
      }
      let x = h;
      const o = v as Record<string, unknown>;
      for (const k in o) x = hashValue(x, o[k]);
      return x;
    }
    default:
      return mix(h, -3);
  }
}

// ---------------------------------------------------------------------------
// 自檢畫面與亮度遮罩
// ---------------------------------------------------------------------------
export function drawSelfTest(ctx: Ctx, w: number, h: number): void {
  fillRect(ctx, 0, 0, w, h, C.bg);
  const px = Math.round(w / 24);
  text(ctx, 'SELF TEST IN PROGRESS', w / 2, h / 2 - px, C.white, px, 'center');
  text(ctx, '(MAX 40 SECONDS)', w / 2, h / 2 + px * 0.6, C.white, px, 'center');
}

/** 顯示器質感：暗角 + 極淡像素柵格（每種尺寸只產生一次） */
const overlays = new Map<string, HTMLCanvasElement>();
export function screenOverlay(w: number, h: number): HTMLCanvasElement {
  const key = `${w}x${h}`;
  const cached = overlays.get(key);
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.35,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.75,
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.38)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.09)';
    for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
    for (let x = 0; x < w; x += 3) g.fillRect(x, 0, 1, h);
  }
  overlays.set(key, c);
  return c;
}
