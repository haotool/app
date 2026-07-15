import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LAYOUT,
  KEY_CLAMP,
  LAYOUT_SCHEMA_VERSION,
  clampKeyPosition,
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
