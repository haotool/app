/**
 * applyTheme custom 覆寫層守門（E2）
 *
 * 1. style === 'custom'：演算全鍵 inline CSS 變數寫入 documentElement，theme-color meta 跟隨主色。
 * 2. 切回內建主題：inline 覆寫全部清除、meta 還原品牌藍（靜態 [data-style] 區塊接手）。
 * 3. customPrimary 缺失/無效：回退預設自訂主色，不得產生半套覆寫。
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { applyTheme, CUSTOM_THEME_VARS_CACHE_KEY } from '../themes';
import {
  CUSTOM_THEME_CSS_VARS,
  CUSTOM_THEME_DERIVE_VERSION,
  DEFAULT_CUSTOM_PRIMARY,
  deriveCustomThemeCssVars,
} from '../custom-theme';

function getMetaThemeColor(): string | null {
  return document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null;
}

describe('applyTheme - custom 覆寫層', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style');
    document.head.querySelector('meta[name="theme-color"]')?.remove();
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', '#3182F6');
    document.head.appendChild(meta);
  });

  it('custom 主題寫入演算全鍵 inline 變數且與演算 SSOT 一致', () => {
    applyTheme({ style: 'custom', customPrimary: '#FF6B6B' });

    const root = document.documentElement;
    expect(root.dataset['style']).toBe('custom');
    expect(root.classList.contains('font-sans')).toBe(true);

    const expected = deriveCustomThemeCssVars('#FF6B6B');
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(root.style.getPropertyValue(cssVar), cssVar).toBe(expected[cssVar]);
    });
    expect(getMetaThemeColor()).toBe('#FF6B6B');
  });

  it('切回內建主題清除全部 inline 覆寫並還原 theme-color', () => {
    applyTheme({ style: 'custom', customPrimary: '#FF6B6B' });
    applyTheme({ style: 'zen' });

    const root = document.documentElement;
    expect(root.dataset['style']).toBe('zen');
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(root.style.getPropertyValue(cssVar), `${cssVar} 應被清除`).toBe('');
    });
    expect(getMetaThemeColor()).toBe('#3182F6');
  });

  it('customPrimary 保留於 config 但 style 為內建主題時不產生覆寫', () => {
    applyTheme({ style: 'racing', customPrimary: '#FF6B6B' });

    const root = document.documentElement;
    expect(root.dataset['style']).toBe('racing');
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(root.style.getPropertyValue(cssVar)).toBe('');
    });
  });

  it('customBackgroundTone 寫入背景調對；缺省視為 pure（向後相容）', () => {
    applyTheme({ style: 'custom', customPrimary: '#FF6B6B', customBackgroundTone: 'warm' });
    const warm = deriveCustomThemeCssVars('#FF6B6B', 'warm');
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-background')).toBe(warm['--color-background']);
    expect(root.style.getPropertyValue('--color-surface-sunken')).toBe(
      warm['--color-surface-sunken'],
    );

    // 舊持久化資料無 customBackgroundTone → 與 pure 完全一致
    applyTheme({ style: 'custom', customPrimary: '#FF6B6B' });
    const pure = deriveCustomThemeCssVars('#FF6B6B', 'pure');
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(root.style.getPropertyValue(cssVar), cssVar).toBe(pure[cssVar]);
    });
  });

  it('切換背景調後切回內建主題：背景調 inline 覆寫零殘留', () => {
    applyTheme({ style: 'custom', customPrimary: '#FF6B6B', customBackgroundTone: 'cool' });
    applyTheme({ style: 'zen' });
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-background')).toBe('');
    expect(root.style.getPropertyValue('--color-surface-sunken')).toBe('');
  });

  it('深色背景調（E7 wave-A）寫入整套 neutral scale 覆寫且與演算 SSOT 一致', () => {
    applyTheme({ style: 'custom', customPrimary: '#FF6B6B', customBackgroundTone: 'midnight' });
    const expected = deriveCustomThemeCssVars('#FF6B6B', 'midnight');
    const root = document.documentElement;
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(root.style.getPropertyValue(cssVar), cssVar).toBe(expected[cssVar]);
    });
    expect(root.style.getPropertyValue('--color-background')).toBe('15 23 42');

    // 切回內建主題：深色覆寫零殘留
    applyTheme({ style: 'zen' });
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(root.style.getPropertyValue(cssVar), `${cssVar} 應被清除`).toBe('');
    });
  });

  it('custom 模式持久化 pre-paint 派生快取（#619）；切回內建主題清除', () => {
    applyTheme({ style: 'custom', customPrimary: '#FF6B6B', customBackgroundTone: 'graphite' });
    const raw = localStorage.getItem(CUSTOM_THEME_VARS_CACHE_KEY);
    expect(raw).not.toBeNull();
    const cache = JSON.parse(raw ?? '{}') as {
      p: string;
      t: string;
      v: number;
      m: Record<string, string>;
    };
    expect(cache.p).toBe('#FF6B6B');
    expect(cache.t).toBe('graphite');
    // derive 版本戳：演算改版即 bump，bootstrap 讀到舊版整包棄用
    expect(cache.v).toBe(CUSTOM_THEME_DERIVE_VERSION);
    expect(cache.m).toEqual(deriveCustomThemeCssVars('#FF6B6B', 'graphite'));
    // bootstrap 端格式 allowlist：全部值必須為 'R G B' 三元組，且 --color-primary 必須存在
    expect(cache.m['--color-primary']).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
    Object.values(cache.m).forEach((value) => {
      expect(value).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
    });

    applyTheme({ style: 'zen' });
    expect(localStorage.getItem(CUSTOM_THEME_VARS_CACHE_KEY)).toBeNull();
  });

  it('連續 tone hex（E7 wave-C）寫入派生覆寫且 pre-paint 快取簽章帶 hex tone', () => {
    applyTheme({ style: 'custom', customPrimary: '#FF6B6B', customBackgroundTone: '#10141A' });
    const expected = deriveCustomThemeCssVars('#FF6B6B', '#10141A');
    const root = document.documentElement;
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(root.style.getPropertyValue(cssVar), cssVar).toBe(expected[cssVar]);
    });

    // FOUC 快取簽章：t 欄位為 hex tone（bootstrap g() 已接受 #RRGGBB）；舊 enum 快取機制不變。
    const cache = JSON.parse(localStorage.getItem(CUSTOM_THEME_VARS_CACHE_KEY) ?? '{}') as {
      p: string;
      t: string;
      v: number;
      m: Record<string, string>;
    };
    expect(cache.p).toBe('#FF6B6B');
    expect(cache.t).toBe('#10141A');
    expect(cache.v).toBe(CUSTOM_THEME_DERIVE_VERSION);
    expect(cache.m).toEqual(expected);

    applyTheme({ style: 'zen' });
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => {
      expect(root.style.getPropertyValue(cssVar), `${cssVar} 應被清除`).toBe('');
    });
  });

  it('customPrimary 缺失或無效時回退預設自訂主色', () => {
    applyTheme({ style: 'custom' });
    const expected = deriveCustomThemeCssVars(DEFAULT_CUSTOM_PRIMARY);
    expect(document.documentElement.style.getPropertyValue('--color-primary-strong')).toBe(
      expected['--color-primary-strong'],
    );
    expect(getMetaThemeColor()).toBe(DEFAULT_CUSTOM_PRIMARY);

    applyTheme({ style: 'custom', customPrimary: 'javascript:alert(1)' });
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe(
      expected['--color-primary'],
    );
  });
});
