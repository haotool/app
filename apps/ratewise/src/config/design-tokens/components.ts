import { navigationTokens } from './layout';

export const buttonTokens = {
  /** 基礎樣式 (所有按鈕共用) */
  base: {
    display: 'inline-flex items-center justify-center',
    typography: 'font-semibold',
    border: 'rounded-2xl',
    cursor: 'cursor-pointer',
    transition: 'transition-all duration-200 ease-out',
    focus:
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  },

  /** 尺寸變體 */
  sizes: {
    sm: {
      padding: 'px-3 py-1.5',
      fontSize: 'text-sm',
      height: 'h-8',
      iconSize: 'w-4 h-4',
      gap: 'gap-1.5',
    },
    md: {
      padding: 'px-4 py-2',
      fontSize: 'text-base',
      height: 'h-10',
      iconSize: 'w-5 h-5',
      gap: 'gap-2',
    },
    lg: {
      padding: 'px-6 py-3',
      fontSize: 'text-lg',
      height: 'h-12',
      iconSize: 'w-6 h-6',
      gap: 'gap-2.5',
    },
  },

  /** 顏色變體 */
  variants: {
    /** 主要按鈕 - 高視覺權重（白字表面錨定 primary-strong 保 AA；E1 無 hover 位移/陰影） */
    primary: {
      default: 'bg-primary-strong text-white',
      hover: 'hover:bg-primary-hover',
      active: 'active:scale-[0.97]',
    },
    /** 次要按鈕 - 中視覺權重 */
    secondary: {
      default: 'bg-surface-elevated text-text border border-border',
      hover: 'hover:bg-surface hover:border-primary/30 hover:text-primary',
      active: 'active:bg-surface-sunken',
    },
    /** 幽靈按鈕 - 低視覺權重 */
    ghost: {
      default: 'bg-transparent text-text',
      hover: 'hover:bg-surface-elevated hover:text-primary',
      active: 'active:bg-surface-sunken',
    },
    /** 危險按鈕 - 警示操作（E1 無 hover 位移/陰影） */
    danger: {
      default: 'bg-destructive text-white',
      hover: 'hover:bg-destructive-hover',
      active: 'active:scale-[0.97]',
    },
  },

  /** 完整類別組合 - 直接複製使用 */
  patterns: {
    primaryMd:
      'inline-flex items-center justify-center font-semibold rounded-2xl cursor-pointer transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 text-base h-10 gap-2 bg-primary-strong text-white hover:bg-primary-hover active:scale-[0.97]',
    secondaryMd:
      'inline-flex items-center justify-center font-semibold rounded-2xl cursor-pointer transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 text-base h-10 gap-2 bg-surface-elevated text-text border border-border hover:bg-surface hover:border-primary/30 hover:text-primary active:bg-surface-sunken',
    ghostMd:
      'inline-flex items-center justify-center font-semibold rounded-2xl cursor-pointer transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 text-base h-10 gap-2 bg-transparent text-text hover:bg-surface-elevated hover:text-primary active:bg-surface-sunken',
    dangerMd:
      'inline-flex items-center justify-center font-semibold rounded-2xl cursor-pointer transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 text-base h-10 gap-2 bg-destructive text-white hover:bg-destructive-hover active:scale-[0.97]',
    /** 圖示按鈕（關閉鈕等）：44px 觸控目標（WCAG 2.5.8）＋ focus-visible ring（WCAG 2.4.7）。 */
    iconMd:
      'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full cursor-pointer transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95',
  },
} as const;

/**
 * PWA 通知設計規範 (SSOT)
 *
 * 統一 UpdatePrompt 與 OfflineIndicator 的視覺風格。
 * Material Design snackbar 風格，支援頂部與底部定位。
 *
 * 設計原則：
 * - 統一品牌漸變背景（藍-靛-紫）
 * - 透過圖標顏色區分狀態（更新=品牌色、離線=警告色）
 * - 一致的裝飾光暈、按鈕樣式、動畫效果
 *
 * @see src/components/UpdatePrompt.tsx
 * @see src/components/OfflineIndicator.tsx
 * @created 2026-02-03
 * @updated 2026-02-09 - 新增離線通知變體，統一設計系統
 * @version 2.0.0
 */
export const notificationTokens = {
  /** 固定定位 + 容器尺寸（視窗底部中央） - UpdatePrompt 專用
   * 注意：不使用 -translate-x-1/2，改用 Motion 的 x: '-50%' 避免 transform 衝突
   * 行動版定位在 header 下方，避免阻擋底部導覽列
   */
  position:
    'fixed top-[var(--notification-mobile-top-offset)] md:top-auto md:bottom-4 left-1/2 md:left-[calc(50%+var(--notification-center-offset,0px))] w-[calc(100vw-2rem)] max-w-[344px] z-50',
  /** 行動版頂部偏移量：header 高度 + safe area + 16px 間距 */
  mobileTopOffset: `calc(${navigationTokens.header.height}px + env(safe-area-inset-top, 0px) + 16px)`,
  /** 固定定位 + 容器尺寸（視窗頂部中央） - OfflineIndicator 專用
   * 注意：不使用 -translate-x-1/2，改用 Motion 的 x: '-50%' 避免 transform 衝突
   */
  positionTop: 'fixed top-4 left-1/2 w-[calc(100vw-2rem)] max-w-[344px] z-[9999]',
  /** 內距 */
  padding: 'px-6 py-3.5',
  /** 圓角（與 card / button 統一） */
  borderRadius: 'rounded-2xl',
  /** 陰影（統一 shadow-card token；E1 彩色陰影清零） */
  shadow: 'shadow-card',

  /** 背景漸變（統一品牌風格） */
  background: {
    /** 品牌漸變 - 淡藍-淡靛-淡紫 */
    brand: 'bg-gradient-to-r from-brand-from via-brand-via to-brand-to',
    /** 邊框 - 品牌色 */
    brandBorder: 'border border-brand-border/60',
  },

  /** 裝飾光暈 */
  decoration: {
    size: 'w-16 h-16',
    blur: 'blur-2xl',
    /** 品牌色光暈（UpdatePrompt） */
    topRight: 'bg-brand-icon-from/40',
    bottomLeft: 'bg-brand-decoration/40',
    /** 警告色光暈（OfflineIndicator） */
    offlineTopRight: 'bg-warning/20',
    offlineBottomLeft: 'bg-warning/10',
  },

  /** 狀態圖標 */
  icon: {
    container: 'w-8 h-8 rounded-xl',
    svg: 'w-5 h-5',
    strokeWidth: 2.5,
    /** 品牌漸變 - UpdatePrompt 圖標背景 */
    brandGradient: 'bg-gradient-to-br from-brand-icon-from to-brand-icon-to',
    /** 警告漸變 - OfflineIndicator 圖標背景 */
    warningGradient: 'bg-gradient-to-br from-warning-light to-warning',
  },

  /** 文字顏色 */
  text: {
    /** 品牌色標題（UpdatePrompt） */
    brandTitle: 'text-brand-text-dark',
    brandDescription: 'text-brand-text',
    /** 警告色標題（OfflineIndicator） */
    warningTitle: 'text-warning',
    warningDescription: 'text-neutral-text-secondary',
  },

  /** 時序 */
  timing: {
    /** 入場延遲 (ms) */
    showDelay: 100,
    /** SW 定期檢查間隔 (ms) */
    updateInterval: 3_600_000,
    /** offlineReady 自動消失 (ms) */
    autoDismiss: 5_000,
    /** 啟動窗口 (ms)：窗口內偵測到新版視為冷啟動，自動套用更新不打斷使用者 */
    autoUpdateLaunchWindow: 30_000,
  },
} as const;
