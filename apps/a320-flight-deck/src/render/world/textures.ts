/**
 * 機場程序貼圖（Canvas）：瀝青、混凝土、胎痕、跑道號碼、航站帷幕、鐵網、光暈。
 */
import type { CanvasTexture } from 'three';
import { canvas2d, canvasTexture, rng } from './common';

/** 瀝青：骨料顆粒 + 橫向刻槽 + 修補斑塊；平鋪 16 m */
export function asphaltTexture(
  seed: number,
  base: [number, number, number],
  grooves: boolean,
  aniso: number,
): CanvasTexture {
  const { canvas, ctx } = canvas2d(512, 512);
  const r = rng(seed);
  ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
  ctx.fillRect(0, 0, 512, 512);
  // 大尺度色斑
  for (let i = 0; i < 40; i++) {
    const x = r() * 512;
    const y = r() * 512;
    const rad = 30 + r() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const d = r() < 0.5 ? 0 : 255;
    g.addColorStop(0, `rgba(${d},${d},${d},0.05)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // 骨料
  for (let i = 0; i < 60000; i++) {
    const v = r();
    const c = v < 0.5 ? 20 + r() * 25 : 90 + r() * 70;
    ctx.fillStyle = `rgba(${c},${c},${c},${0.25 + r() * 0.35})`;
    ctx.fillRect(r() * 512, r() * 512, 1 + r() * 1.4, 1 + r() * 1.4);
  }
  // 橫向刻槽（U 沿跑道 → 垂直線即橫越跑道）
  if (grooves) {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 512; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, 512);
      ctx.stroke();
    }
  }
  // 修補補丁與裂縫
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.06 + r() * 0.08})`;
    ctx.fillRect(r() * 480, r() * 480, 20 + r() * 60, 12 + r() * 40);
  }
  ctx.strokeStyle = 'rgba(10,10,10,0.35)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    let x = r() * 512;
    let y = r() * 512;
    ctx.moveTo(x, y);
    for (let k = 0; k < 8; k++) {
      x += (r() - 0.5) * 30;
      y += (r() - 0.5) * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return canvasTexture(canvas, true, true, aniso);
}

/** 混凝土：5 m 版塊接縫（貼圖代表 20 m）+ 油漬 */
export function concreteTexture(aniso: number): CanvasTexture {
  const { canvas, ctx } = canvas2d(512, 512);
  const r = rng(99);
  ctx.fillStyle = 'rgb(150,151,149)';
  ctx.fillRect(0, 0, 512, 512);
  for (let sx = 0; sx < 4; sx++) {
    for (let sy = 0; sy < 4; sy++) {
      const t = (r() - 0.5) * 18;
      ctx.fillStyle = `rgba(${128 + t},${129 + t},${126 + t},0.35)`;
      ctx.fillRect(sx * 128, sy * 128, 128, 128);
    }
  }
  for (let i = 0; i < 40000; i++) {
    const c = 100 + r() * 90;
    ctx.fillStyle = `rgba(${c},${c},${c},0.25)`;
    ctx.fillRect(r() * 512, r() * 512, 1.2, 1.2);
  }
  for (let i = 0; i < 14; i++) {
    const x = r() * 512;
    const y = r() * 512;
    const rad = 6 + r() * 24;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(30,28,25,0.35)');
    g.addColorStop(1, 'rgba(30,28,25,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  ctx.fillStyle = 'rgba(40,40,40,0.8)';
  for (let k = 0; k <= 4; k++) {
    ctx.fillRect(k * 128 - 1, 0, 2, 512);
    ctx.fillRect(0, k * 128 - 1, 512, 2);
  }
  return canvasTexture(canvas, true, true, aniso);
}

/** 胎痕（alphaMap：白 = 橡膠沉積）；U 沿跑道（0 = 接地起點）、V 橫跨 24 m */
export function tireMarksTexture(aniso: number): CanvasTexture {
  const { canvas, ctx } = canvas2d(1024, 256);
  const r = rng(7);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 1024, 256);
  const tracks = [128 - 40, 128 + 40, 128];
  for (let i = 0; i < 420; i++) {
    const pick = r();
    const center =
      (pick < 0.42 ? tracks[0] : pick < 0.84 ? tracks[1] : tracks[2]) + (r() - 0.5) * 34;
    const start = Math.pow(r(), 1.6) * 500;
    const len = 60 + r() * 380;
    const a = 0.05 + r() * 0.12;
    const grad = ctx.createLinearGradient(start, 0, start + len, 0);
    grad.addColorStop(0, `rgba(255,255,255,${a * 1.6})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5 + r() * 5;
    ctx.beginPath();
    ctx.moveTo(start, center);
    ctx.lineTo(start + len, center + (r() - 0.5) * 6);
    ctx.stroke();
  }
  // 中線附近的均勻橡膠帶
  const band = ctx.createLinearGradient(0, 0, 1024, 0);
  band.addColorStop(0, 'rgba(255,255,255,0.18)');
  band.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 60, 1024, 136);
  return canvasTexture(canvas, false, false, aniso);
}

/** 跑道號碼 alphaMap：窄體粗字；上方 = 前進方向 */
export function designatorTexture(text: string, aniso: number): CanvasTexture {
  const { canvas, ctx } = canvas2d(512, 512);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 520px "Arial Narrow", Arial, Helvetica, sans-serif';
  ctx.save();
  ctx.translate(256, 262);
  ctx.scale(0.62, 1);
  ctx.fillText(text, 0, 0);
  ctx.restore();
  return canvasTexture(canvas, false, false, aniso);
}

/** 航站玻璃帷幕：map（竪框/樓板）與 emissive（夜間室內光）；一個貼圖 = 40 m × 20 m */
export function facadeTextures(aniso: number): { map: CanvasTexture; emissive: CanvasTexture } {
  const r = rng(31);
  const a = canvas2d(512, 256);
  const b = canvas2d(512, 256);
  a.ctx.fillStyle = 'rgb(120,140,155)';
  a.ctx.fillRect(0, 0, 512, 256);
  b.ctx.fillStyle = '#000';
  b.ctx.fillRect(0, 0, 512, 256);
  for (let floor = 0; floor < 3; floor++) {
    const y0 = 256 - (floor + 1) * 80;
    for (let bay = 0; bay < 16; bay++) {
      const v = 0.45 + r() * 0.55;
      const warm = r() < 0.75;
      b.ctx.fillStyle = warm
        ? `rgba(255,${200 + r() * 30},${140 + r() * 40},${v})`
        : `rgba(200,225,255,${v})`;
      b.ctx.fillRect(bay * 32 + 2, y0 + 4, 28, 72);
    }
  }
  for (const c of [a.ctx, b.ctx]) {
    c.fillStyle = c === a.ctx ? 'rgb(55,60,66)' : '#000';
    for (let x = 0; x <= 512; x += 32) c.fillRect(x - 1.5, 0, 3, 256);
    for (let y = 16; y <= 256; y += 80) c.fillRect(0, y - 3, 512, 6);
  }
  return {
    map: canvasTexture(a.canvas, true, true, aniso),
    emissive: canvasTexture(b.canvas, true, true, aniso),
  };
}

/** 鐵絲網 alphaMap（平鋪 3 m） */
export function chainLinkTexture(): CanvasTexture {
  const { canvas, ctx } = canvas2d(64, 64);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  for (let k = -64; k < 128; k += 12) {
    ctx.beginPath();
    ctx.moveTo(k, 0);
    ctx.lineTo(k + 64, 64);
    ctx.moveTo(k + 64, 0);
    ctx.lineTo(k, 64);
    ctx.stroke();
  }
  ctx.fillRect(0, 0, 64, 3);
  return canvasTexture(canvas, false, true, 1);
}

/** 放射狀光暈（地面泛光 decal） */
export function radialTexture(): CanvasTexture {
  const { canvas, ctx } = canvas2d(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return canvasTexture(canvas, true, false, 1);
}
