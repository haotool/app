import { describe, expect, it, vi } from 'vitest';

// controls 匯入 audio/mute（SP 浮現觸覺尊重靜音偏好）；node 環境無 AudioContext，mock 隔離。
vi.mock('../audio/mute', () => ({ isMuted: () => false }));

import { DOWN_BUFFER_MS, JOY_DOWN_THRESHOLD, advanceDownBuffer, isJoyDown } from './controls';

describe('isJoyDown（§85 真實拇指下滑判定：扇區＋幅度）', () => {
  it('幅度閾值 18px：高於死區（12），低於舊值（30）接住底緣短行程', () => {
    expect(JOY_DOWN_THRESHOLD).toBe(18);
  });

  it('垂直下滑達 18px 即判定下向（底緣定錨僅剩 19px 行程也成立）', () => {
    expect(isJoyDown(0, 18)).toBe(true);
    expect(isJoyDown(0, 19)).toBe(true);
    expect(isJoyDown(0, 60)).toBe(true);
  });

  it('不足 18px 的輕微下偏不判定', () => {
    expect(isJoyDown(0, 13)).toBe(false);
    expect(isJoyDown(0, 17)).toBe(false);
  });

  it('斜下 45 度在 ±60 度扇區內判定為下向', () => {
    expect(isJoyDown(39, 39)).toBe(true);
    expect(isJoyDown(-39, 39)).toBe(true);
  });

  it('接近水平（超出 ±60 度扇區）不判定，保留走路語意', () => {
    // dy=20、dx=48 → 約 23 度仰角（距垂直 67 度），屬走路。
    expect(isJoyDown(48, 20)).toBe(false);
    expect(isJoyDown(-48, 20)).toBe(false);
  });

  it('上向與置中不判定為下向', () => {
    expect(isJoyDown(0, 0)).toBe(false);
    expect(isJoyDown(0, -45)).toBe(false);
    expect(isJoyDown(45, -45)).toBe(false);
  });
});

describe('advanceDownBuffer（§85 drop-intent 緩衝窗）', () => {
  it('down 持續時窗保持滿值', () => {
    expect(advanceDownBuffer(0, true, 16)).toBe(DOWN_BUFFER_MS);
    expect(advanceDownBuffer(80, true, 16)).toBe(DOWN_BUFFER_MS);
  });

  it('down 釋放後隨幀遞減至 0 不為負', () => {
    expect(advanceDownBuffer(DOWN_BUFFER_MS, false, 50)).toBe(DOWN_BUFFER_MS - 50);
    expect(advanceDownBuffer(30, false, 50)).toBe(0);
    expect(advanceDownBuffer(0, false, 50)).toBe(0);
  });

  it('窗長 300ms：flick（滑完抬指）後 300ms 內按跳仍屬下跳意圖', () => {
    expect(DOWN_BUFFER_MS).toBe(300);
    let buffer = advanceDownBuffer(0, true, 16);
    buffer = advanceDownBuffer(buffer, false, 290);
    expect(buffer).toBeGreaterThan(0);
    buffer = advanceDownBuffer(buffer, false, 20);
    expect(buffer).toBe(0);
  });
});

// pointerToLocal 座標矩陣測試移至 core/rotation.test.ts（§87 SSOT 收斂）。
