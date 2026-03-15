import { describe, it, expect } from 'vitest';
import {
  NORTH_COLOR,
  ARRIVED_COLOR,
  WARNING_COLOR,
  ARRIVED_BORDER,
  ARRIVED_GLOW,
  WARNING_BORDER,
  WARNING_GLOW,
  WARNING_RING_STROKE,
  WARNING_SCREEN_FILL,
  WARNING_LABEL,
} from '../colors';

// ---------------------------------------------------------------------------
// SSOT 色彩常數 — 確保所有語意色彩由單一來源定義
// ---------------------------------------------------------------------------

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const RGBA_RE = /^rgba\(\d+,\d+,\d+,[\d.]+\)$/;

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

describe('rgba 衍生常數', () => {
  it.each([
    ['ARRIVED_BORDER', ARRIVED_BORDER],
    ['ARRIVED_GLOW', ARRIVED_GLOW],
    ['WARNING_BORDER', WARNING_BORDER],
    ['WARNING_GLOW', WARNING_GLOW],
    ['WARNING_RING_STROKE', WARNING_RING_STROKE],
    ['WARNING_SCREEN_FILL', WARNING_SCREEN_FILL],
    ['WARNING_LABEL', WARNING_LABEL],
  ])('%s 符合 rgba() 格式', (_name, value) => {
    expect(value).toMatch(RGBA_RE);
  });

  it('ARRIVED_BORDER 含綠色 channel（34,197,94）', () => {
    expect(ARRIVED_BORDER).toContain('34,197,94');
  });

  it('ARRIVED_GLOW 含綠色 channel（34,197,94）', () => {
    expect(ARRIVED_GLOW).toContain('34,197,94');
  });

  it('WARNING_BORDER 含紅色 channel（239,68,68）', () => {
    expect(WARNING_BORDER).toContain('239,68,68');
  });

  it('WARNING_GLOW 含紅色 channel（239,68,68）', () => {
    expect(WARNING_GLOW).toContain('239,68,68');
  });

  it('WARNING_RING_STROKE 含紅色 channel（239,68,68）', () => {
    expect(WARNING_RING_STROKE).toContain('239,68,68');
  });

  it('ARRIVED_BORDER alpha 高於 ARRIVED_GLOW alpha（border 較不透明）', () => {
    const getAlpha = (s: string) => {
      const part = s.split(',')[3] ?? '0';
      return parseFloat(part);
    };
    expect(getAlpha(ARRIVED_BORDER)).toBeGreaterThan(getAlpha(ARRIVED_GLOW));
  });
});
