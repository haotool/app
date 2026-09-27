/**
 * 印字系統：
 * - LabelAtlas：按鈕燈號/鍵帽字樣共用一張 atlas（白字透明底），供實例化字樣層取樣。
 * - PanelCanvas：面板印字（底色 + 白色印字），另產生只含印字的發光遮罩（夜間背光）。
 * 字型載入完成後重繪（B612 為 Airbus 座艙字型）。
 */
import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';

const FONT = '"B612", "Inter", "Helvetica Neue", Arial, sans-serif';

function makeCanvas(w: number, h: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function onFontsReady(cb: () => void): void {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  void document.fonts.ready.then(cb).catch(() => undefined);
}

export interface UvRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const CELL_W = 128;
const CELL_H = 48;
const ATLAS_W = 2048;
const ATLAS_H = 1024;

export class LabelAtlas {
  readonly texture: CanvasTexture;
  private readonly canvas: HTMLCanvasElement | null;
  private readonly cells = new Map<string, UvRect>();
  private readonly order: string[] = [];
  private readonly cols = ATLAS_W / CELL_W;

  constructor() {
    this.canvas = makeCanvas(ATLAS_W, ATLAS_H);
    this.texture = new CanvasTexture(this.canvas ?? undefined);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.minFilter = LinearFilter;
    this.texture.generateMipmaps = false;
    this.rect('');
    onFontsReady(() => this.redraw());
  }

  /** 取得（必要時新增）字樣 UV；空字串為全透明格 */
  rect(text: string): UvRect {
    const hit = this.cells.get(text);
    if (hit) return hit;
    const i = this.order.length;
    const cx = i % this.cols;
    const cy = Math.floor(i / this.cols);
    const r: UvRect = {
      x: (cx * CELL_W) / ATLAS_W,
      y: 1 - ((cy + 1) * CELL_H) / ATLAS_H,
      w: CELL_W / ATLAS_W,
      h: CELL_H / ATLAS_H,
    };
    this.order.push(text);
    this.cells.set(text, r);
    this.drawCell(i, text);
    this.texture.needsUpdate = true;
    return r;
  }

  private drawCell(i: number, text: string): void {
    const g = this.canvas?.getContext('2d');
    if (!g || !text) return;
    const x0 = (i % this.cols) * CELL_W;
    const y0 = Math.floor(i / this.cols) * CELL_H;
    g.clearRect(x0, y0, CELL_W, CELL_H);
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#ffffff';
    if (text === 'BAR') {
      // FCU/EFIS 綠色 LED 三條
      for (let k = 0; k < 3; k++) g.fillRect(x0 + 34 + k * 22, y0 + 20, 16, 8);
      return;
    }
    if (text === 'LIT') {
      g.fillRect(x0 + 18, y0 + 18, CELL_W - 36, 12);
      return;
    }
    if (text === 'TRI') {
      g.beginPath();
      g.moveTo(x0 + 40, y0 + 8);
      g.lineTo(x0 + 88, y0 + 8);
      g.lineTo(x0 + 64, y0 + 40);
      g.closePath();
      g.fill();
      return;
    }
    const lines = text.split('\n');
    const size = lines.length > 1 ? 18 : 30;
    g.font = `700 ${size}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    lines.forEach((ln, k) => {
      const w = g.measureText(ln).width;
      const sx = Math.min(1, (CELL_W - 10) / Math.max(w, 1));
      g.save();
      g.translate(x0 + CELL_W / 2, y0 + CELL_H / 2 + (k - (lines.length - 1) / 2) * (size + 2));
      g.scale(sx, 1);
      g.fillText(ln, 0, 1);
      g.restore();
    });
  }

  redraw(): void {
    const g = this.canvas?.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, ATLAS_W, ATLAS_H);
    this.order.forEach((t, i) => this.drawCell(i, t));
    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.texture.dispose();
  }
}

type Op = (g: CanvasRenderingContext2D, emissive: boolean) => void;

export interface TextOpts {
  size?: number; // m
  align?: CanvasTextAlign;
  bold?: boolean;
  color?: string;
  /** 發光遮罩中是否出現（面板標題等印字） */
  glow?: boolean;
  box?: boolean;
}

/** 面板印字畫布（u/v 為面板中心座標，公尺，v 向上） */
/** 面板印字密度：桌面提高以便近看可讀，手機降低以控制貼圖記憶體 */
const DEFAULT_PPM =
  typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) > 700
    ? 2000
    : 1300;

export class PanelCanvas {
  readonly map: CanvasTexture;
  readonly emissiveMap: CanvasTexture;
  private readonly color: HTMLCanvasElement | null;
  private readonly glow: HTMLCanvasElement | null;
  private readonly ops: Op[] = [];
  private readonly ppm: number;

  constructor(
    readonly w: number,
    readonly h: number,
    private readonly bg: string,
    ppm = DEFAULT_PPM,
  ) {
    const maxSide = 3072;
    this.ppm = Math.min(ppm, maxSide / Math.max(w, h));
    const pw = Math.max(16, Math.round(w * this.ppm));
    const ph = Math.max(16, Math.round(h * this.ppm));
    this.color = makeCanvas(pw, ph);
    this.glow = makeCanvas(pw, ph);
    this.map = new CanvasTexture(this.color ?? undefined);
    this.map.colorSpace = SRGBColorSpace;
    this.map.anisotropy = 4;
    this.emissiveMap = new CanvasTexture(this.glow ?? undefined);
    this.emissiveMap.colorSpace = SRGBColorSpace;
    onFontsReady(() => this.draw());
  }

  private px(u: number): number {
    return (u + this.w / 2) * this.ppm;
  }

  private py(v: number): number {
    return (this.h / 2 - v) * this.ppm;
  }

  text(u: number, v: number, str: string, o: TextOpts = {}): void {
    const size = (o.size ?? 0.0065) * this.ppm;
    const x = this.px(u);
    const y = this.py(v);
    this.ops.push((g, em) => {
      if (em && o.glow === false) return;
      g.font = `${o.bold === false ? 500 : 700} ${size}px ${FONT}`;
      g.textAlign = o.align ?? 'center';
      g.textBaseline = 'middle';
      g.fillStyle = em ? '#ffffff' : (o.color ?? '#f2f2ea');
      g.fillText(str, x, y);
      if (o.box) {
        const w = g.measureText(str).width + size * 0.6;
        g.strokeStyle = g.fillStyle;
        g.lineWidth = Math.max(1, size * 0.09);
        g.strokeRect(x - w / 2, y - size * 0.7, w, size * 1.4);
      }
    });
  }

  line(
    u1: number,
    v1: number,
    u2: number,
    v2: number,
    widthM = 0.0008,
    colorStr = '#e8e8e0',
    glow = true,
  ): void {
    const [a, b, c, d] = [this.px(u1), this.py(v1), this.px(u2), this.py(v2)];
    this.ops.push((g, em) => {
      if (em && !glow) return;
      g.strokeStyle = em ? '#ffffff' : colorStr;
      g.lineWidth = Math.max(1, widthM * this.ppm);
      g.beginPath();
      g.moveTo(a, b);
      g.lineTo(c, d);
      g.stroke();
    });
  }

  /** 區塊標題：上方置中文字 + 兩側延伸線（Airbus 面板風格） */
  section(u: number, v: number, width: number, title: string): void {
    const size = 0.0068;
    const half = width / 2;
    const tw = title.length * size * 0.36 + 0.006;
    this.line(u - half, v, u - tw, v);
    this.line(u + tw, v, u + half, v);
    this.line(u - half, v, u - half, v - 0.006);
    this.line(u + half, v, u + half, v - 0.006);
    this.text(u, v, title, { size });
  }

  /** 螺絲與面板分割線（不發光） */
  screw(u: number, v: number): void {
    const x = this.px(u);
    const y = this.py(v);
    const r = 0.0022 * this.ppm;
    this.ops.push((g, em) => {
      if (em) return;
      g.fillStyle = '#3f4a53';
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#27303a';
      g.lineWidth = Math.max(1, r * 0.35);
      g.beginPath();
      g.moveTo(x - r * 0.7, y);
      g.lineTo(x + r * 0.7, y);
      g.stroke();
    });
  }

  divider(u1: number, v1: number, u2: number, v2: number): void {
    this.line(u1, v1, u2, v2, 0.0012, '#3a444d', false);
  }

  fillRect(u: number, v: number, w: number, h: number, colorStr: string): void {
    const x = this.px(u - w / 2);
    const y = this.py(v + h / 2);
    this.ops.push((g, em) => {
      if (em) return;
      g.fillStyle = colorStr;
      g.fillRect(x, y, w * this.ppm, h * this.ppm);
    });
  }

  /** 以畫布座標自訂繪製 */
  custom(
    fn: (
      g: CanvasRenderingContext2D,
      emissive: boolean,
      px: (u: number) => number,
      py: (v: number) => number,
      ppm: number,
    ) => void,
  ): void {
    this.ops.push((g, em) =>
      fn(
        g,
        em,
        (u) => this.px(u),
        (v) => this.py(v),
        this.ppm,
      ),
    );
  }

  draw(): void {
    for (const [canvas, em] of [
      [this.color, false],
      [this.glow, true],
    ] as const) {
      const g = canvas?.getContext('2d');
      if (!canvas || !g) continue;
      g.fillStyle = em ? '#000000' : this.bg;
      g.fillRect(0, 0, canvas.width, canvas.height);
      if (!em) {
        // 細微粉體塗裝顆粒
        g.fillStyle = 'rgba(255,255,255,0.018)';
        for (let i = 0; i < canvas.width * canvas.height * 0.002; i++) {
          g.fillRect((i * 97.13) % canvas.width, (i * 57.71 * 1.31) % canvas.height, 1, 1);
        }
      }
      for (const op of this.ops) op(g, em);
    }
    this.map.needsUpdate = true;
    this.emissiveMap.needsUpdate = true;
  }

  dispose(): void {
    this.map.dispose();
    this.emissiveMap.dispose();
  }
}

/** 小型動態顯示（FCU LCD、電壓、配平、時鐘） */
export class DynamicCanvas {
  readonly texture: CanvasTexture;
  readonly canvas: HTMLCanvasElement | null;
  private last = '\u0000';

  constructor(w: number, h: number) {
    this.canvas = makeCanvas(w, h);
    this.texture = new CanvasTexture(this.canvas ?? undefined);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.minFilter = LinearFilter;
    this.texture.generateMipmaps = false;
    onFontsReady(() => this.invalidate());
  }

  /** key 改變才重繪 */
  update(key: string, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void): void {
    if (key === this.last) return;
    this.last = key;
    const g = this.canvas?.getContext('2d');
    if (!this.canvas || !g) return;
    draw(g, this.canvas.width, this.canvas.height);
    this.texture.needsUpdate = true;
  }

  invalidate(): void {
    this.last = '\u0000';
  }

  dispose(): void {
    this.texture.dispose();
  }
}

export const LCD_FONT = '"B612 Mono", "B612", monospace';
export { FONT as LABEL_FONT };
