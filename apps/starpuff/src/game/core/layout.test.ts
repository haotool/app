import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LAYOUT,
  KEY_BASE_PX,
  KEY_CLAMP,
  KEY_EDGE_PAD_PX,
  KEY_SCALE,
  LAYOUT_SCHEMA_VERSION,
  clampKeyPosition,
  clampKeyPositionForLayer,
  clampKeyScale,
  getDefaultLayout,
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
