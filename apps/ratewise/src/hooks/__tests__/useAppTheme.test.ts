/**
 * useAppTheme Hook - Unit Tests
 * @file useAppTheme.test.ts
 * @description Plan 014：驗證持久化 legacy 風格值（'ocean'）無感遷移為 'racing'
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
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
