/**
 * useDeepLinkSEO 單元測試
 *
 * TDD RED → GREEN 流程。
 * 驗證：有效 deep-link 參數時回傳動態 SEO，否則回傳 null。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDeepLinkSEO } from '../useDeepLinkSEO';

// 模擬 react-router-dom 的 useSearchParams
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams],
}));

function setParams(params: Record<string, string>) {
  // 清空再設置
  for (const key of [...mockSearchParams.keys()]) {
    mockSearchParams.delete(key);
  }
  for (const [key, value] of Object.entries(params)) {
    mockSearchParams.set(key, value);
  }
}

const SITE_URL = 'https://app.haotool.org/ratewise/';

describe('useDeepLinkSEO', () => {
  beforeEach(() => {
    setParams({});
  });

  describe('無 deep-link 參數', () => {
    it('應回傳 null（無效化 deep-link SEO）', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current).toBeNull();
    });

    it('僅有 amount 時應回傳 null', () => {
      setParams({ amount: '500' });
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current).toBeNull();
    });

    it('amount 為 0 時應回傳 null', () => {
      setParams({ amount: '0', from: 'USD', to: 'TWD' });
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current).toBeNull();
    });

    it('amount 為負數時應回傳 null', () => {
      setParams({ amount: '-100', from: 'USD', to: 'TWD' });
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current).toBeNull();
    });

    it('from 為無效幣別時應回傳 null', () => {
      setParams({ amount: '100', from: 'XYZ', to: 'TWD' });
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current).toBeNull();
    });

    it('to 為無效幣別時應回傳 null', () => {
      setParams({ amount: '100', from: 'USD', to: 'XYZ' });
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current).toBeNull();
    });
  });

  describe('有效 deep-link 參數（USD → TWD）', () => {
    beforeEach(() => {
      setParams({ amount: '500', from: 'USD', to: 'TWD' });
    });

    it('應回傳非 null 物件', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current).not.toBeNull();
    });

    it('title 應包含 amount、from、to 貨幣代碼', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current?.title).toContain('500');
      expect(result.current?.title).toContain('USD');
      expect(result.current?.title).toContain('TWD');
    });

    it('title 應包含中文貨幣名稱', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      // 美元
      expect(result.current?.title).toContain('美元');
    });

    it('title 應包含品牌名稱', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current?.title).toContain('RateWise');
    });

    it('description 應描述換算情境', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current?.description).toContain('500');
      expect(result.current?.description).toContain('USD');
      expect(result.current?.description).toContain('TWD');
    });

    it('canonical 應包含完整 query string', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current?.canonical).toContain('?');
      expect(result.current?.canonical).toContain('amount=500');
      expect(result.current?.canonical).toContain('from=USD');
      expect(result.current?.canonical).toContain('to=TWD');
    });

    it('canonical 應以正確的 site URL 為前綴', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current?.canonical).toContain(SITE_URL);
    });
  });

  describe('有效 deep-link 參數（JPY → TWD）', () => {
    beforeEach(() => {
      setParams({ amount: '10000', from: 'JPY', to: 'TWD' });
    });

    it('title 應包含日圓名稱', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current?.title).toContain('日圓');
    });

    it('description 應包含 10000 和 JPY', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current?.description).toContain('10,000');
      expect(result.current?.description).toContain('JPY');
    });
  });

  describe('TWD → USD 方向', () => {
    beforeEach(() => {
      setParams({ amount: '30000', from: 'TWD', to: 'USD' });
    });

    it('應回傳非 null 物件', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current).not.toBeNull();
    });

    it('title 應包含新台幣名稱', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current?.title).toContain('新台幣');
    });
  });

  describe('返回值結構', () => {
    beforeEach(() => {
      setParams({ amount: '100', from: 'EUR', to: 'TWD' });
    });

    it('應有 title、description、canonical 三個欄位', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current).toHaveProperty('title');
      expect(result.current).toHaveProperty('description');
      expect(result.current).toHaveProperty('canonical');
    });

    it('title 長度應在合理範圍（≤80 字元）', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current?.title.length).toBeLessThanOrEqual(80);
    });

    it('description 長度應在合理範圍（≤160 字元）', () => {
      const { result } = renderHook(() => useDeepLinkSEO());
      expect(result.current?.description.length).toBeLessThanOrEqual(160);
    });
  });
});
