export const spacingTokens = {
  /** 基礎單位 (4px) */
  base: 4,

  /** 間距比例表 */
  scale: {
    /** 4px - 極小間距 (圖標與文字間) */
    xs: { px: 4, rem: '0.25rem', class: '1' },
    /** 8px - 小間距 (元素內部) */
    sm: { px: 8, rem: '0.5rem', class: '2' },
    /** 12px - 中小間距 */
    'md-sm': { px: 12, rem: '0.75rem', class: '3' },
    /** 16px - 中間距 (卡片內距、按鈕間距) */
    md: { px: 16, rem: '1rem', class: '4' },
    /** 20px - 中大間距 */
    'md-lg': { px: 20, rem: '1.25rem', class: '5' },
    /** 24px - 大間距 (區塊間距) */
    lg: { px: 24, rem: '1.5rem', class: '6' },
    /** 32px - 超大間距 (主要區塊間) */
    xl: { px: 32, rem: '2rem', class: '8' },
    /** 48px - 2倍超大間距 */
    '2xl': { px: 48, rem: '3rem', class: '12' },
    /** 64px - 3倍超大間距 (頁面區段間) */
    '3xl': { px: 64, rem: '4rem', class: '16' },
  },

  /** 常用組合 - 直接複製使用 */
  patterns: {
    /** 卡片內距 */
    cardPadding: 'p-4', // 16px
    /** 區塊間距 */
    sectionGap: 'gap-6', // 24px
    /** 列表項目間距 */
    listGap: 'gap-3', // 12px
    /** 表單欄位間距 */
    formGap: 'gap-4', // 16px
    /** 按鈕組間距 */
    buttonGroupGap: 'gap-2', // 8px
    /** 頁面水平內距 */
    pageHorizontal: 'px-5', // 20px
    /** 頁面垂直內距 */
    pageVertical: 'py-6', // 24px
  },
} as const;

/**
 * 字型設計規範 (SSOT)
 *
 * 統一應用程式字型系統，確保視覺層次與可讀性。
 * 基於 Tailwind CSS 字型比例，針對中英文混排優化。
 *
 * 設計原理：
 * - 字型家族：Inter (英文) + Noto Sans TC (中文) + system-ui
 * - 字重系統：regular(400), medium(500), semibold(600), bold(700), black(900)
 * - 行高優化：緊湊(1.25)、標準(1.5)、寬鬆(1.75)
 *
 * @reference Tailwind CSS Typography
 * @see https://tailwindcss.com/docs/font-size
 * @created 2026-01-25
 * @version 1.0.0
 */
export const typographyTokens = {
  /** 字型家族 */
  fontFamily: {
    sans: ['Inter', '"Noto Sans TC"', 'system-ui', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
  },

  /** 字型大小比例表（E1 字階下限 12px：全站禁止 <12px 文字） */
  fontSize: {
    /** 12px - 極小標籤（字階下限；原 10px 已升級） */
    '2xs': { size: '0.75rem', lineHeight: '1rem', class: 'text-2xs' },
    /** 12px - 小標籤、說明文字 */
    xs: { size: '0.75rem', lineHeight: '1rem', class: 'text-xs' },
    /** 14px - 次要內容 */
    sm: { size: '0.875rem', lineHeight: '1.25rem', class: 'text-sm' },
    /** 16px - 正文 */
    base: { size: '1rem', lineHeight: '1.5rem', class: 'text-base' },
    /** 18px - 大正文 */
    lg: { size: '1.125rem', lineHeight: '1.75rem', class: 'text-lg' },
    /** 20px - 小標題 */
    xl: { size: '1.25rem', lineHeight: '1.75rem', class: 'text-xl' },
    /** 24px - 標題 */
    '2xl': { size: '1.5rem', lineHeight: '2rem', class: 'text-2xl' },
    /** 30px - 大標題 */
    '3xl': { size: '1.875rem', lineHeight: '2.25rem', class: 'text-3xl' },
    /** 36px - 超大標題 */
    '4xl': { size: '2.25rem', lineHeight: '2.5rem', class: 'text-4xl' },
    /** 48px - 巨大標題 (Hero) */
    '5xl': { size: '3rem', lineHeight: '1', class: 'text-5xl' },
  },

  /** 字重 */
  fontWeight: {
    regular: { value: 400, class: 'font-normal' },
    medium: { value: 500, class: 'font-medium' },
    semibold: { value: 600, class: 'font-semibold' },
    bold: { value: 700, class: 'font-bold' },
    black: { value: 900, class: 'font-black' },
  },

  /** 行高 */
  lineHeight: {
    tight: { value: 1.25, class: 'leading-tight' },
    normal: { value: 1.5, class: 'leading-normal' },
    relaxed: { value: 1.75, class: 'leading-relaxed' },
  },

  /** 常用組合 - 直接複製使用 */
  patterns: {
    /** 頁面標題 (H1) */
    pageTitle: 'text-2xl font-bold leading-tight',
    /** 區塊標題 (H2) */
    sectionTitle: 'text-xl font-semibold leading-tight',
    /** 卡片標題 (H3) */
    cardTitle: 'text-lg font-semibold',
    /** 正文 */
    body: 'text-base font-normal leading-normal',
    /** 次要文字 */
    secondary: 'text-sm text-foreground-secondary',
    /** 小標籤 */
    label: 'text-xs font-medium uppercase tracking-wide',
    /** 數值顯示 (匯率、金額) */
    numeric: 'text-2xl font-bold tabular-nums',
    /** 小數值 */
    numericSmall: 'text-lg font-semibold tabular-nums',
  },
} as const;

/**
 * 8 級字階 SSOT（E1 收斂）
 *
 * 全站文字尺寸只允許此 8 級；micro（12px）為硬下限，禁止任意值 <12px。
 * 數字一律搭配 tabular-nums（typographyTokens.patterns.numeric*）。
 */
export const typeScaleTokens = {
  /** 字階硬下限（px） */
  minFontSizePx: 12,
  levels: {
    /** 32px - 主金額 Display */
    display: { px: 32, class: 'text-[32px]' },
    /** 28px - 次金額 Display */
    displaySm: { px: 28, class: 'text-[28px]' },
    /** 24px - 頁面標題 */
    title: { px: 24, class: 'text-2xl' },
    /** 20px - 區塊標題 */
    heading: { px: 20, class: 'text-xl' },
    /** 16px - 正文 */
    body: { px: 16, class: 'text-base' },
    /** 14px - 次要內容 */
    secondary: { px: 14, class: 'text-sm' },
    /** 12px - 說明文字 */
    caption: { px: 12, class: 'text-xs' },
    /** 12px - 極小標籤（下限） */
    micro: { px: 12, class: 'text-2xs' },
  },
} as const;

/**
 * RWD 斷點設計規範 (SSOT)
 *
 * 統一應用程式響應式斷點策略，採用 Mobile-First 設計。
 * 與 Tailwind CSS 預設斷點對齊，確保一致性。
 *
 * 設計原理：
 * - Mobile-First：預設樣式為行動裝置，使用 min-width 向上擴展
 * - 斷點選擇：基於常見裝置寬度，非任意數值
 * - 內容優先：斷點位置取決於內容需求，而非特定裝置
 * - 高度斷點：支援小螢幕裝置 (iPhone SE/8) 的垂直空間優化
 *
 * @reference Tailwind CSS Responsive Design
 * @see https://tailwindcss.com/docs/responsive-design
 * @created 2026-01-25
 * @updated 2026-01-28 - 調整高度斷點隱藏優先順序
 * @version 1.2.1
 */
export const breakpointTokens = {
  /**
   * 斷點定義
   *
   * ## 寬度斷點 (min-width)
   *
   * 標準 Tailwind 斷點配置，適用於水平響應式設計。
   *
   * ## 高度斷點 (max-height)
   *
   * 針對 iOS PWA 用戶優化的垂直響應式設計。
   * 斷點值基於 2025 年主流 iPhone 視口高度統計。
   *
   * | 斷點    | 觸發條件   | 目標裝置                |
   * |---------|------------|------------------------|
   * | tall    | ≥761px     | iPhone 16 Pro+ 系列     |
   * | compact | ≤760px     | iPhone 16/15 標準版     |
   * | short   | ≤700px     | 較舊機型 / 小型裝置     |
   * | tiny    | ≤650px     | 接近 iPhone SE 2022     |
   * | micro   | ≤600px     | iPhone SE 原版區間      |
   * | nano    | ≤560px     | 極小螢幕 / 特殊情境     |
   */
  screens: {
    /* ─────────────────────────────────────────────────────────────
     * 寬度斷點 (Tailwind 標準)
     * ───────────────────────────────────────────────────────────── */

    /** 640px - 大型手機 / 小平板 (橫向) */
    sm: { min: '640px', max: '767px', class: 'sm:' },

    /** 768px - 平板 (直向) */
    md: { min: '768px', max: '1023px', class: 'md:' },

    /** 1024px - 平板 (橫向) / 小筆電 */
    lg: { min: '1024px', max: '1279px', class: 'lg:' },

    /** 1280px - 筆電 / 桌機 */
    xl: { min: '1280px', max: '1535px', class: 'xl:' },

    /** 1536px - 大螢幕桌機 */
    '2xl': { min: '1536px', max: null, class: '2xl:' },

    /* ─────────────────────────────────────────────────────────────
     * 高度斷點 (iOS PWA 優化)
     * ───────────────────────────────────────────────────────────── */

    /** 中短螢幕 - iPhone 16/15 標準版以下 */
    compact: { raw: '(max-height: 760px)', class: 'compact:' },

    /** 短螢幕 - 較舊機型，快速金額(來源)開始隱藏 */
    short: { raw: '(max-height: 700px)', class: 'short:' },

    /** 極短螢幕 - 接近 iPhone SE 2022 (667px)，快速金額(結果)隱藏 */
    tiny: { raw: '(max-height: 650px)', class: 'tiny:' },

    /** 超短螢幕 - iPhone SE 原版區間，交換按鈕隱藏 */
    micro: { raw: '(max-height: 600px)', class: 'micro:' },

    /** 最小螢幕 - 極端情境，資料來源隱藏（最後） */
    nano: { raw: '(max-height: 560px)', class: 'nano:' },

    /** 長螢幕 - 完整顯示所有元素 */
    tall: { raw: '(min-height: 761px)', class: 'tall:' },

    /* ─────────────────────────────────────────────────────────────
     * 極窄寬度斷點（RateSelector pills 梯次；repo screens 為 object 格式，
     * Tailwind 的 max-[...] 任意變體不會產出，必須用 raw 斷點）
     * ───────────────────────────────────────────────────────────── */

    /** 極窄寬度第 1 級 - pills icon 隱藏留文字 */
    narrow: { raw: '(max-width: 349px)', class: 'narrow:' },

    /** 極窄寬度第 2 級 - pills 內距收斂至最小 */
    xnarrow: { raw: '(max-width: 329px)', class: 'xnarrow:' },
  },

  /** 容器最大寬度 */
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  /** 常用響應式模式 */
  patterns: {
    /** 隱藏於行動裝置，桌面顯示 */
    desktopOnly: 'hidden md:block',
    /** 顯示於行動裝置，桌面隱藏 */
    mobileOnly: 'block md:hidden',
    /** 響應式網格 (1→2→3→4 欄) */
    responsiveGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    /** 響應式 Flex (堆疊→並排) */
    responsiveFlex: 'flex flex-col md:flex-row',
    /** 響應式文字 (小→中→大) */
    responsiveText: 'text-sm md:text-base lg:text-lg',
    /** 響應式間距 (小→中→大) */
    responsiveSpacing: 'p-4 md:p-6 lg:p-8',

    /** 短螢幕隱藏（高度 ≤700px） */
    shortHidden: 'short:hidden',
    /** 極短螢幕隱藏（高度 ≤620px） */
    tinyHidden: 'tiny:hidden',
    /** 超短螢幕隱藏（高度 ≤580px） */
    microHidden: 'micro:hidden',
    /** 最小螢幕隱藏（高度 ≤540px） */
    nanoHidden: 'nano:hidden',
    /** 正常螢幕才顯示（高度 >600px） */
    tallOnly: 'hidden tall:flex',
  },

  /** 媒體查詢輔助函數 */
  mediaQueries: {
    /** 手機 (<640px) */
    mobile: '@media (max-width: 639px)',
    /** 平板以上 (≥768px) */
    tablet: '@media (min-width: 768px)',
    /** 桌面以上 (≥1024px) */
    desktop: '@media (min-width: 1024px)',
    /** 觸控裝置 */
    touch: '@media (hover: none) and (pointer: coarse)',
    /** 滑鼠裝置 */
    pointer: '@media (hover: hover) and (pointer: fine)',
    /** 減少動畫偏好 */
    reducedMotion: '@media (prefers-reduced-motion: reduce)',
  },
} as const;

/**
 * Radius Design Tokens (SSOT) - E1 三級制收斂
 *
 * 全站圓角收斂為三個實值（＋pill full）：容器 20px、卡片/面板 16px、控件 12px。
 * Tailwind scale 別名（sm~4xl）一律映射到三級值，確保舊 class 不產生第四種圓角。
 * 守門：design-tokens.test 斷言 distinct 值恰為三個。
 */
export const radiusTokens = {
  values: {
    card: '1.25rem',
    panel: '1rem',
    control: '0.75rem',
    icon: '0.75rem',
    compact: '0.75rem',
    full: '9999px',
    '4xl': '1.25rem',
    '3xl': '1.25rem',
    '2xl': '1rem',
    xl: '0.75rem',
    lg: '0.75rem',
    md: '0.75rem',
    sm: '0.75rem',
  },
  className: {
    card: 'rounded-card',
    panel: 'rounded-panel',
    control: 'rounded-control',
    icon: 'rounded-icon',
    compact: 'rounded-compact',
    full: 'rounded-full',
  },
} as const;

/**
 * Shadow Design Tokens (SSOT) - E1 二級制收斂
 *
 * 抬升層次交給 hairline border（1px --color-border）與 surface 層差；
 * 陰影僅保留兩級極淡單層中性值（rest/raised），裝飾性彩色陰影清零。
 * Tailwind 的 sm/md/lg/xl 與語義別名全部映射到 rest/raised 其中之一。
 * 守門：design-tokens.test 斷言 distinct 值恰為兩個且不含 --color-primary。
 */
const SHADOW_REST = '0 1px 3px 0 rgb(15 23 42 / 0.06)';
const SHADOW_RAISED = '0 8px 24px -12px rgb(15 23 42 / 0.14)';

export const shadowTokens = {
  values: {
    card: SHADOW_REST,
    cardHover: SHADOW_RAISED,
    soft: SHADOW_REST,
    floating: SHADOW_RAISED,
    brand: SHADOW_RAISED,
    sm: SHADOW_REST,
    md: SHADOW_REST,
    lg: SHADOW_RAISED,
    xl: SHADOW_RAISED,
  },
  className: {
    card: 'shadow-card',
    cardHover: 'hover:shadow-card-hover',
    soft: 'shadow-soft',
    floating: 'shadow-floating',
    brand: 'shadow-brand',
  },
} as const;
