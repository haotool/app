/**
 * Tools Data - Single Source of Truth
 *
 * 工具卡資料 SSOT
 * 連結一律為相對於 app.haotool.org 網域根的路徑，host 由 APP_INFO.appsHostUrl 集中管理。
 */
import { APP_INFO } from './app-info';

export const TOOL_CATEGORIES = ['工具類', '創意類', '教育類'] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export interface Tool {
  /** 唯一識別（與子 app 路徑一致） */
  id: string;
  /** 顯示名稱 */
  name: string;
  /** 分類 */
  category: ToolCategory;
  /** 一句話定位（卡片描述） */
  description: string;
  /** 相對於 app.haotool.org 網域根的路徑（統一尾斜線） */
  path: string;
  /** 工具品牌 icon（沿用各 app PWA icon，相對於 app.haotool.org 網域根） */
  iconPath: string;
  /** 技術 chips（caption 常駐） */
  techChips: readonly string[];
  /** 上線狀態 */
  status: 'live' | 'beta';
}

export const TOOLS: readonly Tool[] = [
  {
    id: 'ratewise',
    name: 'HaoRate 匯率好工具',
    category: '工具類',
    description: '台銀銀行賣出價即時換算，30 天趨勢圖，離線可用——台灣最精準的匯率工具',
    path: '/ratewise/',
    iconPath: '/ratewise/pwa-192x192.png',
    techChips: ['React 19', 'PWA', 'SSG'],
    status: 'live',
  },
  {
    id: 'starpuff',
    name: '星噗噗 StarPuff',
    category: '創意類',
    description: '吸入果凍怪、擊敗果凍王的可愛動作小遊戲',
    path: '/starpuff/',
    iconPath: '/starpuff/icons/icon-192.png',
    techChips: ['TypeScript', 'Phaser', 'PWA'],
    status: 'live',
  },
  {
    id: 'split-meow',
    name: '喵喵分帳 Split Meow',
    category: '工具類',
    description: '貓咪主題旅遊分帳，費用分類、一鍵分享結算結果，完全離線',
    path: '/split-meow/',
    iconPath: '/split-meow/icons/icon-192.png',
    techChips: ['React 19', 'PWA', 'Tailwind v4'],
    status: 'live',
  },
  {
    id: 'papertrade',
    name: '紙上交易所 PaperTrade',
    category: '工具類',
    description: '真實即時行情×模擬資金，零風險練習加密貨幣合約交易',
    path: '/papertrade/',
    iconPath: '/papertrade/icons/icon-192.png',
    techChips: ['React 19', 'PWA', '即時行情'],
    status: 'live',
  },
  {
    id: 'park-keeper',
    name: '停車好工具 ParkKeeper',
    category: '工具類',
    description: 'GPS 記錄車位、羅盤導航回車，多語系、離線優先',
    path: '/park-keeper/',
    iconPath: '/park-keeper/icons/icon-192.svg',
    techChips: ['React 19', 'Leaflet', 'i18n'],
    status: 'live',
  },
  {
    id: 'nihonname',
    name: '日本名字產生器 NihonName',
    category: '創意類',
    description: '中文姓氏產生道地日文名，100+ 漢姓對照與歷史脈絡',
    path: '/nihonname/',
    iconPath: '/nihonname/icons/icon-192x192.png',
    techChips: ['React 19', 'SSG', 'PWA'],
    status: 'live',
  },
  {
    id: 'quake-school',
    name: '地震知識小學堂',
    category: '教育類',
    description: '18 道互動測驗＋動畫，搞懂規模與震度，離線防災學習',
    path: '/quake-school/',
    iconPath: '/quake-school/icons/icon-192.svg',
    techChips: ['React 19', 'SSG', 'SVG 動畫'],
    status: 'live',
  },
] as const;

/**
 * 取得工具完整 URL（host SSOT 為 APP_INFO.appsHostUrl）
 */
export function getToolUrl(tool: Pick<Tool, 'path'>): string {
  return new URL(tool.path, APP_INFO.appsHostUrl).toString();
}

/**
 * 取得工具 icon 完整 URL
 */
export function getToolIconUrl(tool: Pick<Tool, 'iconPath'>): string {
  return new URL(tool.iconPath, APP_INFO.appsHostUrl).toString();
}

/**
 * 由資料推導實際存在的分類（剔除無工具的分類）
 */
export function getActiveCategories(): ToolCategory[] {
  return TOOL_CATEGORIES.filter((category) => TOOLS.some((tool) => tool.category === category));
}
