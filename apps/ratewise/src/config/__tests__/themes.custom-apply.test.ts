/**
 * applyTheme custom 覆寫層守門（E2）
 *
 * 1. style === 'custom'：14 鍵 inline CSS 變數寫入 documentElement，theme-color meta 跟隨主色。
 * 2. 切回內建主題：inline 覆寫全部清除、meta 還原品牌藍（靜態 [data-style] 區塊接手）。
 * 3. customPrimary 缺失/無效：回退預設自訂主色，不得產生半套覆寫。
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { applyTheme } from '../themes';
import {
  CUSTOM_THEME_CSS_VARS,
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

  it('custom 主題寫入全部 14 鍵 inline 變數且與演算 SSOT 一致', () => {
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
