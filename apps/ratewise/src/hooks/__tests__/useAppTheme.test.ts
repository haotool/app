/**
 * useAppTheme Hook - Unit Tests
 * @file useAppTheme.test.ts
 * @description Plan 014：驗證持久化 legacy 風格值（'ocean'）無感遷移為 'racing'
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppTheme } from '../useAppTheme';

const STORAGE_KEY = 'ratewise-theme';

describe('useAppTheme - legacy 風格遷移', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persisted 舊值 "ocean" 載入後應遷移為 "racing"', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ style: 'ocean' }));

    const { result } = renderHook(() => useAppTheme());

    expect(result.current.style).toBe('racing');
  });

  it('遷移後應回寫 localStorage，後續讀取不再依賴遷移對映', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ style: 'ocean' }));

    renderHook(() => useAppTheme());

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as { style?: string };
    expect(stored.style).toBe('racing');
  });

  it('persisted 現行值（如 "nitro"）不受遷移對映影響', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ style: 'nitro' }));

    const { result } = renderHook(() => useAppTheme());

    expect(result.current.style).toBe('nitro');
  });

  it('無 persisted 值時使用預設風格 "zen"', () => {
    const { result } = renderHook(() => useAppTheme());

    expect(result.current.style).toBe('zen');
  });
});

describe('useAppTheme - custom 主題持久化（E2）', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persisted { style: "custom", customPrimary } 應原樣載入', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ style: 'custom', customPrimary: '#FF6B6B' }),
    );

    const { result } = renderHook(() => useAppTheme());

    expect(result.current.style).toBe('custom');
    expect(result.current.customPrimary).toBe('#FF6B6B');
  });

  it('style 為 custom 但 customPrimary 無效時回退預設自訂主色', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ style: 'custom', customPrimary: 'javascript:alert(1)' }),
    );

    const { result } = renderHook(() => useAppTheme());

    expect(result.current.style).toBe('custom');
    expect(result.current.customPrimary).toBe('#3182F6');
  });

  it('setCustomPrimary 即選即用：切至 custom 並持久化主色', () => {
    const { result } = renderHook(() => useAppTheme());

    act(() => {
      result.current.setCustomPrimary('#14B8A6');
    });

    expect(result.current.style).toBe('custom');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      style?: string;
      customPrimary?: string;
    };
    expect(stored.style).toBe('custom');
    expect(stored.customPrimary).toBe('#14B8A6');
  });

  it('setCustomPrimary 拒絕無效 hex（狀態與儲存皆不變）', () => {
    const { result } = renderHook(() => useAppTheme());

    act(() => {
      result.current.setCustomPrimary('#FFF');
    });

    expect(result.current.style).toBe('zen');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('自 custom 切回內建主題：customPrimary 保留供再次啟用，inline 覆寫清除', () => {
    const { result } = renderHook(() => useAppTheme());

    act(() => {
      result.current.setCustomPrimary('#FF6B6B');
    });
    act(() => {
      result.current.setStyle('zen');
    });

    expect(result.current.style).toBe('zen');
    expect(result.current.customPrimary).toBe('#FF6B6B');
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('');

    act(() => {
      result.current.setStyle('custom');
    });
    expect(result.current.customPrimary).toBe('#FF6B6B');
    expect(document.documentElement.style.getPropertyValue('--color-primary')).not.toBe('');
  });
});
