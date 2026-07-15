import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LAYOUT,
  KEY_CLAMP,
  KEY_EDGE_PAD_PX,
  LAYOUT_SCHEMA_VERSION,
  clampKeyPosition,
  clampKeyPositionForLayer,
  parseLayout,
} from './layout';

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

describe('parseLayout', () => {
  it('null 與空字串回退預設', () => {
    expect(parseLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout('')).toEqual(DEFAULT_LAYOUT);
  });

  it('損毀 JSON 回退預設', () => {
    expect(parseLayout('{not-json')).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout('42')).toEqual(DEFAULT_LAYOUT);
  });

  it('schema 版本不符回退預設', () => {
    const raw = JSON.stringify({ version: 0, a: { cx: 0.5, cy: 0.5 }, b: { cx: 0.5, cy: 0.5 } });
    expect(parseLayout(raw)).toEqual(DEFAULT_LAYOUT);
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
    });
    expect(parseLayout(raw)).toEqual({
      version: LAYOUT_SCHEMA_VERSION,
      a: { cx: 0.4, cy: 0.6 },
      b: { cx: KEY_CLAMP.maxX, cy: 0.2 },
    });
  });

  it('預設布局本身在夾限範圍內且 A 低 B 高（食指/拇指分工）', () => {
    for (const key of ['a', 'b'] as const) {
      const pos = DEFAULT_LAYOUT[key];
      expect(clampKeyPosition(pos.cx, pos.cy)).toEqual(pos);
    }
    expect(DEFAULT_LAYOUT.b.cy).toBeLessThan(DEFAULT_LAYOUT.a.cy);
  });
});
