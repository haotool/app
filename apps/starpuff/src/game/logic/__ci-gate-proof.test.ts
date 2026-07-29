import { describe, expect, it } from 'vitest';

// 閘門反證（#918 驗收標準第 4 項）：刻意失敗，用來證明 CI Quality Checks 會因
// starpuff 單元測試失敗而轉紅。確認 CI 轉紅後本檔即以下一個 commit 移除。
describe('CI 閘門反證', () => {
  it('刻意失敗——若 CI 顯示綠燈代表閘門未接上', () => {
    expect(1).toBe(2);
  });
});
