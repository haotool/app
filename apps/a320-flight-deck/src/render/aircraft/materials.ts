/**
 * 外部機體材質與程序貼圖：虛構「HAO AIR」塗裝（機身 UV：u 沿機身 z、v = θ/2π，θ=0 為右側中線、90° 為機頂）。
 */
import {
  CanvasTexture,
  Color,
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three';
import { AIRCRAFT } from '../../sim/constants';

const NAVY = '#0f2a5c';
const CYAN = '#19b8d6';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return [c, ctx];
}

function tex(c: HTMLCanvasElement, srgb = true): CanvasTexture {
  const t = new CanvasTexture(c);
  if (srgb) t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** 機身塗裝：u → canvas x（機鼻在左），θ → canvas y */
function liveryTexture(): CanvasTexture {
  const W = 4096;
  const H = 1024;
  const [c, g] = canvas(W, H);
  const len = AIRCRAFT.tailZ - AIRCRAFT.noseZ;
  const ux = (z: number): number => ((z - AIRCRAFT.noseZ) / len) * W;
  const ty = (deg: number): number => ((((deg % 360) + 360) % 360) / 360) * H;

  g.fillStyle = '#f4f5f6';
  g.fillRect(0, 0, W, H);
  // 機腹深藍（θ 200..340）與青色細線
  g.fillStyle = NAVY;
  g.fillRect(0, ty(203), W, ty(337) - ty(203));
  g.fillStyle = CYAN;
  g.fillRect(0, ty(198), W, ty(202) - ty(198));
  g.fillRect(0, ty(338), W, ty(342) - ty(338));
  // 後段上揚弧形（兩側）
  for (const side of [0, 1]) {
    g.beginPath();
    const base = side === 0 ? 338 : 202;
    const dir = side === 0 ? 1 : -1;
    g.moveTo(ux(4), ty(base));
    g.bezierCurveTo(ux(9), ty(base), ux(13), ty(base + dir * 24), ux(19.7), ty(base + dir * 70));
    g.lineTo(ux(19.7), ty(base + dir * 20));
    g.bezierCurveTo(ux(14), ty(base + dir * 4), ux(9), ty(base), ux(4), ty(base));
    g.fillStyle = CYAN;
    g.fill();
  }
  // 雷達罩與鼻錐略灰
  g.fillStyle = 'rgba(160,166,172,0.35)';
  g.fillRect(0, 0, ux(-17.1), H);

  const rect = (
    z0: number,
    z1: number,
    th0: number,
    th1: number,
    stroke: string,
    lw: number,
  ): void => {
    g.strokeStyle = stroke;
    g.lineWidth = lw;
    for (const off of [-H, 0, H]) {
      const y0 = (th0 / 360) * H + off;
      const y1 = (th1 / 360) * H + off;
      g.beginPath();
      g.roundRect(ux(z0), Math.min(y0, y1), ux(z1) - ux(z0), Math.abs(y1 - y0), 6);
      g.stroke();
    }
  };
  // 艙門輪廓（左右兩側）：L1/R1、翼上逃生門、L4/R4、貨艙門（右側）
  const doorLine = 'rgba(70,78,88,0.85)';
  for (const [z0, z1] of [
    [-12.05, -11.2],
    [10.6, 11.4],
  ]) {
    rect(z0, z1, -25, 29, doorLine, 3);
    rect(z0, z1, 151, 205, doorLine, 3);
  }
  for (const z of [-1.25, -0.45]) {
    rect(z, z + 0.52, 3, 24, doorLine, 2.5);
    rect(z, z + 0.52, 156, 177, doorLine, 2.5);
  }
  rect(-8.4, -6.6, 300, 330, 'rgba(210,220,235,0.5)', 3);
  rect(5.2, 7.0, 300, 330, 'rgba(210,220,235,0.5)', 3);

  // 文字：左側正向；右側旋轉 180°（見 UV 方向）
  const text = (
    s: string,
    z: number,
    th: number,
    size: number,
    color: string,
    right: boolean,
    font = 'Inter, Arial, sans-serif',
  ): void => {
    g.save();
    g.translate(ux(z), ty(th));
    if (right) g.rotate(Math.PI);
    g.font = `700 ${size}px ${font}`;
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    // u 方向每公尺像素約為 θ 方向的 1.35 倍，水平拉伸補償使字形不變形
    g.scale(1.35, 1);
    g.fillText(s, 0, 0);
    g.restore();
  };
  text('HAO AIR', -3.2, 140, 100, NAVY, false);
  text('HAO AIR', -3.2, 40, 100, NAVY, true);
  text('B-HAO1', 15.6, 168, 44, '#3a4452', false);
  text('B-HAO1', 15.6, 12, 44, '#3a4452', true);
  text('a320neo', 9.2, 150, 48, CYAN, false);
  text('a320neo', 9.2, 30, 48, CYAN, true);
  return tex(c);
}

/** 垂直尾翼塗裝：平面 UV (z, y) */
function finTexture(): CanvasTexture {
  const [c, g] = canvas(1024, 1024);
  const grad = g.createLinearGradient(0, 1024, 1024, 0);
  grad.addColorStop(0, '#0b2350');
  grad.addColorStop(1, NAVY);
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 1024);
  // 抽象幾何標誌：三道上升弧與六角星點
  g.strokeStyle = CYAN;
  g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    g.lineWidth = 34 - i * 8;
    g.globalAlpha = 1 - i * 0.22;
    g.beginPath();
    g.arc(820, 900, 380 + i * 110, Math.PI * 1.05, Math.PI * 1.42);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.fillStyle = '#ffffff';
  g.beginPath();
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const r = k % 2 === 0 ? 110 : 44;
    g.lineTo(560 + Math.cos(a) * r, 430 + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  return tex(c);
}

/** 機翼上表面：走道標線與 NO STEP（平面 UV：u = 0.5 + x/36（左翼在左半）、z -5..7） */
function wingTexture(): CanvasTexture {
  const [c, g] = canvas(2048, 1024);
  g.fillStyle = '#c3c7cc';
  g.fillRect(0, 0, 2048, 1024);
  const pz = (z: number): number => ((z + 5) / 12) * 1024;
  for (const side of [-1, 1] as const) {
    const px = (x: number): number => 1024 + side * (x / 18) * 1024;
    // 面板接縫
    g.strokeStyle = 'rgba(90,96,104,0.35)';
    g.lineWidth = 2;
    for (let x = 2; x < 18; x += 1.35) {
      g.beginPath();
      g.moveTo(px(x), 0);
      g.lineTo(px(x), 1024);
      g.stroke();
    }
    // 走道（深灰）與邊線
    g.fillStyle = '#8d939a';
    g.beginPath();
    g.moveTo(px(2.0), pz(-2.8));
    g.lineTo(px(5.2), pz(-1.2));
    g.lineTo(px(5.2), pz(0.4));
    g.lineTo(px(2.0), pz(-0.8));
    g.closePath();
    g.fill();
    g.strokeStyle = '#1e2126';
    g.lineWidth = 5;
    g.stroke();
    g.fillStyle = '#1e2126';
    g.font = '700 26px Inter, Arial, sans-serif';
    g.textAlign = 'center';
    g.save();
    g.translate(px(7.5), pz(0.6));
    g.rotate((side * -Math.PI) / 2);
    g.fillText('NO STEP', 0, 0);
    g.restore();
  }
  return tex(c);
}

/** 整流錐白色螺旋（Lathe UV：u 繞圈、v 沿母線） */
function spinnerTexture(): CanvasTexture {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#1d1f23';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#f2f2f2';
  g.lineWidth = 26;
  g.beginPath();
  for (let v = 0; v <= 256; v += 4) g.lineTo((v * 0.9) % 256, v);
  g.stroke();
  const t = tex(c);
  t.wrapS = RepeatWrapping;
  return t;
}

/** 徑向光暈（燈具 sprite） */
function glowTexture(): CanvasTexture {
  const [c, g] = canvas(128, 128);
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.18, 'rgba(255,255,255,0.75)');
  r.addColorStop(0.45, 'rgba(255,255,255,0.18)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return tex(c, false);
}

/** 煙霧粒子 */
function smokeTexture(): CanvasTexture {
  const [c, g] = canvas(128, 128);
  for (let i = 0; i < 18; i++) {
    const x = 40 + Math.random() * 48;
    const y = 40 + Math.random() * 48;
    const rad = 18 + Math.random() * 30;
    const r = g.createRadialGradient(x, y, 0, x, y, rad);
    r.addColorStop(0, 'rgba(235,235,235,0.35)');
    r.addColorStop(1, 'rgba(235,235,235,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
  }
  return tex(c, false);
}

/** 光錐漸層（alphaMap：Cone uv.y=1 為頂點） */
function coneTexture(): CanvasTexture {
  const [c, g] = canvas(4, 256);
  const lg = g.createLinearGradient(0, 0, 0, 256);
  lg.addColorStop(0, '#000');
  lg.addColorStop(0.03, '#fff');
  lg.addColorStop(0.35, '#777');
  lg.addColorStop(1, '#000');
  g.fillStyle = lg;
  g.fillRect(0, 0, 4, 256);
  return tex(c, false);
}

export interface AircraftMaterials {
  livery: MeshPhysicalMaterial;
  paint: MeshPhysicalMaterial;
  navy: MeshPhysicalMaterial;
  fin: MeshPhysicalMaterial;
  wing: MeshStandardMaterial;
  wingPlain: MeshStandardMaterial;
  metal: MeshStandardMaterial;
  darkMetal: MeshStandardMaterial;
  fan: MeshStandardMaterial;
  spinner: MeshStandardMaterial;
  cascade: MeshStandardMaterial;
  tire: MeshStandardMaterial;
  strut: MeshStandardMaterial;
  chrome: MeshStandardMaterial;
  well: MeshStandardMaterial;
  glass: MeshPhysicalMaterial;
  cabinWindow: MeshPhysicalMaterial;
  black: MeshStandardMaterial;
  textures: { glow: Texture; smoke: Texture; cone: Texture };
  dispose(): void;
}

export function createMaterials(): AircraftMaterials {
  const liveryTex = liveryTexture();
  const finTex = finTexture();
  const wingTex = wingTexture();
  const spinTex = spinnerTexture();
  const glow = glowTexture();
  const smoke = smokeTexture();
  const cone = coneTexture();
  const white = new Color('#f4f5f6');
  const m: Omit<AircraftMaterials, 'dispose'> = {
    livery: new MeshPhysicalMaterial({
      map: liveryTex,
      roughness: 0.32,
      metalness: 0.05,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
    }),
    paint: new MeshPhysicalMaterial({
      color: white,
      roughness: 0.32,
      metalness: 0.05,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
      side: DoubleSide,
    }),
    navy: new MeshPhysicalMaterial({
      color: NAVY,
      roughness: 0.35,
      metalness: 0.1,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
    }),
    fin: new MeshPhysicalMaterial({
      map: finTex,
      roughness: 0.3,
      metalness: 0.08,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
    }),
    wing: new MeshStandardMaterial({ map: wingTex, roughness: 0.48, metalness: 0.25 }),
    wingPlain: new MeshStandardMaterial({ color: '#c3c7cc', roughness: 0.5, metalness: 0.25 }),
    metal: new MeshStandardMaterial({
      color: '#c4c8ce',
      roughness: 0.22,
      metalness: 1,
      side: DoubleSide,
    }),
    darkMetal: new MeshStandardMaterial({
      color: '#5b5752',
      roughness: 0.5,
      metalness: 0.85,
      side: DoubleSide,
    }),
    fan: new MeshStandardMaterial({
      color: '#6f757c',
      roughness: 0.32,
      metalness: 0.9,
      side: DoubleSide,
    }),
    spinner: new MeshStandardMaterial({
      map: spinTex,
      roughness: 0.35,
      metalness: 0.4,
      side: DoubleSide,
    }),
    cascade: new MeshStandardMaterial({
      color: '#2d3035',
      roughness: 0.7,
      metalness: 0.6,
      side: DoubleSide,
    }),
    tire: new MeshStandardMaterial({ color: '#141414', roughness: 0.92, metalness: 0 }),
    strut: new MeshStandardMaterial({ color: '#a3a8ae', roughness: 0.38, metalness: 0.85 }),
    chrome: new MeshStandardMaterial({ color: '#e6e9ec', roughness: 0.1, metalness: 1 }),
    well: new MeshStandardMaterial({
      color: '#4a4f56',
      roughness: 0.7,
      metalness: 0.3,
      side: DoubleSide,
    }),
    glass: new MeshPhysicalMaterial({
      color: '#050a10',
      roughness: 0.04,
      metalness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    }),
    cabinWindow: new MeshPhysicalMaterial({
      color: '#0b121a',
      roughness: 0.08,
      metalness: 0.3,
      clearcoat: 1,
      emissive: new Color('#ffd9a0'),
      emissiveIntensity: 0,
    }),
    black: new MeshStandardMaterial({ color: '#0d0e10', roughness: 0.6, metalness: 0.2 }),
    textures: { glow, smoke, cone },
  };
  return {
    ...m,
    dispose(): void {
      for (const v of Object.values(m)) {
        if (v instanceof MeshStandardMaterial) v.dispose();
      }
      for (const t of [liveryTex, finTex, wingTex, spinTex, glow, smoke, cone]) t.dispose();
    },
  };
}
