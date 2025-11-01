/**
 * Design Tokens - Q版便便記錄器
 *
 * 基於 Material Design 3 色彩系統
 * 所有顏色值以 RGB 格式定義,支援 Tailwind CSS alpha 調整
 */

export const designTokens = {
  light: {
    primary: '109 76 65',        // #6D4C41
    onPrimary: '255 255 255',
    primaryContainer: '243 233 227',
    onPrimaryContainer: '78 52 46',
    surface: '255 251 246',
    surfaceAlt: '255 246 236',
    onSurface: '44 44 44',
    onSurfaceVariant: '107 107 107',
    outline: '229 218 210',
    error: '179 38 30',
    onError: '255 255 255',
  },
  dark: {
    primary: '215 204 200',
    onPrimary: '62 39 35',
    primaryContainer: '62 47 42',
    onPrimaryContainer: '243 233 227',
    surface: '26 21 19',
    surfaceAlt: '34 26 24',
    onSurface: '236 223 219',
    onSurfaceVariant: '185 175 170',
    outline: '62 51 47',
    error: '255 180 171',
    onError: '105 0 5',
  },
} as const;

export type ThemeMode = 'light' | 'dark';

/**
 * 將 RGB 字串轉換為完整的 rgb() CSS 值
 */
export function rgbToCSS(rgb: string, alpha?: number): string {
  const alphaValue = alpha !== undefined ? ` / ${alpha}` : '';
  return `rgb(${rgb}${alphaValue})`;
}

/**
 * 獲取指定主題的顏色值
 */
export function getColorValue(
  theme: ThemeMode,
  color: keyof typeof designTokens.light
): string {
  return designTokens[theme][color];
}

/**
 * 轉換為 Tailwind 使用的格式
 */
export function toTailwindColor(rgb: string): string {
  return `rgb(${rgb})`;
}
