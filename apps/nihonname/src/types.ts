/**
 * Type definitions for NihonName
 */

/** 姓氏來源資料 */
export interface SurnameSource {
  /** 來源名稱 */
  name: string;
  /** 網站標題 */
  title: string;
  /** 網址 */
  url: string;
}

/** 姓氏變異法類型 */
export type VariationMethod =
  | 'explicit' // 明示法 - 直接衍生
  | 'split' // 拆字法 - 拆解漢字
  | 'homophone' // 同音法 - 音譯
  | 'ancestral' // 郡望法 - 祖籍地名
  | 'hint' // 暗示法 - 間接關聯
  | 'regional' // 地區變異 - 依地區不同
  | 'reference'; // 參考性 - 稀少姓氏

/** 姓氏詳細資料 */
export interface SurnameDetail {
  /** 日本姓氏列表 */
  names: string[];
  /** 總筆數 */
  count: number;
  /** 主要變異法及實例說明 */
  description: string;
  /** 來源清單 */
  sources: SurnameSource[];
}

/** 簡易姓氏對照表 (向後相容) */
export type SurnameData = Record<string, string[]>;

/** 完整姓氏對照表 */
export type SurnameDataFull = Record<string, SurnameDetail>;

/** 諧音梗分類 */
export type PunNameCategory =
  | 'classic' // 經典諧音
  | 'taiwanese' // 台語諧音
  | 'life' // 生活諧音
  | 'wealth' // 財富相關
  | 'character' // 拆字梗
  | 'place' // 地名相關
  | 'history' // 歷史人物
  | 'literature' // 文學風格
  | 'common' // 常見日本名
  | 'nature' // 自然風格
  | 'elegant' // 優雅女性名
  | 'food' // 食物飲料
  | 'internet' // 網路迷因
  | 'occupation' // 職業相關
  | 'custom'; // 用戶自訂

export interface PunName {
  kanji: string;
  romaji: string;
  meaning: string;
  /** 分類標籤 */
  category?: PunNameCategory;
  /** 是否為用戶自訂 */
  isCustom?: boolean;
}

/** 用戶自訂諧音梗 */
export interface CustomPunName extends PunName {
  isCustom: true;
  createdAt: string;
}

export interface GeneratorState {
  originalSurname: string;
  originalGivenName: string;
  japaneseSurname: string;
  punName: PunName;
  step: 'input' | 'result';
}
