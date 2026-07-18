import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  NORTH_COLOR,
  ARRIVED_COLOR,
  ARRIVED_ON_COLOR,
  WARNING_COLOR,
  ARRIVED_BORDER,
  ARRIVED_GLOW,
} from '../colors';

// ---------------------------------------------------------------------------
// SSOT 色彩常數 — 確保所有語意色彩由單一來源定義
// ---------------------------------------------------------------------------

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const RGBA_RE = /^rgba\(\d+,\d+,\d+,[\d.]+\)$/;

// WCAG 2.x 相對亮度／對比比率（與 constants.test.ts 同式，測試檔內自足）。
function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function relativeLuminance(hex: string): number {
  const r = toLinear(parseInt(hex.slice(1, 3), 16));
  const g = toLinear(parseInt(hex.slice(3, 5), 16));
  const b = toLinear(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  return (Math.max(lA, lB) + 0.05) / (Math.min(lA, lB) + 0.05);
}

describe('基底語意色（hex）', () => {
  it('NORTH_COLOR 是合法 6 位 hex', () => expect(NORTH_COLOR).toMatch(HEX_RE));
  it('ARRIVED_COLOR 是合法 6 位 hex', () => expect(ARRIVED_COLOR).toMatch(HEX_RE));
  it('WARNING_COLOR 是合法 6 位 hex', () => expect(WARNING_COLOR).toMatch(HEX_RE));

  it('NORTH_COLOR 是紅色系（第一個 channel 最大）', () => {
    const r = parseInt(NORTH_COLOR.slice(1, 3), 16);
    const g = parseInt(NORTH_COLOR.slice(3, 5), 16);
    const b = parseInt(NORTH_COLOR.slice(5, 7), 16);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });

  it('ARRIVED_COLOR 是綠色系（第二個 channel 最大）', () => {
    const r = parseInt(ARRIVED_COLOR.slice(1, 3), 16);
    const g = parseInt(ARRIVED_COLOR.slice(3, 5), 16);
    const b = parseInt(ARRIVED_COLOR.slice(5, 7), 16);
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });

  it('NORTH_COLOR 與 ARRIVED_COLOR 不同', () => {
    expect(NORTH_COLOR).not.toBe(ARRIVED_COLOR);
  });

  it('WARNING_COLOR 與 ARRIVED_COLOR 不同', () => {
    expect(WARNING_COLOR).not.toBe(ARRIVED_COLOR);
  });

  // 設計意圖：WARNING_COLOR 與 NORTH_COLOR 目前值相同，語意獨立以利未來分拆。
  it('WARNING_COLOR 目前等同 NORTH_COLOR（意圖性設計，語意獨立）', () => {
    expect(WARNING_COLOR).toBe(NORTH_COLOR);
  });
});

describe('固定語意色前景對比守門（round-4 Sonnet F2／全域終掃）', () => {
  // jsdom 環境 import.meta.url 非 file scheme，改以 vitest root（package 目錄）定位。
  function readUpdatePromptGradientHexes(): string[] {
    const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
    return ['success-from', 'success-to', 'danger-from', 'danger-to'].map((name) => {
      const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
      expect(match, `--color-${name} 必須在 index.css 以 6 位 hex 定義`).not.toBeNull();
      return match![1]!;
    });
  }

  // 白色以 alpha 疊在 hex 底上的等效混色（模擬 Tailwind bg-white/20、bg-white/15）。
  function mixWithWhite(hex: string, whiteAlpha: number): string {
    const channel = (offset: number) => {
      const value = parseInt(hex.slice(offset, offset + 2), 16);
      return Math.round(whiteAlpha * 255 + (1 - whiteAlpha) * value)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${channel(1)}${channel(3)}${channel(5)}`;
  }

  it('ARRIVED_ON_COLOR 是合法 6 位 hex', () => expect(ARRIVED_ON_COLOR).toMatch(HEX_RE));

  it('ARRIVED_ON_COLOR 對 ARRIVED_COLOR 對比須 ≥4.5:1（抵達 CTA 前景，取代白字 2.28:1）', () => {
    expect(contrastRatio(ARRIVED_ON_COLOR, ARRIVED_COLOR)).toBeGreaterThanOrEqual(4.5);
  });

  it('index.css PWA 更新提示語意色（success/danger 漸層四色）白字對比須 ≥4.5:1', () => {
    for (const hex of readUpdatePromptGradientHexes()) {
      expect(contrastRatio('#ffffff', hex)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('UpdatePrompt 按鈕混色底（white/20 重試、white/15 關閉）白字對比須 ≥4.5:1', () => {
    for (const hex of readUpdatePromptGradientHexes()) {
      for (const alpha of [0.2, 0.15]) {
        expect(
          contrastRatio('#ffffff', mixWithWhite(hex, alpha)),
          `${hex} @ bg-white/${alpha * 100} 混色底白字對比`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe('rgba 衍生常數', () => {
  it.each([
    ['ARRIVED_BORDER', ARRIVED_BORDER],
    ['ARRIVED_GLOW', ARRIVED_GLOW],
  ])('%s 符合 rgba() 格式', (_name, value) => {
    expect(value).toMatch(RGBA_RE);
  });

  it('ARRIVED_BORDER 含綠色 channel（34,197,94）', () => {
    expect(ARRIVED_BORDER).toContain('34,197,94');
  });

  it('ARRIVED_GLOW 含綠色 channel（34,197,94）', () => {
    expect(ARRIVED_GLOW).toContain('34,197,94');
  });

  it('ARRIVED_BORDER alpha 高於 ARRIVED_GLOW alpha（border 較不透明）', () => {
    const getAlpha = (s: string) => {
      const part = s.split(',')[3] ?? '0';
      return parseFloat(part);
    };
    expect(getAlpha(ARRIVED_BORDER)).toBeGreaterThan(getAlpha(ARRIVED_GLOW));
  });
});
