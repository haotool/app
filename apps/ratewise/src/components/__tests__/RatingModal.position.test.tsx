/**
 * RatingModal 定位與觸控目標回歸測試
 *
 * 背景：RatingModal 曾因未設定 --notification-mobile-top-offset CSS 變數，
 * 行動版 top 退化為 auto，整個星評 Modal 掉出視口（PWA 使用者完全看不到）。
 * 此測試守門：
 * 1. 消費 notificationTokens.position 的元件必須套用 notificationMobilePositionStyle
 * 2. token 本身必須保留 CSS 變數 fallback，避免同類回歸
 * 3. 星星按鈕觸控目標 ≥ 44px（WCAG 2.5.5）
 */
import { describe, it, expect } from 'vitest';
import {
  notificationTokens,
  notificationMobilePositionStyle,
  zIndexTokens,
} from '../../config/design-tokens';

async function readRatingModalSource(): Promise<string> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  return fs.readFile(path.resolve(__dirname, '../RatingModal.tsx'), 'utf-8');
}

describe('RatingModal - 行動版定位（防遮蔽回歸）', () => {
  it('必須套用 notificationMobilePositionStyle 設定 CSS 變數', async () => {
    const source = await readRatingModalSource();
    expect(source).toContain('notificationMobilePositionStyle');
    expect(source).toMatch(/style=\{notificationMobilePositionStyle( as MotionStyle)?\}/);
  });

  it('position token 必須含 CSS 變數 fallback，漏設時仍落在 header 下方', () => {
    expect(notificationTokens.position).toContain(
      'top-[var(--notification-mobile-top-offset,calc(64px+env(safe-area-inset-top,0px)))]',
    );
  });

  it('notificationMobilePositionStyle 必須輸出與 token 一致的偏移值', () => {
    expect(notificationMobilePositionStyle['--notification-mobile-top-offset']).toBe(
      notificationTokens.mobileTopOffset,
    );
  });

  it('z-index 必須來自 zIndexTokens scale', () => {
    expect(notificationTokens.position).toContain(zIndexTokens.notification);
    expect(notificationTokens.positionTop).toContain(zIndexTokens.overlay);
  });
});

describe('RatingModal - 觸控目標（WCAG 2.5.5）', () => {
  it('星星按鈕觸控目標必須為 44px（w-11 h-11）', async () => {
    const source = await readRatingModalSource();
    expect(source).toContain('w-11 h-11');
    expect(source).not.toContain('w-8 h-8 flex items-center justify-center rounded');
  });

  it('不得使用 emoji 作為 icon（改用 SVG）', async () => {
    const source = await readRatingModalSource();
    expect(source).not.toContain('🎉');
  });
});
