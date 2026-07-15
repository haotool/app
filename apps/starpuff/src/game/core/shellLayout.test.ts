import { describe, expect, it } from 'vitest';
import { computeGameSize } from './shellLayout';

// 旋轉殼尺寸決策（§28）：殼 layout 尺寸 → 邏輯遊戲尺寸（寬 854–1200、高固定 480）。
describe('computeGameSize（§28 旋轉殼 → 邏輯尺寸）', () => {
  it('直持 iPhone 13（旋轉殼 layout 844×390）→ 1039×480（與 e2e portrait 斷言同值）', () => {
    expect(computeGameSize({ w: 844, h: 390 })).toEqual({ width: 1039, height: 480 });
  });

  it('直持 Pro Max（旋轉殼 layout 932×430）→ 1040×480（驗收基準機型）', () => {
    expect(computeGameSize({ w: 932, h: 430 })).toEqual({ width: 1040, height: 480 });
  });

  it('橫持 16:9（854×480）→ 854 精確下限直通不 clamp', () => {
    expect(computeGameSize({ w: 854, h: 480 })).toEqual({ width: 854, height: 480 });
  });

  it('窄比殼（iPad 4:3 1024×768）→ clamp 至下限 854', () => {
    expect(computeGameSize({ w: 1024, h: 768 })).toEqual({ width: 854, height: 480 });
  });

  it('超寬殼（3000×480）→ clamp 至上限 1200', () => {
    expect(computeGameSize({ w: 3000, h: 480 })).toEqual({ width: 1200, height: 480 });
  });

  it('量測不足（null）→ 回退最小寬 854', () => {
    expect(computeGameSize(null)).toEqual({ width: 854, height: 480 });
  });
});
