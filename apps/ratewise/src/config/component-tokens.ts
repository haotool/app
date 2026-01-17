/**
 * Component Tokens - Ratewise Design System
 *
 * @description 元件層級的 Token 定義，基於 W3C DTCG 2025.10 規範
 * @see https://www.designtokens.org/tr/drafts/format/
 * @see https://m3.material.io/components - Material Design 3 Guidelines
 * @see https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass - Apple Liquid Glass
 *
 * @version 2.0.0
 * @updated 2025-01-17
 */

// ============================================================
// 1. 導覽元件 Tokens (Material Design 3 + Apple HIG)
// ============================================================

/**
 * 底部導覽列 - Mobile (Material Design 3 Navigation Bar)
 * @see https://m3.material.io/components/navigation-bar/guidelines
 */
export const bottomTabBar = {
  // 容器
  container: {
    height: '56px', // MD3 標準高度
    paddingX: '8px',
    paddingY: '0px',
    background: 'var(--glass-surface-base)',
    backdropBlur: 'var(--glass-blur-lg)',
    borderTop: '1px solid var(--glass-border-light)',
  },
  // 導覽項目
  item: {
    minWidth: '64px', // MD3 最小寬度
    maxWidth: '96px', // MD3 最大寬度
    height: '100%',
    padding: '4px 0',
    gap: '4px',
  },
  // 圖示
  icon: {
    size: '24px',
    activeColor: 'var(--color-accent-primary)',
    inactiveColor: 'var(--color-text-tertiary)',
  },
  // 標籤
  label: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    activeColor: 'var(--color-accent-primary)',
    inactiveColor: 'var(--color-text-tertiary)',
  },
  // 指示器 (MD3 Pill Indicator)
  indicator: {
    height: '32px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-accent-primary)',
    opacity: '0.12',
  },
} as const;

/**
 * 側邊導覽軌 - Tablet (Material Design 3 Navigation Rail)
 * @see https://m3.material.io/components/navigation-rail/guidelines
 */
export const navRail = {
  container: {
    width: '80px', // MD3 標準寬度
    paddingY: '12px',
    background: 'var(--glass-surface-base)',
    backdropBlur: 'var(--glass-blur-lg)',
    borderRight: '1px solid var(--glass-border-light)',
  },
  item: {
    width: '56px',
    height: '56px',
    borderRadius: 'var(--radius-xl)',
    marginBottom: '4px',
  },
  icon: {
    size: '24px',
  },
  label: {
    fontSize: 'var(--font-size-xs)',
    marginTop: '4px',
  },
} as const;

/**
 * 側邊欄 - Desktop
 */
export const sidebar = {
  container: {
    width: '256px',
    collapsedWidth: '72px',
    paddingX: '12px',
    paddingY: '16px',
    background: 'var(--glass-surface-base)',
    backdropBlur: 'var(--glass-blur-lg)',
    borderRight: '1px solid var(--glass-border-light)',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: '600',
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '8px',
    paddingX: '12px',
  },
  item: {
    height: '40px',
    paddingX: '12px',
    borderRadius: 'var(--radius-lg)',
    gap: '12px',
  },
} as const;

/**
 * 頂部工具列 - Desktop
 */
export const topBar = {
  container: {
    height: '64px',
    paddingX: '24px',
    background: 'var(--glass-surface-base)',
    backdropBlur: 'var(--glass-blur-lg)',
    borderBottom: '1px solid var(--glass-border-light)',
  },
  logo: {
    height: '32px',
  },
  search: {
    width: '320px',
    height: '40px',
  },
  actions: {
    gap: '8px',
  },
} as const;

// ============================================================
// 2. 卡片元件 Tokens (Liquid Glass)
// ============================================================

/**
 * 玻璃卡片 - 基礎表面
 */
export const glassCard = {
  base: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-md)',
    padding: 'var(--spacing-4)',
  },
  elevated: {
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    padding: 'var(--spacing-4)',
  },
  interactive: {
    transition: 'all var(--duration-normal) var(--easing-ease-out)',
    hover: {
      background: 'rgba(255, 255, 255, 0.15)',
      transform: 'translateY(-2px)',
      boxShadow: 'var(--shadow-xl)',
    },
    active: {
      transform: 'translateY(0)',
      boxShadow: 'var(--shadow-md)',
    },
  },
} as const;

/**
 * 匯率卡片 - 專用於 Ratewise
 */
export const rateCard = {
  container: {
    ...glassCard.base,
    padding: 'var(--spacing-4)',
    minHeight: '120px',
  },
  header: {
    marginBottom: 'var(--spacing-3)',
  },
  currencyPair: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
  },
  rateDisplay: {
    fontSize: 'var(--font-size-3xl)',
    fontWeight: '700',
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em',
  },
  change: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    positive: 'var(--color-status-success)',
    negative: 'var(--color-status-error)',
    neutral: 'var(--color-text-tertiary)',
  },
  timestamp: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-tertiary)',
  },
} as const;

// ============================================================
// 3. 按鈕元件 Tokens
// ============================================================

export const button = {
  // 尺寸變體
  size: {
    sm: {
      height: '32px',
      paddingX: '12px',
      fontSize: 'var(--font-size-sm)',
      borderRadius: 'var(--radius-md)',
      iconSize: '16px',
      gap: '6px',
    },
    md: {
      height: '40px',
      paddingX: '16px',
      fontSize: 'var(--font-size-sm)',
      borderRadius: 'var(--radius-lg)',
      iconSize: '20px',
      gap: '8px',
    },
    lg: {
      height: '48px',
      paddingX: '24px',
      fontSize: 'var(--font-size-base)',
      borderRadius: 'var(--radius-lg)',
      iconSize: '20px',
      gap: '8px',
    },
  },
  // 樣式變體
  variant: {
    primary: {
      background: 'var(--color-accent-primary)',
      color: 'var(--color-text-inverse)',
      border: 'none',
      hover: {
        background: 'var(--color-accent-primary-hover)',
      },
      active: {
        background: 'var(--color-accent-primary-active)',
      },
    },
    secondary: {
      background: 'transparent',
      color: 'var(--color-accent-primary)',
      border: '1px solid var(--color-accent-primary)',
      hover: {
        background: 'rgba(124, 58, 237, 0.08)',
      },
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-secondary)',
      border: 'none',
      hover: {
        background: 'var(--color-background-secondary)',
      },
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'var(--color-text-primary)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(8px)',
      hover: {
        background: 'rgba(255, 255, 255, 0.15)',
      },
    },
  },
  // 共用屬性
  common: {
    fontWeight: '500',
    transition: 'all var(--duration-fast) var(--easing-ease-out)',
    focusRing: '2px solid var(--color-border-focus)',
    focusRingOffset: '2px',
    disabled: {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
} as const;

// ============================================================
// 4. 輸入元件 Tokens
// ============================================================

export const input = {
  container: {
    height: '48px',
    paddingX: 'var(--spacing-4)',
    background: 'var(--color-surface-default)',
    border: '1px solid var(--color-border-default)',
    borderRadius: 'var(--radius-lg)',
    fontSize: 'var(--font-size-base)',
    transition: 'all var(--duration-fast) var(--easing-ease-out)',
  },
  states: {
    hover: {
      borderColor: 'var(--color-border-strong)',
    },
    focus: {
      borderColor: 'var(--color-border-focus)',
      boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.15)',
    },
    error: {
      borderColor: 'var(--color-status-error)',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.15)',
    },
    disabled: {
      background: 'var(--color-background-secondary)',
      opacity: '0.6',
    },
  },
  label: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--spacing-2)',
  },
  helper: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-tertiary)',
    marginTop: 'var(--spacing-1)',
  },
  error: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-status-error)',
    marginTop: 'var(--spacing-1)',
  },
} as const;

/**
 * 貨幣輸入框 - Ratewise 專用
 */
export const currencyInput = {
  container: {
    ...input.container,
    height: '56px',
    paddingLeft: 'var(--spacing-4)',
    paddingRight: '80px', // 為貨幣選擇器預留空間
  },
  value: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: '600',
    fontFamily: 'var(--font-mono)',
  },
  currencySelector: {
    position: 'absolute' as const,
    right: '4px',
    top: '50%',
    transform: 'translateY(-50%)',
    height: '40px',
    paddingX: 'var(--spacing-3)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-background-secondary)',
  },
} as const;

// ============================================================
// 5. 模態框與覆蓋層 Tokens
// ============================================================

export const modal = {
  backdrop: {
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
  },
  container: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(32px)',
    borderRadius: 'var(--radius-2xl)',
    boxShadow: 'var(--shadow-xl)',
    maxWidth: '480px',
    width: '90%',
    maxHeight: '85vh',
  },
  header: {
    padding: 'var(--spacing-4) var(--spacing-4) var(--spacing-3)',
    borderBottom: '1px solid var(--color-border-default)',
  },
  body: {
    padding: 'var(--spacing-4)',
    overflowY: 'auto' as const,
  },
  footer: {
    padding: 'var(--spacing-3) var(--spacing-4) var(--spacing-4)',
    borderTop: '1px solid var(--color-border-default)',
    gap: 'var(--spacing-3)',
  },
} as const;

export const drawer = {
  backdrop: modal.backdrop,
  container: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(32px)',
    boxShadow: 'var(--shadow-xl)',
  },
  // 方向變體
  direction: {
    right: {
      width: '320px',
      maxWidth: '90%',
      height: '100%',
      borderRadius: 'var(--radius-2xl) 0 0 var(--radius-2xl)',
    },
    bottom: {
      width: '100%',
      maxHeight: '85vh',
      borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
    },
  },
} as const;

// ============================================================
// 6. 圖表元件 Tokens
// ============================================================

export const chart = {
  container: {
    ...glassCard.base,
    padding: 'var(--spacing-4)',
    minHeight: '200px',
  },
  header: {
    marginBottom: 'var(--spacing-3)',
  },
  title: {
    fontSize: 'var(--font-size-base)',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
  },
  subtitle: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-tertiary)',
  },
  // 時間範圍選擇器
  timeRange: {
    gap: 'var(--spacing-1)',
    button: {
      height: '28px',
      paddingX: 'var(--spacing-2)',
      fontSize: 'var(--font-size-xs)',
      fontWeight: '500',
      borderRadius: 'var(--radius-md)',
      active: {
        background: 'var(--color-accent-primary)',
        color: 'var(--color-text-inverse)',
      },
      inactive: {
        background: 'transparent',
        color: 'var(--color-text-tertiary)',
      },
    },
  },
  // 圖表顏色
  colors: {
    primary: 'var(--color-accent-primary)',
    secondary: 'var(--color-accent-secondary)',
    positive: 'var(--color-status-success)',
    negative: 'var(--color-status-error)',
    grid: 'var(--color-border-default)',
    axis: 'var(--color-text-tertiary)',
  },
} as const;

// ============================================================
// 7. 列表元件 Tokens
// ============================================================

export const list = {
  container: {
    ...glassCard.base,
    padding: '0',
    overflow: 'hidden',
  },
  item: {
    padding: 'var(--spacing-3) var(--spacing-4)',
    borderBottom: '1px solid var(--color-border-default)',
    transition: 'background var(--duration-fast) var(--easing-ease-out)',
    hover: {
      background: 'rgba(0, 0, 0, 0.02)',
    },
    active: {
      background: 'rgba(124, 58, 237, 0.08)',
    },
  },
  // 貨幣列表項
  currencyItem: {
    height: '64px',
    padding: 'var(--spacing-3) var(--spacing-4)',
    gap: 'var(--spacing-3)',
  },
  currencyIcon: {
    size: '40px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-background-secondary)',
  },
  currencyName: {
    fontSize: 'var(--font-size-base)',
    fontWeight: '500',
    color: 'var(--color-text-primary)',
  },
  currencyCode: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-tertiary)',
  },
  currencyRate: {
    fontSize: 'var(--font-size-base)',
    fontWeight: '600',
    fontFamily: 'var(--font-mono)',
    textAlign: 'right' as const,
  },
} as const;

// ============================================================
// 8. 標籤與徽章 Tokens
// ============================================================

export const chip = {
  size: {
    sm: {
      height: '24px',
      paddingX: 'var(--spacing-2)',
      fontSize: 'var(--font-size-xs)',
      borderRadius: 'var(--radius-md)',
    },
    md: {
      height: '32px',
      paddingX: 'var(--spacing-3)',
      fontSize: 'var(--font-size-sm)',
      borderRadius: 'var(--radius-lg)',
    },
  },
  variant: {
    filled: {
      background: 'var(--color-background-secondary)',
      color: 'var(--color-text-secondary)',
    },
    outlined: {
      background: 'transparent',
      border: '1px solid var(--color-border-default)',
      color: 'var(--color-text-secondary)',
    },
    tonal: {
      background: 'rgba(124, 58, 237, 0.12)',
      color: 'var(--color-accent-primary)',
    },
  },
} as const;

export const badge = {
  size: {
    sm: {
      minWidth: '16px',
      height: '16px',
      fontSize: '10px',
    },
    md: {
      minWidth: '20px',
      height: '20px',
      fontSize: '12px',
    },
  },
  variant: {
    default: {
      background: 'var(--color-accent-primary)',
      color: 'var(--color-text-inverse)',
    },
    success: {
      background: 'var(--color-status-success)',
      color: 'var(--color-text-inverse)',
    },
    warning: {
      background: 'var(--color-status-warning)',
      color: 'var(--color-text-inverse)',
    },
    error: {
      background: 'var(--color-status-error)',
      color: 'var(--color-text-inverse)',
    },
  },
  common: {
    fontWeight: '600',
    borderRadius: 'var(--radius-full)',
    padding: '0 var(--spacing-1)',
  },
} as const;

// ============================================================
// 9. 設定頁元件 Tokens
// ============================================================

export const settings = {
  section: {
    marginBottom: 'var(--spacing-6)',
  },
  sectionTitle: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: '600',
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 'var(--spacing-3)',
    paddingX: 'var(--spacing-4)',
  },
  group: {
    ...glassCard.base,
    padding: '0',
    overflow: 'hidden',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--spacing-4)',
    borderBottom: '1px solid var(--color-border-default)',
    minHeight: '56px',
  },
  itemLabel: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
  },
  itemValue: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-tertiary)',
  },
  itemIcon: {
    size: '20px',
    color: 'var(--color-text-tertiary)',
  },
} as const;

/**
 * 主題選擇器
 */
export const themePicker = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 'var(--spacing-3)',
    padding: 'var(--spacing-4)',
  },
  option: {
    aspectRatio: '1',
    borderRadius: 'var(--radius-xl)',
    border: '2px solid transparent',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all var(--duration-normal) var(--easing-ease-out)',
    selected: {
      borderColor: 'var(--color-accent-primary)',
      boxShadow: '0 0 0 2px var(--color-accent-primary)',
    },
  },
  preview: {
    width: '100%',
    height: '70%',
    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
  },
  label: {
    height: '30%',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
} as const;

/**
 * 顏色選擇器
 */
export const colorPicker = {
  container: {
    display: 'flex',
    gap: 'var(--spacing-3)',
    padding: 'var(--spacing-4)',
  },
  swatch: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-full)',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all var(--duration-fast) var(--easing-ease-out)',
    selected: {
      borderColor: 'var(--color-text-primary)',
      transform: 'scale(1.1)',
    },
  },
} as const;

// ============================================================
// 10. Tailwind 類別生成器
// ============================================================

/**
 * 生成 Tailwind 類別字串
 */
export const tw = {
  // 玻璃卡片
  glassCard: {
    base: 'bg-white/[0.08] backdrop-blur-md border border-white/[0.18] rounded-xl shadow-md',
    elevated: 'bg-white/[0.12] backdrop-blur-lg border border-white/[0.25] rounded-xl shadow-lg',
    interactive:
      'transition-all duration-200 ease-out hover:bg-white/[0.15] hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md',
  },
  // 按鈕
  button: {
    base: 'inline-flex items-center justify-center font-medium transition-all duration-100 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    primary:
      'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 focus:ring-violet-500',
    secondary:
      'bg-transparent text-violet-600 border border-violet-600 hover:bg-violet-50 focus:ring-violet-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
    glass:
      'bg-white/10 text-slate-900 border border-white/20 backdrop-blur-sm hover:bg-white/15 focus:ring-white/50',
    sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
    md: 'h-10 px-4 text-sm rounded-lg gap-2',
    lg: 'h-12 px-6 text-base rounded-lg gap-2',
  },
  // 輸入框
  input: {
    base: 'w-full h-12 px-4 bg-white border border-slate-200 rounded-lg text-base transition-all duration-100 ease-out placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-3 focus:ring-violet-500/15 disabled:bg-slate-100 disabled:opacity-60',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500/15',
  },
  // 標籤
  chip: {
    base: 'inline-flex items-center font-medium',
    filled: 'bg-slate-100 text-slate-600',
    outlined: 'bg-transparent border border-slate-200 text-slate-600',
    tonal: 'bg-violet-600/12 text-violet-600',
    sm: 'h-6 px-2 text-xs rounded-md',
    md: 'h-8 px-3 text-sm rounded-lg',
  },
} as const;

export default {
  bottomTabBar,
  navRail,
  sidebar,
  topBar,
  glassCard,
  rateCard,
  button,
  input,
  currencyInput,
  modal,
  drawer,
  chart,
  list,
  chip,
  badge,
  settings,
  themePicker,
  colorPicker,
  tw,
};
