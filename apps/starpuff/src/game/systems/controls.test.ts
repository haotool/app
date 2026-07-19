import { describe, expect, it } from 'vitest';
import {
  DOWN_BUFFER_MS,
  JOY_DOWN_THRESHOLD,
  advanceDownBuffer,
  isJoyDown,
  pointerToLocal,
} from './controls';

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

describe('pointerToLocal（recon-v4 A.3 旋轉殼座標重映射）', () => {
  it('未旋轉：螢幕座標即局部座標（AABB 與 layout 同框）', () => {
    const rect = { left: 10, top: 20, width: 400, height: 300 };
    expect(pointerToLocal(rect, 400, 300, false, 10, 20)).toEqual({ x: 0, y: 0 });
    expect(pointerToLocal(rect, 400, 300, false, 410, 320)).toEqual({ x: 400, y: 300 });
    expect(pointerToLocal(rect, 400, 300, false, 210, 170)).toEqual({ x: 200, y: 150 });
  });

  it('旋轉 90 度 CW：裝置頂緣對應局部左緣、裝置左緣對應局部下緣', () => {
    // 390x844 直持殼：layout 844x390，AABB 390x844（寬高互換）。
    const rect = { left: 0, top: 0, width: 390, height: 844 };
    // 裝置右上角 = 殼局部原點（0,0）。
    expect(pointerToLocal(rect, 844, 390, true, 390, 0)).toEqual({ x: 0, y: 0 });
    // 裝置左下角 = 殼局部右下角（844,390）。
    expect(pointerToLocal(rect, 844, 390, true, 0, 844)).toEqual({ x: 844, y: 390 });
    // 螢幕中心 = 局部中心。
    expect(pointerToLocal(rect, 844, 390, true, 195, 422)).toEqual({ x: 422, y: 195 });
    // 沿裝置 +Y（往下）滑動 = 局部 +X（往右）。
    const a = pointerToLocal(rect, 844, 390, true, 195, 400);
    const b = pointerToLocal(rect, 844, 390, true, 195, 500);
    expect(b.x - a.x).toBe(100);
    expect(b.y - a.y).toBe(0);
  });

  it('旋轉下含偏移的內層元素（joy-zone）局部座標正確', () => {
    // 殼 844x390 內 joy-zone：layout 位於 (0,20) 尺寸 422x370 → 旋轉後 AABB left=0, top=0（裝置
    // 頂緣起）… 以殼局部 (ox,oy)=(0,20) 推導：AABB = (left=deviceW-oy-h, top=ox, w=h, h=w)。
    const deviceW = 390;
    const zone = { ox: 0, oy: 20, w: 422, h: 370 };
    const rect = {
      left: deviceW - zone.oy - zone.h,
      top: zone.ox,
      width: zone.h,
      height: zone.w,
    };
    // 殼局部 (100, 120) → 裝置螢幕 (deviceW - 120, 100)；zone 局部應為 (100-0, 120-20)。
    const local = pointerToLocal(rect, zone.w, zone.h, true, deviceW - 120, 100);
    expect(local).toEqual({ x: 100, y: 100 });
  });
});
