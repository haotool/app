import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LAYOUT,
  KEY_BASE_PX,
  KEY_CLAMP,
  KEY_EDGE_PAD_PX,
  KEY_SCALE,
  LAYOUT_SCHEMA_VERSION,
  PORTRAIT_THUMB_ANCHORS,
  SP_GAP_PX,
  clampKeyPosition,
  clampKeyPositionForLayer,
  clampKeyScale,
  defaultLayoutFor,
  getDefaultLayout,
  parseLayout,
  spKeyPosition,
  type KeyPosition,
} from './layout';
import type { ShellRotation } from './rotation';

describe('clampKeyPosition', () => {
  it('範圍內座標原樣返回', () => {
    expect(clampKeyPosition(0.5, 0.5)).toEqual({ cx: 0.5, cy: 0.5 });
  });

  it('超界座標夾限至邊界', () => {
    expect(clampKeyPosition(-1, 2)).toEqual({ cx: KEY_CLAMP.minX, cy: KEY_CLAMP.maxY });
    expect(clampKeyPosition(1.5, -0.2)).toEqual({ cx: KEY_CLAMP.maxX, cy: KEY_CLAMP.minY });
  });
});

describe('clampKeyPositionForLayer', () => {
  it('短 keys-layer（300px 高）以真實鍵尺寸夾限，圓鍵完整不溢出', () => {
    // 76px A 鍵於 820×300 層：邊距 = (38+4)/尺寸；四角極值皆須留足半徑。
    const high = clampKeyPositionForLayer(0.98, 0.98, 820, 300, 76);
    expect(high.cx * 820 + 38 + KEY_EDGE_PAD_PX).toBeLessThanOrEqual(820 + 1e-6);
    expect(high.cy * 300 + 38 + KEY_EDGE_PAD_PX).toBeLessThanOrEqual(300 + 1e-6);
    const low = clampKeyPositionForLayer(0.01, 0.01, 820, 300, 76);
    expect(low.cx * 820 - 38 - KEY_EDGE_PAD_PX).toBeGreaterThanOrEqual(-1e-6);
    expect(low.cy * 300 - 38 - KEY_EDGE_PAD_PX).toBeGreaterThanOrEqual(-1e-6);
  });

  it('範圍內座標不受影響；極小層退化為置中不拋錯', () => {
    expect(clampKeyPositionForLayer(0.5, 0.5, 820, 358, 72)).toEqual({ cx: 0.5, cy: 0.5 });
    expect(clampKeyPositionForLayer(0.9, 0.1, 60, 60, 76)).toEqual({ cx: 0.5, cy: 0.5 });
  });

  it('預設布局於驗收基準層（844×390 殼 → 820×358 層）與短層皆不溢出', () => {
    for (const [key, btnPx] of [
      ['a', 76],
      ['b', 72],
    ] as const) {
      const pos = DEFAULT_LAYOUT[key];
      expect(clampKeyPositionForLayer(pos.cx, pos.cy, 820, 358, btnPx)).toEqual(pos);
      const short = clampKeyPositionForLayer(pos.cx, pos.cy, 820, 300, btnPx);
      expect(short.cy * 300 + btnPx / 2).toBeLessThanOrEqual(300);
    }
  });
});

// SP 情境鍵定位（§109）：恆由 B 鍵派生「裝置空間上方」，不入自訂布局 schema。
describe('spKeyPosition（§109 SP 鍵派生定位）', () => {
  const LAYER_W = 820;
  const LAYER_H = 358;
  const DIST = KEY_BASE_PX.b / 2 + KEY_BASE_PX.sp / 2 + SP_GAP_PX;

  it('橫持（none）：SP 位於 B 鍵層空間正上方（鍵半徑＋間隙）', () => {
    const sp = spKeyPosition(DEFAULT_LAYOUT.b, 'none', LAYER_W, LAYER_H, 1);
    expect(sp.cx).toBeCloseTo(DEFAULT_LAYOUT.b.cx, 5);
    expect(sp.cy).toBeCloseTo(DEFAULT_LAYOUT.b.cy - DIST / LAYER_H, 5);
  });

  it('直持 ccw：裝置上方＝層 +x；cw：層 −x（沿 §87 軸向映射）', () => {
    const b: KeyPosition = { cx: 0.4, cy: 0.6 };
    const ccw = spKeyPosition(b, 'ccw', LAYER_W, LAYER_H, 1);
    expect(ccw.cx).toBeCloseTo(b.cx + DIST / LAYER_W, 5);
    expect(ccw.cy).toBeCloseTo(b.cy, 5);
    const cw = spKeyPosition(b, 'cw', LAYER_W, LAYER_H, 1);
    expect(cw.cx).toBeCloseTo(b.cx - DIST / LAYER_W, 5);
    expect(cw.cy).toBeCloseTo(b.cy, 5);
  });

  it('B 鍵貼層頂時 SP 夾限於層內（52px 鍵完整不溢出）', () => {
    const sp = spKeyPosition({ cx: 0.92, cy: 0.08 }, 'none', LAYER_W, LAYER_H, 1);
    expect(sp.cy * LAYER_H - KEY_BASE_PX.sp / 2 - KEY_EDGE_PAD_PX).toBeGreaterThanOrEqual(-1e-6);
  });

  it('縮放（§89）隨 --sp-key-scale 拉開距離：scale 1.3 距離放大', () => {
    const base = spKeyPosition(DEFAULT_LAYOUT.b, 'none', LAYER_W, LAYER_H, 1);
    const scaled = spKeyPosition(DEFAULT_LAYOUT.b, 'none', LAYER_W, LAYER_H, 1.3);
    expect(scaled.cy).toBeLessThan(base.cy);
  });
});

describe('getDefaultLayout', () => {
  it('回傳預設布局深拷貝且不讀寫儲存', () => {
    const layout = getDefaultLayout();
    expect(layout).toEqual(DEFAULT_LAYOUT);
    expect(layout).not.toBe(DEFAULT_LAYOUT);
    layout.a.cx = 0;
    expect(DEFAULT_LAYOUT.a.cx).not.toBe(0);
  });
});

describe('parseLayout', () => {
  it('null 與空字串回退預設', () => {
    expect(parseLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout('')).toEqual(DEFAULT_LAYOUT);
  });

  it('損毀 JSON 回退預設', () => {
    expect(parseLayout('{not-json')).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout('42')).toEqual(DEFAULT_LAYOUT);
  });

  it('未知 schema 版本回退預設', () => {
    const raw = JSON.stringify({ version: 0, a: { cx: 0.5, cy: 0.5 }, b: { cx: 0.5, cy: 0.5 } });
    expect(parseLayout(raw)).toEqual(DEFAULT_LAYOUT);
    const future = JSON.stringify({
      version: 99,
      a: { cx: 0.5, cy: 0.5 },
      b: { cx: 0.5, cy: 0.5 },
    });
    expect(parseLayout(future)).toEqual(DEFAULT_LAYOUT);
  });

  it('v1 舊存檔（無 scale）migration：鍵位保留、scale 補預設、版本升 2（§89）', () => {
    // v9–v13 舊版寫入的 sp-key-layout 皆為 version 1 形狀。
    const legacy = JSON.stringify({
      version: 1,
      a: { cx: 0.4, cy: 0.6 },
      b: { cx: 0.88, cy: 0.3 },
    });
    expect(parseLayout(legacy)).toEqual({
      version: 2,
      a: { cx: 0.4, cy: 0.6 },
      b: { cx: 0.88, cy: 0.3 },
      scale: KEY_SCALE.default,
    });
  });

  it('v2 scale 損毀或超界重新夾限', () => {
    const build = (scale: unknown) =>
      JSON.stringify({
        version: 2,
        a: { cx: 0.5, cy: 0.5 },
        b: { cx: 0.5, cy: 0.5 },
        scale,
      });
    expect(parseLayout(build(2.5)).scale).toBe(KEY_SCALE.max);
    expect(parseLayout(build(0.1)).scale).toBe(KEY_SCALE.min);
    expect(parseLayout(build('x')).scale).toBe(KEY_SCALE.default);
    expect(parseLayout(build(1.15)).scale).toBe(1.15);
  });

  it('座標形狀損毀回退預設', () => {
    const raw = JSON.stringify({
      version: LAYOUT_SCHEMA_VERSION,
      a: { cx: 'x', cy: 0.5 },
      b: { cx: 0.5, cy: 0.5 },
    });
    expect(parseLayout(raw)).toEqual(DEFAULT_LAYOUT);
  });

  it('合法資料 roundtrip，超界座標重新夾限', () => {
    const raw = JSON.stringify({
      version: LAYOUT_SCHEMA_VERSION,
      a: { cx: 0.4, cy: 0.6 },
      b: { cx: 2, cy: 0.2 },
      scale: 1.2,
    });
    expect(parseLayout(raw)).toEqual({
      version: LAYOUT_SCHEMA_VERSION,
      a: { cx: 0.4, cy: 0.6 },
      b: { cx: KEY_CLAMP.maxX, cy: 0.2 },
      scale: 1.2,
    });
  });

  it('觸控 hit-target 守門（§89）：最小縮放下最小鍵仍 ≥44px', () => {
    expect(
      clampKeyScale(KEY_SCALE.min) * Math.min(KEY_BASE_PX.a, KEY_BASE_PX.b),
    ).toBeGreaterThanOrEqual(44);
    expect(KEY_SCALE.min).toBeLessThan(1);
    expect(KEY_SCALE.max).toBeGreaterThan(1);
  });

  it('KEY_BASE_PX 與 style.css 基準鍵寬一致（雙寫守門，審查 Mi1）', () => {
    const css = readFileSync(new URL('../../style.css', import.meta.url), 'utf8');
    for (const key of ['a', 'b'] as const) {
      expect(css).toContain(`calc(${KEY_BASE_PX[key]}px * var(--sp-key-scale, 1))`);
    }
  });

  it('預設布局本身在夾限範圍內且 A 低 B 高（食指/拇指分工）', () => {
    for (const key of ['a', 'b'] as const) {
      const pos = DEFAULT_LAYOUT[key];
      expect(clampKeyPosition(pos.cx, pos.cy)).toEqual(pos);
    }
    expect(DEFAULT_LAYOUT.b.cy).toBeLessThan(DEFAULT_LAYOUT.a.cy);
  });
});

// v16 D1：直持旋轉殼下的預設鍵位必須落在「裝置螢幕右下拇指帶」。
// 前向模擬：layer 比例 → 殼座標 → 裝置座標（390×844 直持、layer 內縮 20/12/12/12），
// ccw 殼局部 (x,y) → 裝置 (y, deviceH−x)；cw 殼局部 (x,y) → 裝置 (deviceW−y, x)。
function deviceFractionOf(
  pos: KeyPosition,
  rotation: 'cw' | 'ccw',
  device = { w: 390, h: 844 },
): { fx: number; fy: number } {
  const shellW = device.h;
  const shellH = device.w;
  const layer = { left: 12, top: 20, w: shellW - 24, h: shellH - 32 };
  const xs = layer.left + pos.cx * layer.w;
  const ys = layer.top + pos.cy * layer.h;
  const [xd, yd] = rotation === 'ccw' ? [ys, device.h - xs] : [device.w - ys, xs];
  return { fx: xd / device.w, fy: yd / device.h };
}

describe('defaultLayoutFor（v16 D1 直持專用預設錨點）', () => {
  it('none（橫持）維持 v14 預設不變', () => {
    expect(defaultLayoutFor('none')).toEqual(DEFAULT_LAYOUT);
    expect(defaultLayoutFor('none')).not.toBe(DEFAULT_LAYOUT);
  });

  it.each(['cw', 'ccw'] as const)('%s：A 落裝置右下拇指帶、B 於其上方帶內', (rotation) => {
    const layout = defaultLayoutFor(rotation);
    const a = deviceFractionOf(layout.a, rotation);
    const b = deviceFractionOf(layout.b, rotation);
    // A（跳躍主鍵）：右緣帶 fx ≥ 0.72、底部帶 fy 0.78–0.95（joystick 錨帶 fy≈0.75 以下不可及）。
    expect(a.fx).toBeGreaterThanOrEqual(0.72);
    expect(a.fx).toBeLessThanOrEqual(0.95);
    expect(a.fy).toBeGreaterThanOrEqual(0.78);
    expect(a.fy).toBeLessThanOrEqual(0.95);
    // B（吸/射）：拇指弧上移但仍在可達帶（fy 0.6–0.78），且不貼左緣。
    expect(b.fx).toBeGreaterThanOrEqual(0.65);
    expect(b.fy).toBeGreaterThanOrEqual(0.6);
    expect(b.fy).toBeLessThanOrEqual(0.78);
  });

  it.each(['cw', 'ccw'] as const)('%s：A/B 裝置距離 ≥ 90px 防誤觸（390×844）', (rotation) => {
    const layout = defaultLayoutFor(rotation);
    const a = deviceFractionOf(layout.a, rotation);
    const b = deviceFractionOf(layout.b, rotation);
    const dist = Math.hypot((a.fx - b.fx) * 390, (a.fy - b.fy) * 844);
    expect(dist).toBeGreaterThanOrEqual(90);
  });

  it.each(['cw', 'ccw'] as const)('%s：錨點在持久化夾限與 844×390 殼動態夾限內', (rotation) => {
    const layout = defaultLayoutFor(rotation);
    for (const [key, btnPx] of [
      ['a', 76],
      ['b', 72],
    ] as const) {
      const pos = layout[key];
      expect(clampKeyPosition(pos.cx, pos.cy)).toEqual(pos);
      expect(clampKeyPositionForLayer(pos.cx, pos.cy, 820, 358, btnPx)).toEqual(pos);
    }
  });

  it('螢幕空間目標 SSOT 反算一致（cw 與 ccw 指向同一組拇指帶目標）', () => {
    const rotations: ShellRotation[] = ['cw', 'ccw'];
    for (const rotation of rotations) {
      const layout = defaultLayoutFor(rotation);
      for (const key of ['a', 'b'] as const) {
        const target = PORTRAIT_THUMB_ANCHORS[key];
        const expected =
          rotation === 'ccw'
            ? { cx: 1 - target.fy, cy: target.fx }
            : { cx: target.fy, cy: 1 - target.fx };
        expect(layout[key].cx).toBeCloseTo(expected.cx, 6);
        expect(layout[key].cy).toBeCloseTo(expected.cy, 6);
      }
    }
  });

  it('回傳深拷貝：呼叫端變更不汙染 SSOT', () => {
    const layout = defaultLayoutFor('ccw');
    layout.a.cx = 0;
    expect(defaultLayoutFor('ccw').a.cx).not.toBe(0);
  });

  it('style.css 直持 fallback 位置鏡像反算值（雙寫守門）', () => {
    const css = readFileSync(new URL('../../style.css', import.meta.url), 'utf8');
    for (const rotation of ['cw', 'ccw'] as const) {
      const layout = defaultLayoutFor(rotation);
      for (const key of ['a', 'b'] as const) {
        expect(css).toContain(`left: ${Math.round(layout[key].cx * 100)}%`);
        expect(css).toContain(`top: ${Math.round(layout[key].cy * 100)}%`);
      }
    }
  });
});

describe('parseLayout／loadLayout 旋轉感知回退（v16 D1）', () => {
  it('null 回退依旋轉態取對應預設；有效自訂資料不受旋轉影響', () => {
    expect(parseLayout(null, 'ccw')).toEqual(defaultLayoutFor('ccw'));
    expect(parseLayout('{broken', 'cw')).toEqual(defaultLayoutFor('cw'));
    const custom = JSON.stringify({
      version: LAYOUT_SCHEMA_VERSION,
      a: { cx: 0.4, cy: 0.6 },
      b: { cx: 0.7, cy: 0.2 },
      scale: 1,
    });
    expect(parseLayout(custom, 'ccw').a).toEqual({ cx: 0.4, cy: 0.6 });
    expect(parseLayout(custom, 'cw').a).toEqual({ cx: 0.4, cy: 0.6 });
  });

  it('v1 舊存檔在直持殼下仍保留使用者鍵位（migration 不被預設覆蓋）', () => {
    const legacy = JSON.stringify({
      version: 1,
      a: { cx: 0.4, cy: 0.6 },
      b: { cx: 0.88, cy: 0.3 },
    });
    expect(parseLayout(legacy, 'ccw')).toEqual({
      version: 2,
      a: { cx: 0.4, cy: 0.6 },
      b: { cx: 0.88, cy: 0.3 },
      scale: KEY_SCALE.default,
    });
  });
});
