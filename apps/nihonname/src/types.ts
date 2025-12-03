/**
 * Type definitions for NihonName
 */

export type SurnameData = Record<string, string[]>;

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
