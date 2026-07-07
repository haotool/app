/**
 * useCustomThemeDraft - draft/取消語意守門（E7 wave-B，QA-I #5）
 *
 * 1. draft 期間：變更即時預覽（inline CSS 變數更新），但 theme config 與
 *    pre-paint 快取（FOUC）皆零寫入。
 * 2. 取消：DOM 回滾開啟前快照（含 CSS 變數），persist 依然零寫入。
 * 3. 關閉（commit）：單次原子持久化 draft 值＋寫入 pre-paint 快取。
 * 4. unmount 清理（PR #671 Blocking）：sheet 開啟中跳離路由 → 未 commit 的
 *    draft 回滾至快照且 persist 零寫入；commit 後 unmount 不得再回滾。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppTheme } from '../useAppTheme';
import { useCustomThemeDraft } from '../useCustomThemeDraft';
import { applyTheme, CUSTOM_THEME_VARS_CACHE_KEY } from '../../config/themes';
import { CUSTOM_THEME_CSS_VARS, deriveCustomThemeCssVars } from '../../config/custom-theme';

const STORAGE_KEY = 'ratewise-theme';

function useDraftHarness() {
  const appTheme = useAppTheme();
  const draft = useCustomThemeDraft({
    config: appTheme.config,
    commitCustomTheme: appTheme.commitCustomTheme,
  });
  return { appTheme, draft };
}

function inlineVar(name: string): string {
  return document.documentElement.style.getPropertyValue(name);
}

describe('useCustomThemeDraft - draft/取消語意（E7 wave-B）', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-style');
  });

  it('draft 變更即時預覽全站（CSS 變數更新）但 persist 零寫入（含 FOUC 快取）', () => {
    const { result } = renderHook(() => useDraftHarness());

    act(() => {
      result.current.draft.open();
    });
    act(() => {
      result.current.draft.selectPrimary('#FF6B6B');
    });
    act(() => {
      result.current.draft.selectTone('midnight');
    });

    // DOM 即時預覽：與演算 SSOT 一致。
    const expected = deriveCustomThemeCssVars('#FF6B6B', 'midnight');
    expect(document.documentElement.dataset['style']).toBe('custom');
    expect(inlineVar('--color-background')).toBe(expected['--color-background']);
    expect(inlineVar('--color-primary')).toBe('255 107 107');

    // persist 零寫入：theme config 與 pre-paint 快取皆未動。
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(CUSTOM_THEME_VARS_CACHE_KEY)).toBeNull();

    // committed config 不受 draft 影響。
    expect(result.current.appTheme.style).toBe('zen');
  });

  it('取消：全站回滾開啟前快照（CSS 變數清除）且 persist 零寫入', () => {
    const { result } = renderHook(() => useDraftHarness());

    act(() => {
      result.current.draft.open();
    });
    act(() => {
      result.current.draft.selectPrimary('#FF6B6B');
    });
    act(() => {
      result.current.draft.selectTone('graphite');
    });
    act(() => {
      result.current.draft.cancel();
    });

    // 快照為 zen：inline 覆寫全部清除、data-style 還原。
    expect(document.documentElement.dataset['style']).toBe('zen');
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(inlineVar(cssVar), `${cssVar} 應被清除`).toBe('');
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(CUSTOM_THEME_VARS_CACHE_KEY)).toBeNull();
    expect(result.current.draft.isOpen).toBe(false);
  });

  it('取消：既有 custom 使用者回滾到開啟前的主色＋背景調（快取不被 draft 汙染）', () => {
    // 先建立已 commit 的 custom 狀態（applyTheme 寫入快取）。
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ style: 'custom', customPrimary: '#14B8A6', customBackgroundTone: 'warm' }),
    );
    applyTheme({ style: 'custom', customPrimary: '#14B8A6', customBackgroundTone: 'warm' });
    const committedCache = localStorage.getItem(CUSTOM_THEME_VARS_CACHE_KEY);
    expect(committedCache).not.toBeNull();

    const { result } = renderHook(() => useDraftHarness());

    act(() => {
      result.current.draft.open();
    });
    act(() => {
      result.current.draft.selectPrimary('#FF6B6B');
    });

    // draft 期間快取維持 commit 時內容（未 commit 的 draft 不寫快取）。
    expect(localStorage.getItem(CUSTOM_THEME_VARS_CACHE_KEY)).toBe(committedCache);

    act(() => {
      result.current.draft.cancel();
    });

    const expected = deriveCustomThemeCssVars('#14B8A6', 'warm');
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(inlineVar(cssVar), cssVar).toBe(expected[cssVar]);
    });
    expect(localStorage.getItem(CUSTOM_THEME_VARS_CACHE_KEY)).toBe(committedCache);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
      style: 'custom',
      customPrimary: '#14B8A6',
      customBackgroundTone: 'warm',
    });
  });

  it('關閉 sheet（commit）：draft 值單次原子持久化並寫入 pre-paint 快取', () => {
    const { result } = renderHook(() => useDraftHarness());

    act(() => {
      result.current.draft.open();
    });
    act(() => {
      result.current.draft.selectPrimary('#FF6B6B');
    });
    act(() => {
      result.current.draft.selectTone('midnight');
    });
    act(() => {
      result.current.draft.commitClose();
    });

    expect(result.current.appTheme.style).toBe('custom');
    expect(result.current.appTheme.customPrimary).toBe('#FF6B6B');
    expect(result.current.appTheme.customBackgroundTone).toBe('midnight');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, string>;
    expect(stored['style']).toBe('custom');
    expect(stored['customPrimary']).toBe('#FF6B6B');
    expect(stored['customBackgroundTone']).toBe('midnight');

    const cache = JSON.parse(localStorage.getItem(CUSTOM_THEME_VARS_CACHE_KEY) ?? '{}') as {
      p?: string;
      t?: string;
    };
    expect(cache.p).toBe('#FF6B6B');
    expect(cache.t).toBe('midnight');
    expect(result.current.draft.isOpen).toBe(false);
  });

  it('discard：不 commit 不回滾（還原預設由外部 resetTheme 收尾）', () => {
    const { result } = renderHook(() => useDraftHarness());

    act(() => {
      result.current.draft.open();
    });
    act(() => {
      result.current.draft.selectPrimary('#FF6B6B');
    });
    act(() => {
      // 模擬「還原預設」：外部 resetTheme 提交 zen 後 discard 收尾。
      result.current.appTheme.resetTheme();
      result.current.draft.discard();
    });

    expect(result.current.draft.isOpen).toBe(false);
    expect(document.documentElement.dataset['style']).toBe('zen');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ style: 'zen' });
  });

  it('sheet 開啟中 unmount：未 commit 的 draft 回滾至開啟前快照且 persist 零寫入', () => {
    const { result, unmount } = renderHook(() => useDraftHarness());

    act(() => {
      result.current.draft.open();
    });
    act(() => {
      result.current.draft.selectPrimary('#FF6B6B');
    });
    act(() => {
      result.current.draft.selectTone('midnight');
    });

    unmount();

    // 快照為 zen：inline 覆寫全部清除、data-style 還原，draft 殘留零。
    expect(document.documentElement.dataset['style']).toBe('zen');
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(inlineVar(cssVar), `${cssVar} 應被清除`).toBe('');
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(CUSTOM_THEME_VARS_CACHE_KEY)).toBeNull();
  });

  it('sheet 開啟中 unmount：既有 custom 使用者回滾至開啟前主色＋背景調（快取不被汙染）', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ style: 'custom', customPrimary: '#14B8A6', customBackgroundTone: 'warm' }),
    );
    applyTheme({ style: 'custom', customPrimary: '#14B8A6', customBackgroundTone: 'warm' });
    const committedCache = localStorage.getItem(CUSTOM_THEME_VARS_CACHE_KEY);

    const { result, unmount } = renderHook(() => useDraftHarness());
    act(() => {
      result.current.draft.open();
    });
    act(() => {
      result.current.draft.selectPrimary('#FF6B6B');
    });

    unmount();

    const expected = deriveCustomThemeCssVars('#14B8A6', 'warm');
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(inlineVar(cssVar), cssVar).toBe(expected[cssVar]);
    });
    expect(localStorage.getItem(CUSTOM_THEME_VARS_CACHE_KEY)).toBe(committedCache);
  });

  it('commit 後 unmount：不再回滾（快照 guard），DOM 與持久化維持 commit 結果', () => {
    const { result, unmount } = renderHook(() => useDraftHarness());

    act(() => {
      result.current.draft.open();
    });
    act(() => {
      result.current.draft.selectPrimary('#FF6B6B');
    });
    act(() => {
      result.current.draft.selectTone('midnight');
    });
    act(() => {
      result.current.draft.commitClose();
    });

    unmount();

    const expected = deriveCustomThemeCssVars('#FF6B6B', 'midnight');
    expect(document.documentElement.dataset['style']).toBe('custom');
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(inlineVar(cssVar), cssVar).toBe(expected[cssVar]);
    });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, string>;
    expect(stored['style']).toBe('custom');
    expect(stored['customPrimary']).toBe('#FF6B6B');
    expect(stored['customBackgroundTone']).toBe('midnight');
  });

  it('open 以 committed config 播種 draft 值（既有 custom 使用者所見即當前主題）', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ style: 'custom', customPrimary: '#14B8A6', customBackgroundTone: 'cool' }),
    );
    const { result } = renderHook(() => useDraftHarness());

    act(() => {
      result.current.draft.open();
    });

    expect(result.current.draft.draftPrimary).toBe('#14B8A6');
    expect(result.current.draft.draftTone).toBe('cool');
  });
});
