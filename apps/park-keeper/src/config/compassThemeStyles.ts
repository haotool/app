import type { ThemeType } from '@app/park-keeper/types';

// ---------------------------------------------------------------------------
// 羅盤主題差異化樣式參數（brief：Nitro 霓虹描邊／Kawaii 粉彩圓潤／Zen 細線極簡／Classic 銅色調）
// 自 NavOverlay 純搬移抽出（issue #725 千行檔拆分），參數零變更。
// ---------------------------------------------------------------------------
export interface CompassThemeStyle {
  /** 刻度線寬係數。 */
  tickWidthScale: number;
  /** 刻度端點形狀（Kawaii 圓頭）。 */
  tickLinecap: 'round' | 'butt';
  /** 外環線寬。 */
  outerRingWidth: number;
  /** 外環不透明度。 */
  outerRingOpacity: number;
  /** 盤面霓虹光暈（SVG drop-shadow filter 強度，0 = 無）。 */
  neonGlowRadius: number;
  /** 楔形未對準時不透明度。 */
  wedgeIdleOpacity: number;
}

export const COMPASS_THEME_STYLES: Record<ThemeType, CompassThemeStyle> = {
  racing: {
    tickWidthScale: 1,
    tickLinecap: 'butt',
    outerRingWidth: 1.6,
    outerRingOpacity: 0.55,
    neonGlowRadius: 6,
    wedgeIdleOpacity: 0.4,
  },
  cute: {
    tickWidthScale: 1.5,
    tickLinecap: 'round',
    outerRingWidth: 2.5,
    outerRingOpacity: 0.25,
    neonGlowRadius: 0,
    // 粉彩 primary 飽和度低，楔形 idle 提高補償可見度。
    wedgeIdleOpacity: 0.65,
  },
  minimalist: {
    tickWidthScale: 0.8,
    tickLinecap: 'butt',
    outerRingWidth: 0.8,
    outerRingOpacity: 0.14,
    neonGlowRadius: 0,
    wedgeIdleOpacity: 0.32,
  },
  literary: {
    tickWidthScale: 1.1,
    tickLinecap: 'butt',
    outerRingWidth: 2,
    outerRingOpacity: 0.35,
    neonGlowRadius: 0,
    wedgeIdleOpacity: 0.38,
  },
};
