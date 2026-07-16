/**
 * formatPlate SSOT 測試（issue #733）：
 * 未填車號 sentinel 判定與顯示轉換為全 app 唯一來源，
 * 四個渲染點（RecordCard／PickupHeroCard／NavOverlay／Add 摘要卡）行為由各元件測試鎖定。
 */
import { describe, expect, it } from 'vitest';
import {
  formatPlateLabel,
  isPlateUnset,
  PLATE_UNSET_SENTINEL,
} from '@app/park-keeper/services/formatPlate';

describe('formatPlate - 未填車號 sentinel SSOT', () => {
  it('sentinel 固定為 N/A（儲存層佔位契約）', () => {
    expect(PLATE_UNSET_SENTINEL).toBe('N/A');
  });

  it('isPlateUnset 僅對 sentinel 回傳 true', () => {
    expect(isPlateUnset(PLATE_UNSET_SENTINEL)).toBe(true);
    expect(isPlateUnset('ABC-1234')).toBe(false);
    expect(isPlateUnset('')).toBe(false);
    // 近似值不得誤判（大小寫敏感）。
    expect(isPlateUnset('n/a')).toBe(false);
  });

  it('formatPlateLabel 未填時回傳待填文案，已填時回傳原車號', () => {
    expect(formatPlateLabel(PLATE_UNSET_SENTINEL, '未填車號')).toBe('未填車號');
    expect(formatPlateLabel('ABC-1234', '未填車號')).toBe('ABC-1234');
  });
});
