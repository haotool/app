import { describe, expect, it } from 'vitest';
import { DEFAULT_PORTRAIT_ROTATION, parseRotationPref, pointerToLocal } from './rotation';

// 390x844 直持殼：殼 layout 844x390，旋轉後 AABB 390x844（寬高互換）。
const SHELL_RECT = { left: 0, top: 0, width: 390, height: 844 };
const LOCAL_W = 844;
const LOCAL_H = 390;

describe('parseRotationPref（§90 直持旋轉偏好）', () => {
  it('預設為 ccw（新方向：手機順時針轉、瀏海在右）', () => {
    expect(DEFAULT_PORTRAIT_ROTATION).toBe('ccw');
    expect(parseRotationPref(null)).toBe('ccw');
    expect(parseRotationPref('')).toBe('ccw');
    expect(parseRotationPref('garbage')).toBe('ccw');
  });

  it('明確儲存 cw 才回舊方向', () => {
    expect(parseRotationPref('cw')).toBe('cw');
    expect(parseRotationPref('ccw')).toBe('ccw');
  });
});

describe('pointerToLocal 座標矩陣（§90 四角／中心在三種旋轉態的映射）', () => {
  it('none：螢幕座標即局部座標（AABB 與 layout 同框）', () => {
    const rect = { left: 10, top: 20, width: 400, height: 300 };
    expect(pointerToLocal(rect, 400, 300, 'none', 10, 20)).toEqual({ x: 0, y: 0 });
    expect(pointerToLocal(rect, 400, 300, 'none', 410, 320)).toEqual({ x: 400, y: 300 });
    expect(pointerToLocal(rect, 400, 300, 'none', 210, 170)).toEqual({ x: 200, y: 150 });
  });

  it('cw（rotate 90deg 舊方向）：裝置四角 → 局部四角', () => {
    // 裝置右上角 = 殼局部原點（0,0）；裝置左下角 = 殼局部右下角。
    expect(pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'cw', 390, 0)).toEqual({ x: 0, y: 0 });
    expect(pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'cw', 390, 844)).toEqual({
      x: 844,
      y: 0,
    });
    expect(pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'cw', 0, 0)).toEqual({ x: 0, y: 390 });
    expect(pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'cw', 0, 844)).toEqual({
      x: 844,
      y: 390,
    });
    expect(pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'cw', 195, 422)).toEqual({
      x: 422,
      y: 195,
    });
  });

  it('ccw（rotate -90deg 新預設）：裝置四角 → 局部四角', () => {
    // ccw 殼放置於裝置左下（top:100% + rotate(-90deg)）：殼局部 (x,y) → 裝置 (y, deviceH - x)。
    // 逆映射：裝置左下角 = 殼局部原點（0,0）；裝置右上角 = 殼局部右下角。
    expect(pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'ccw', 0, 844)).toEqual({ x: 0, y: 0 });
    expect(pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'ccw', 0, 0)).toEqual({ x: 844, y: 0 });
    expect(pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'ccw', 390, 844)).toEqual({
      x: 0,
      y: 390,
    });
    expect(pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'ccw', 390, 0)).toEqual({
      x: 844,
      y: 390,
    });
    expect(pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'ccw', 195, 422)).toEqual({
      x: 422,
      y: 195,
    });
  });

  it('cw：沿裝置 +Y（往下）滑動 = 局部 +X（遊戲往右）', () => {
    const a = pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'cw', 195, 400);
    const b = pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'cw', 195, 500);
    expect(b.x - a.x).toBe(100);
    expect(b.y - a.y).toBe(0);
  });

  it('ccw：沿裝置 +Y（往下）滑動 = 局部 -X（遊戲往左）；往上滑 = 遊戲往右', () => {
    const a = pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'ccw', 195, 400);
    const b = pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'ccw', 195, 500);
    expect(b.x - a.x).toBe(-100);
    expect(b.y - a.y).toBe(0);
  });

  it('ccw：沿裝置 +X（往右）滑動 = 局部 +Y（遊戲往下）', () => {
    const a = pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'ccw', 100, 422);
    const b = pointerToLocal(SHELL_RECT, LOCAL_W, LOCAL_H, 'ccw', 200, 422);
    expect(b.y - a.y).toBe(100);
    expect(b.x - a.x).toBe(0);
  });

  it('ccw 殼內偏移元素（joy-zone）局部座標正確', () => {
    // 殼 844x390 內 joy-zone：殼局部 (ox,oy)=(0,20) 尺寸 422x370。
    // ccw 殼局部 (x,y) → 裝置 (y, deviceH - x)：zone AABB left=oy、top=deviceH-ox-w。
    const deviceH = 844;
    const zone = { ox: 0, oy: 20, w: 422, h: 370 };
    const rect = {
      left: zone.oy,
      top: deviceH - zone.ox - zone.w,
      width: zone.h,
      height: zone.w,
    };
    // 殼局部 (100, 120) → zone 局部 (100, 100) → 裝置 (120, 844-100)。
    const local = pointerToLocal(rect, zone.w, zone.h, 'ccw', 120, deviceH - 100);
    expect(local).toEqual({ x: 100, y: 100 });
  });
});
