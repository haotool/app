/**
 * Theme Consistency Test
 *
 * 守門對象：`semanticColors`（JS → CSS 變數的映射合約，Plan 018）。
 * 每個 token 值必須是 `rgb(var(--color-...) / <alpha-value>)` 格式，
 * 確保 Tailwind 類經 CSS 變數解析、主題切換可在 runtime 生效。
 *
 * 分工：本測試守 JS→CSS 變數格式；
 * `theme-css-var-parity.test.ts` 守 `index.css` 各主題區塊的鍵集合一致性。
 */

import { describe, it, expect } from 'vitest';
import { semanticColors, generateTailwindThemeExtension } from '../design-tokens';

/** 展平 semanticColors 為 [色系, token 名, 值] 列表 */
const flattenedTokens = Object.entries(semanticColors).flatMap(([group, tokens]) =>
  Object.entries(tokens).map(([token, value]) => ({ group, token, value: value as string })),
);

/** CSS 變數格式合約：rgb(var(--color-X) / <alpha-value>) */
const CSS_VAR_PATTERN = /^rgb\(var\(--color-[\w-]+\) \/ <alpha-value>\)$/;

describe('Theme Consistency（semanticColors → CSS 變數格式合約）', () => {
  it('semanticColors 至少涵蓋核心色系', () => {
    expect(Object.keys(semanticColors)).toEqual(
      expect.arrayContaining([
        'neutral',
        'primary',
        'danger',
        'success',
        'highlight',
        'favorite',
        'warning',
        'brand',
        'footer',
      ]),
    );
  });

  it.each(flattenedTokens)('$group.$token 必須是 CSS 變數格式', ({ group, token, value }) => {
    expect(
      value,
      `semanticColors.${group}.${token} 必須符合 rgb(var(--color-...) / <alpha-value>) 格式`,
    ).toMatch(CSS_VAR_PATTERN);
  });

  describe('generateTailwindThemeExtension()', () => {
    it('包含全部 semanticColors 色系且可直接用於 tailwind.config.ts', () => {
      const themeConfig = generateTailwindThemeExtension();
      expect(themeConfig?.extend?.colors).toBeDefined();
      for (const group of Object.keys(semanticColors)) {
        expect(themeConfig?.extend?.colors).toHaveProperty(group);
      }
    });
  });
});
