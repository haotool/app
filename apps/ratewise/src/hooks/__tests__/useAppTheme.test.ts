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

  it('commitCustomTheme 原子提交：切至 custom 並持久化主色＋背景調（E7 wave-B）', () => {
    const { result } = renderHook(() => useAppTheme());

    act(() => {
      result.current.commitCustomTheme('#14B8A6', 'warm');
    });

    expect(result.current.style).toBe('custom');
    expect(result.current.customPrimary).toBe('#14B8A6');
    expect(result.current.customBackgroundTone).toBe('warm');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      style?: string;
      customPrimary?: string;
      customBackgroundTone?: string;
    };
    expect(stored.style).toBe('custom');
    expect(stored.customPrimary).toBe('#14B8A6');
    expect(stored.customBackgroundTone).toBe('warm');
  });

  it('commitCustomTheme 拒絕無效 hex 或非 allowlist 背景調（狀態與儲存皆不變）', () => {
    const { result } = renderHook(() => useAppTheme());

    act(() => {
      result.current.commitCustomTheme('#FFF', 'pure');
    });
    act(() => {
      result.current.commitCustomTheme('#14B8A6', 'dark' as never);
    });

    expect(result.current.style).toBe('zen');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('customBackgroundTone 持久化：舊資料缺省回傳 pure（向後相容）', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ style: 'custom', customPrimary: '#FF6B6B' }),
    );

    const { result } = renderHook(() => useAppTheme());

    expect(result.current.customBackgroundTone).toBe('pure');
  });

  it('persisted customBackgroundTone 應原樣載入；無效值回退 pure', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ style: 'custom', customPrimary: '#FF6B6B', customBackgroundTone: 'warm' }),
    );
    const { result } = renderHook(() => useAppTheme());
    expect(result.current.customBackgroundTone).toBe('warm');

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ style: 'custom', customPrimary: '#FF6B6B', customBackgroundTone: 'dark' }),
    );
    const { result: invalid } = renderHook(() => useAppTheme());
    expect(invalid.current.customBackgroundTone).toBe('pure');
  });

  it('commitCustomTheme 寫入背景調對 inline 變數', () => {
    const { result } = renderHook(() => useAppTheme());

    act(() => {
      result.current.commitCustomTheme('#3182F6', 'cool');
    });

    expect(result.current.style).toBe('custom');
    expect(result.current.customBackgroundTone).toBe('cool');
    expect(document.documentElement.style.getPropertyValue('--color-background')).not.toBe('');
  });

  it('自 custom 切回內建主題：customPrimary 保留供再次啟用，inline 覆寫清除', () => {
    const { result } = renderHook(() => useAppTheme());

    act(() => {
      result.current.commitCustomTheme('#FF6B6B', 'pure');
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
