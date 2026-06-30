export const navigationTokens = {
  /**
   * Header Configuration
   * Compact header inspired by Threads/Instagram design language
   */
  header: {
    /** Total header height in pixels (excluding safe area) */
    height: 48,
    /** CSS value including safe area for notched devices */
    heightWithSafeArea: 'calc(48px + env(safe-area-inset-top, 0px))',
    /** Tailwind class for header height */
    heightClass: 'h-12',
    /** Logo dimensions */
    logo: {
      size: 28,
      sizeClass: 'w-7 h-7',
    },
    /** Title typography */
    title: {
      fontSize: 'text-xl',
      fontWeight: 'font-black',
    },
    /** Padding values */
    padding: {
      horizontal: 16,
      vertical: 8,
      class: 'px-4 py-2',
    },
  },

  /**
   * Bottom Navigation Configuration
   * Balanced design between iOS Tab Bar (49pt) and Material Navigation Bar (56dp)
   */
  bottomNav: {
    /** 主滾動區 scroll-padding-bottom（nav 56px + 1px 緩衝，L05/L06） */
    scrollPaddingBottom: 57,

    /** Total bottom nav height in pixels (excluding safe area) */
    height: 56,
    /** CSS value including safe area for notched devices */
    heightWithSafeArea: 'calc(56px + env(safe-area-inset-bottom, 0px))',
    /** Tailwind class for bottom nav height */
    heightClass: 'h-14',
    /** Icon configuration */
    icon: {
      size: 20,
      sizeClass: 'w-5 h-5',
      activeStrokeWidth: 2.5,
      inactiveStrokeWidth: 2,
    },
    /** Label typography（Epic 4 L05：≥10px、繁中 normal-case、inactive 用 muted 達 4.5:1） */
    label: {
      fontSize: 10,
      fontSizeClass: 'text-[10px]',
      fontWeight: 'font-semibold',
      letterSpacing: '0.02em',
      letterSpacingClass: 'tracking-wide',
      inactiveClass: 'text-text-muted',
      activeClass: 'text-primary',
      pendingClass: 'text-text-muted',
    },
    /** Active indicator bar */
    indicator: {
      width: 24,
      height: 3,
      widthClass: 'w-6',
      heightClass: 'h-[3px]',
    },
    /** Touch target for accessibility */
    touchTarget: {
      /** Minimum touch target size (WCAG 2.2 AAA) */
      minSize: 44,
    },
  },

  /**
   * Safe Area Configuration
   * For devices with notches (iPhone X+) or navigation gestures
   */
  safeArea: {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    /** Tailwind safe area classes */
    classes: {
      top: 'pt-safe-top',
      bottom: 'pb-safe-bottom',
    },
  },

  /**
   * 行動版 main 滾動區底部留白（fixed bottom nav 上方可捲動空間）
   * narrow 額外 +28px：Galaxy S21 360×800 QA 曾見 CTA 與 bottom nav 重疊
   */
  mainScroll: {
    paddingBottomClass:
      'pb-[calc(56px+env(safe-area-inset-bottom,0px))] max-[360px]:pb-[calc(84px+env(safe-area-inset-bottom,0px))] md:pb-0',
  },
} as const;

/**
 * 頁面佈局設計規範 (SSOT)
 *
 * 統一所有頁面的外層容器與內容區域間距配置。
 * 確保 Settings、MultiConverter、Favorites、SingleConverter 等頁面視覺一致性。
 *
 * 設計原理（2025 最佳實踐）：
 * - 外層容器：min-h-full（不重複 overflow，由 AppLayout 統一處理滾動）
 * - 內容區域：水平內距 20px (px-5)，垂直內距 24px (py-6)，最大寬度 448px (max-w-md)
 * - 區塊間距：各區塊使用 mb-6 分隔，卡片內距 p-4
 * - 底部留白：由 AppLayout pb-[calc(56px+safe-area)] 統一處理
 *
 * 避免問題：
 * - 雙重滾動（nested overflow-y-auto）
 * - 跑版（h-full + pb-32 導致超出視口）
 *
 * @see AppLayout.tsx - 外層滾動容器
 * @see https://web.dev/viewport-units/ - 動態視口高度最佳實踐
 * @see Settings.tsx, MultiConverter.tsx, Favorites.tsx - 參考實作
 * @created 2026-01-25
 * @updated 2026-01-26 - 修正捲軸跑版問題
 * @version 2.0.0
 */
export const pageLayoutTokens = {
  /** 外層頁面容器（不處理滾動，由 AppLayout 統一管理） */
  container: {
    /** 完整類別組合 */
    className: 'min-h-full',
  },
  /** 內容區域 */
  content: {
    horizontalPadding: 20,
    verticalPadding: 24,
    maxWidth: 448,
    /** 完整類別組合 */
    className: 'px-5 py-6 max-w-md mx-auto',
  },
  /** 區塊配置 */
  section: {
    marginBottom: 24,
    className: 'mb-6',
  },
  /** 卡片配置 */
  card: {
    padding: 16,
    className: 'card p-4',
  },
} as const;

/**
 * 單幣別頁面高度斷點佈局規範
 *
 * 針對 iOS PWA 用戶優化的高度響應式設計。
 * 採用流體縮放 (fluid scaling) 搭配斷點隱藏，確保所有螢幕尺寸視覺一致。
 *
 * ## iOS PWA 視口高度參考 (2025)
 *
 * | 裝置               | 視口高度 | 內容區高度 (扣除導覽) |
 * |--------------------|----------|----------------------|
 * | iPhone 16 Pro Max  | 956px    | ~792px               |
 * | iPhone 16 Plus     | 932px    | ~768px               |
 * | iPhone 16 Pro      | 874px    | ~710px               |
 * | iPhone 16/15       | 852px    | ~688px               |
 * | iPhone SE 2022     | 667px    | ~563px               |
 * | iPhone SE 原版     | 568px    | ~464px               |
 *
 * ## 斷點設計原則
 *
 * 1. **流體優先**：使用 CSS `clamp()` 實現元素線性縮放
 * 2. **漸進隱藏**：依重要性順序隱藏次要元素
 * 3. **等比維持**：漸層/光暈使用 `aspect-ratio` 保持比例
 *
 * ## 元素隱藏優先順序（由先到後）
 *
 * 1. 快速金額（來源）  - short (≤700px) 隱藏
 * 2. 快速金額（結果）  - tiny (≤650px) 隱藏
 * 3. 交換按鈕光暈      - short (≤700px) 隱藏
 * 4. 交換按鈕          - micro (≤600px) 隱藏
 * 5. 資料來源          - nano (≤560px) 隱藏（最後）
 *
 * @see https://web.dev/articles/min-max-clamp - CSS clamp() 最佳實踐
 * @see https://tailwindcss.com/docs/responsive-design - Tailwind RWD
 *
 * @created 2026-01-27
 * @updated 2026-01-29 - 回復 3ea33 頁面上緣對齊與卡片比例
 * @version 1.1.0
 */
export const rateWiseLayoutTokens = {
  /**
   * 外層容器 - 使用 flex 填滿可用空間
   * [align:2026-01-29] 對齊 MultiConverter page 上緣間距
   */
  container: 'flex flex-col min-h-full',

  /**
   * 內容容器 - 流體內距搭配最大寬度限制
   * [align:2026-01-29] 與 3ea33 版一致的 px/py 與 max-w
   */
  content: {
    className: 'flex-1 flex flex-col px-3 sm:px-5 py-4 max-w-md mx-auto w-full',
  },

  section: {
    className: 'flex-1 flex flex-col mb-4',
  },

  /** 單幣別卡片 - 移除 flex-1 避免過度拉伸 */
  card: {
    className: 'card p-4 flex-1',
  },

  /**
   * 資料來源區塊 - 最後隱藏（nano 斷點）
   * [align:2026-01-29] 與 3ea33 版一致，不額外加內距
   */
  info: {
    base: 'text-center flex-shrink-0',
    visibility: 'nano:hidden',
  },
} as const;

/**
 * 多幣別頁面佈局規範
 *
 * 與單幣別頁面對齊的上緣間距與卡片比例，避免頁面切換時跳位。
 * 統一使用 SSOT token，禁止 page 層硬編碼間距。
 *
 * @created 2026-01-29
 * @version 1.0.0
 */
export const multiConverterLayoutTokens = {
  /** 外層容器 */
  container: 'flex flex-col min-h-full',

  /** 內容容器 */
  content: {
    className: 'flex-1 flex flex-col px-3 sm:px-5 py-4 max-w-md mx-auto w-full',
  },

  /** 主區塊 */
  section: {
    className: 'flex-1 flex flex-col',
  },

  /** 卡片容器 */
  card: {
    className: 'card p-4 flex-1 flex flex-col',
  },

  /** 更新時間區塊 */
  info: {
    wrapper: 'mt-4 flex-shrink-0',
    titleRow: 'flex items-center gap-2 px-2 opacity-40 mb-3',
    titleText: 'text-[10px] font-black uppercase tracking-[0.2em]',
    card: 'card p-4',
    text: 'text-[10px] text-center opacity-60 font-medium',
  },
} as const;

/**
 * 單幣別轉換器高度斷點配置
 *
 * 控制各元件的間距、字體尺寸與顯示/隱藏規則。
 * 採用線性遞減設計，確保視覺比例在各斷點間平滑過渡。
 *
 * ## 匯率卡片佈局設計
 *
 * - 匯率類型按鈕採絕對定位，回復舊版比例，避免佔用內容高度
 * - 漸層光暈使用 `aspect-square` 保持等比例
 * - 趨勢圖高度隨視口流體縮放
 *
 * ## 斷點尺寸對照
 *
 * | 斷點    | 視口高度 | 目標裝置                    |
 * |---------|----------|----------------------------|
 * | tall    | ≥761px   | iPhone 16 Pro+ 系列         |
 * | compact | ≤760px   | iPhone 16/15 標準版         |
 * | short   | ≤700px   | 較舊 iPhone / 小型 Android  |
 * | tiny    | ≤650px   | 接近 iPhone SE 2022         |
 * | micro   | ≤600px   | iPhone SE 原版附近          |
 * | nano    | ≤560px   | 極小螢幕 / 橫向模式         |
 *
 * @created 2026-01-27
 * @updated 2026-01-28 - 回復舊版比例與間距，保留高度斷點縮放
 * @version 1.1.0
 */
export const singleConverterLayoutTokens = {
  /** 區塊間距 - 線性遞減 */
  section: {
    className: 'mb-4 compact:mb-3.5 short:mb-3 tiny:mb-2.5 micro:mb-2 nano:mb-2',
  },

  /** 標籤間距 */
  label: {
    className: 'mb-2 short:mb-1.5 tiny:mb-1 micro:mb-1 nano:mb-0.5',
  },

  /** 金額輸入框 - 流體尺寸 */
  amountInput: {
    className:
      'py-3 text-2xl compact:py-2.5 compact:text-xl short:py-2 short:text-lg tiny:py-1.5 tiny:text-base micro:py-1.5 micro:text-base nano:py-1 nano:text-sm',
  },

  /** 匯率卡片區塊 */
  rateCard: {
    /** 區塊容器 */
    section:
      'flex flex-col items-center mb-4 compact:mb-3.5 short:mb-3 tiny:mb-2.5 micro:mb-2 nano:mb-2',

    /** 卡片底部間距 */
    cardSpacing: 'mb-3 compact:mb-2.5 short:mb-2 tiny:mb-1.5 micro:mb-1.5 nano:mb-1',

    /** 匯率資訊區內距 - micro/nano 頂部 ≥40px，避免 RateSelector 與匯率文字重疊 */
    infoPadding:
      'pt-12 pb-6 compact:pt-10 compact:pb-5 short:pt-8 short:pb-4 tiny:pt-6 tiny:pb-3 micro:pt-10 micro:pb-2.5 nano:pt-10 nano:pb-2',

    /** Hero v2 匯率資訊區內距（answer-first：頂部留白較小，y≤120） */
    heroInfoPadding:
      'pt-4 pb-3 compact:pt-3.5 compact:pb-3 short:pt-3 short:pb-2.5 tiny:pt-2.5 tiny:pb-2 micro:pt-2 micro:pb-2 nano:pt-2 nano:pb-1.5',

    /** 匯率類型按鈕容器定位 */
    rateTypeContainer:
      'absolute top-3 left-1/2 -translate-x-1/2 compact:top-2.5 short:top-2 tiny:top-2 micro:top-1.5 nano:top-1.5',

    /** 匯率類型按鈕尺寸 */
    rateTypeButton:
      'px-2 py-0.5 text-[11px] compact:px-1.5 compact:py-0.5 compact:text-[10px] short:px-1.5 short:py-0.5 short:text-[10px] tiny:px-1 tiny:py-0.5 tiny:text-[9px] micro:px-1 micro:py-0.5 micro:text-[9px] nano:px-1 nano:py-0.5 nano:text-[9px]',

    /** 緊湊 pill 視覺 + 偽元素擴大觸控區（WCAG 2.5.8） */
    rateTypeButtonHit:
      'relative before:absolute before:-inset-x-2.5 before:-inset-y-2.5 before:content-[""]',

    /** 匯率類型圖示 - nano 隱藏 */
    rateTypeIcon:
      'w-3 h-3 compact:w-2.5 compact:h-2.5 short:w-2.5 short:h-2.5 tiny:w-2 tiny:h-2 micro:w-2 micro:h-2 nano:hidden',

    /** 主要匯率文字（legacy 路徑） */
    rateText: 'text-2xl compact:text-xl short:text-lg tiny:text-base micro:text-sm nano:text-sm',

    /** Hero v2 主匯率 display-md（32px 固定，answer-first AC-HERO-02） */
    heroRateDisplay: 'text-[32px] font-bold tabular-nums leading-tight tracking-tight',

    /** Hero v2 金額列（≤ hero×0.75） */
    amountSecondaryDisplay:
      'py-3 text-xl compact:py-2.5 compact:text-lg short:py-2 short:text-base tiny:py-1.5 tiny:text-sm micro:py-1.5 micro:text-sm nano:py-1 nano:text-sm',

    /** Freshness trust chip 與 hero 間距（≤8px） */
    trustChipGap: 'mt-2',

    /** 44×44 計算機 affordance（WCAG 2.5.8） */
    calculatorAffordanceHit:
      'inline-flex shrink-0 items-center justify-center min-h-11 min-w-11 rounded-xl border border-border/60 bg-surface-elevated text-text/70 hover:text-primary hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',

    /** Hero v2 Zen 白底卡片（取代 heavy gradient） */
    heroCardSurface: 'bg-surface-card border border-border/60 shadow-sm',
    heroCardGradient:
      'bg-gradient-to-br from-primary/8 via-surface-card to-brand-via/40 border border-primary/15 shadow-lg rounded-2xl',
    heroRateBlock: 'flex flex-col items-center',
    heroRateTabsWrap: 'mt-3 w-full flex justify-center',
    heroTrustBadge:
      'inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary',
    heroRateTabPill:
      'inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200',
    heroRateTabActive: 'bg-primary text-white shadow-sm',
    heroRateTabInactive:
      'bg-surface-elevated/80 text-text/70 hover:text-text hover:bg-surface-elevated',
    heroDualCurrencyRow: 'mt-3 flex w-full items-end gap-1.5',
    heroSwapInline:
      'relative z-10 flex shrink-0 items-center justify-center min-h-11 min-w-11 rounded-full bg-gradient-to-br from-primary to-primary-hover text-white shadow-md shadow-primary/25 transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60',
    heroDualCurrencyField: 'flex-1 min-w-0 flex flex-col',
    heroDualCurrencyLabel:
      'text-[10px] font-bold uppercase tracking-wider text-text-muted/70 mb-1 px-1',
    heroDualCurrencyInput:
      'w-full text-xl font-black tabular-nums text-right px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-[border-color,background-color] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-h-11',
    heroDualCurrencyInputActive: 'border-primary bg-primary/5 text-text',
    heroDualCurrencyInputInactive:
      'border-border/60 bg-surface-elevated/50 text-text/80 hover:border-primary/30',
    heroNumpadGrid: 'mt-3 grid grid-cols-3 gap-2',
    heroConverterSection: 'mt-3 w-full border-t border-border/40 pt-3',
    heroNumpadKey:
      'flex items-center justify-center min-h-11 rounded-xl bg-surface-elevated text-text font-bold text-lg active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
    heroNumpadKeyDanger: 'bg-danger/10 text-danger hover:bg-danger/15 active:bg-danger/20',

    /** 次要匯率文字 */
    rateSubText: 'text-sm short:text-xs tiny:text-xs micro:text-[10px] nano:text-[10px]',

    /** 匯率文字區塊最小高度（含計價基準 pill 槽位，避免 async 載入位移） */
    rateTextBlock:
      'min-h-[5rem] compact:min-h-[4.5rem] short:min-h-[4rem] tiny:min-h-[3.75rem] micro:min-h-[3.5rem] nano:min-h-[3.25rem]',

    /** 計價基準 pill 槽位（無 pill 時仍保留高度） */
    rateBasisSlot: 'mt-1.5 flex min-h-6 items-center justify-center',

    /** 匯率卡片本體最小高度（資訊區 + 圖表） */
    cardMinHeight:
      'min-h-[10.5rem] compact:min-h-[9.5rem] short:min-h-[8.75rem] tiny:min-h-[8rem] micro:min-h-[7.25rem] nano:min-h-[6.75rem]',

    /** 趨勢圖高度 - 線性遞減 */
    chartHeight: 'h-20 compact:h-16 short:h-14 tiny:h-12 micro:h-10 nano:h-8',

    /** 趨勢圖懸停高度 */
    chartHoverHeight:
      'group-hover:h-24 compact:group-hover:h-20 short:group-hover:h-16 tiny:group-hover:h-14 micro:group-hover:h-12 nano:group-hover:h-10',

    /** 換錢所來源 badge 容器（換錢所選中時顯示） */
    exchangeShopBadge:
      'mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] font-medium leading-tight text-text-muted/60',

    /** 換錢所 badge 圖示 */
    exchangeShopBadgeIcon: 'h-3 w-3 shrink-0 text-primary/70',

    /** 換錢所 badge 分隔點 */
    exchangeShopBadgeDot: 'text-text-muted/40',

    /** 換錢所 badge 來源連結 */
    exchangeShopBadgeLink:
      'text-text-muted/70 underline decoration-dotted underline-offset-2 transition-colors hover:text-primary',
  },

  /**
   * 快速金額區塊
   *
   * 隱藏優先順序：來源 (short) → 結果 (tiny)
   * 快速金額為輔助功能，優先於資料來源隱藏
   */
  quickAmounts: {
    /** 容器樣式 */
    container:
      'flex gap-2 mt-2 compact:mt-1.5 short:mt-1 tiny:mt-1 micro:mt-0.5 nano:mt-0.5 min-w-0 overflow-x-auto scrollbar-hide [overflow-y:hidden] [-webkit-overflow-scrolling:touch]',

    /** 來源快速金額：short (≤700px) 隱藏 */
    fromVisibility: 'short:hidden',

    /** 結果快速金額：tiny (≤650px) 隱藏 */
    toVisibility: 'tiny:hidden',
  },

  /**
   * 交換按鈕
   *
   * 光暈效果 short 隱藏，按鈕本體 micro 隱藏
   */
  swap: {
    /** 按鈕包裝器 */
    wrapper: 'relative group/swap',

    /** 按鈕可見性：micro (≤600px) 隱藏 */
    visibility: 'micro:hidden',

    /** 光暈可見性：short (≤700px) 隱藏 */
    glowHidden: 'short:hidden',
  },

  /** 加入歷史按鈕 - micro/nano 維持 WCAG 44px 最小觸控高度 */
  addToHistory: {
    className:
      'py-3.5 compact:py-3 short:py-2.5 tiny:py-2 micro:min-h-11 micro:py-2 nano:min-h-11 nano:py-2',
  },
} as const;

/**
 * 快速金額按鈕設計規範 (SSOT)
 *
 * 統一貨幣快速金額選擇按鈕樣式。
 * 適用於 SingleConverter 與 MultiConverter 元件。
 *
 * 設計原理：
 * - 中性變體：低視覺權重，不與主要操作競爭注意力
 * - 互動回饋：色彩漸變 + 縮放動畫，提供明確操作反饋
 *
 * 互動狀態：
 * - 預設：抬升表面背景 + 柔和文字 (bg-surface-elevated text-text/70)
 * - 懸停：主色調淡化 + 主色文字 (bg-primary/10 text-primary)
 * - 按壓：主色調加深 + 縮放回饋 (bg-primary/20 scale-[0.97])
 *
 * @created 2026-01-25
 * @version 1.0.0
 */
export const quickAmountButtonTokens = {
  /** 基礎樣式 */
  base: {
    padding: 'px-3 py-1.5',
    borderRadius: 'rounded-xl',
    typography: 'text-sm font-semibold',
  },
  /** 色彩狀態 */
  colors: {
    default: {
      background: 'bg-surface-elevated',
      text: 'text-text/70',
    },
    hover: {
      background: 'bg-primary/10',
      text: 'text-primary',
    },
    active: {
      background: 'bg-primary/20',
      text: 'text-primary',
    },
  },
  /** 微互動效果 */
  interactions: {
    transition: 'transition-all duration-200 ease-out',
    hoverScale: 'hover:scale-[1.03]',
    activeScale: 'active:scale-[0.97]',
    hoverShadow: 'hover:shadow-md',
    activeShadow: 'active:shadow-sm',
  },
  /** 觸覺回饋時長 (毫秒) */
  hapticDuration: 30,
} as const;

/**
 * 間距設計規範 (SSOT)
 *
 * 統一應用程式間距系統，基於 4px 基礎網格。
 * 遵循 Tailwind CSS 官方間距系統，確保一致性。
 *
 * 設計原理：
 * - 基礎單位：4px (0.25rem)
 * - 倍數系統：xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48, 3xl=64
 * - 用途區分：內距 (padding)、外距 (margin)、間隙 (gap)
 *
 * @reference Tailwind CSS Spacing Scale
 * @see https://tailwindcss.com/docs/customizing-spacing
 * @created 2026-01-25
 * @version 1.0.0
 */
