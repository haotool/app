/**
 * Calculator Feature - TypeScript Type Definitions
 * @file types.ts
 * @description 計算機功能的類型定義，遵循 SPEC 文檔 Section 7.1
 * @see docs/dev/010_calculator_keyboard_feature_spec.md
 */

/**
 * 計算機狀態
 * @description 管理計算機的當前狀態（表達式、結果、錯誤）
 */
export interface CalculatorState {
  /** 當前輸入的數學表達式（例如："100 + 50 × 2"） */
  expression: string;
  /** 計算結果（未計算時為 null） */
  result: number | null;
  /** 錯誤訊息（無錯誤時為 null） */
  error: string | null;
}

/**
 * 按鍵類型
 * @description 定義計算機按鍵的類別
 */
export type KeyType = 'number' | 'operator' | 'action' | 'decimal';

/**
 * 運算符類型
 * @description 支援的四則運算符號
 */
export type OperatorType = '+' | '-' | '×' | '÷';

/**
 * 操作類型
 * @description 特殊功能按鍵（清除、刪除、計算、正負號、百分比）
 * @updated 2025-11-18 - Added 'negate' and 'percent' for iOS standard layout
 */
export type ActionType = 'clear' | 'backspace' | 'calculate' | 'negate' | 'percent';

/**
 * 按鍵定義
 * @description 定義單一按鍵的屬性
 */
export interface KeyDefinition {
  /** 按鍵顯示的標籤 */
  label: string;
  /** 按鍵的值（實際插入表達式的內容） */
  value: string;
  /** 按鍵類型 */
  type: KeyType;
  /** ARIA 標籤（無障礙支援） */
  ariaLabel: string;
  /** 鍵盤快捷鍵（optional） */
  shortcut?: string;
}

/**
 * 計算機鍵盤佈局
 * @description 定義 4×5 網格佈局的按鍵配置
 */
export type KeyboardLayout = KeyDefinition[][];

/**
 * 彩蛋類型
 * @description 支援的彩蛋種類
 */
export type EasterEggType = 'christmas' | null;

/**
 * 計算機 Hook 返回值
 * @description useCalculator hook 的返回介面
 * @updated 2025-11-18 - Added negate() and percent() for iOS standard features
 * @updated 2025-12-25 - Added Easter egg support
 */
export interface UseCalculatorReturn {
  /** 當前表達式 */
  expression: string;
  /** 計算結果 */
  result: number | null;
  /** 錯誤訊息 */
  error: string | null;
  /** 即時預覽結果（防抖計算，Apple 風格） */
  preview: number | null;
  /** 觸發的彩蛋類型 */
  easterEgg: EasterEggType;
  /** 輸入數字或運算符 */
  input: (value: string) => void;
  /** 刪除最後一個字元 */
  backspace: () => void;
  /** 清除所有內容 */
  clear: () => void;
  /** 執行計算 */
  calculate: () => number | null;
  /** 正負號切換（+/-） - iOS 標準功能 */
  negate: () => void;
  /** 百分比轉換（%） - iOS 標準功能 */
  percent: () => void;
  /** 關閉彩蛋 */
  closeEasterEgg: () => void;
}

/**
 * 計算機鍵盤元件 Props
 * @description CalculatorKeyboard 元件的屬性介面
 */
export interface CalculatorKeyboardProps {
  /** 是否顯示計算機（Bottom Sheet 控制） */
  isOpen: boolean;
  /** 關閉計算機的回調函數 */
  onClose: () => void;
  /** 確認計算結果的回調函數（將結果傳回父元件） */
  onConfirm: (result: number) => void;
  /** 初始值（optional，用於編輯現有數值） */
  initialValue?: number;
}

/**
 * 表達式顯示元件 Props
 * @description ExpressionDisplay 元件的屬性介面
 */
export interface ExpressionDisplayProps {
  /** 當前表達式 */
  expression: string;
  /** 計算結果 */
  result: number | null;
  /** 錯誤訊息 */
  error: string | null;
  /** 即時預覽結果（Apple 風格，顯示於表達式下方） */
  preview?: number | null;
}

/**
 * 計算機按鍵元件 Props
 * @description CalculatorKey 元件的屬性介面
 */
export interface CalculatorKeyProps {
  /** 按鍵定義 */
  keyDef: KeyDefinition;
  /** 點擊按鍵的回調函數 */
  onClick: (value: string) => void;
  /** 是否禁用按鍵（optional） */
  disabled?: boolean;
}

/**
 * 驗證結果
 * @description 輸入驗證的返回結果
 */
export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 錯誤訊息（有效時為 null） */
  error: string | null;
}
