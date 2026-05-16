/**
 * API 端點 - Single Source of Truth
 *
 * 台銀匯率資料管線相關 URL 集中管理。
 * 所有 CDN 端點、GitHub Raw 端點、Actions 頁面連結從此模組導入。
 */

import { APP_INFO } from './app-info.ts';

// 資料倉庫常數（從 APP_INFO 解析）
const GITHUB_REPO_PATH = APP_INFO.github.replace('https://github.com/', ''); // 'haotool/app'
const DATA_BRANCH = 'data';

/** jsDelivr CDN 資料根路徑 */
export const CDN_DATA_BASE = `https://cdn.jsdelivr.net/gh/${GITHUB_REPO_PATH}@${DATA_BRANCH}`;

/** GitHub Raw 資料根路徑（備援）*/
export const RAW_DATA_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO_PATH}/${DATA_BRANCH}`;

/** 匯率 JSON 相對路徑 */
const RATES_LATEST_PATH = '/public/rates/latest.json';
const RATES_HISTORY_PATH = (date: string) => `/public/rates/history/${date}.json`;
export const PROVIDER_RATES_PATH = {
  latest: (providerId: string) => `/public/rates/providers/${providerId}/latest.json`,
  history: (providerId: string, date: string) =>
    `/public/rates/providers/${providerId}/history/${date}.json`,
  aggregate: (providerId: string) => `/public/rates/providers/${providerId}/history-30d.json`,
} as const;

const MONEYBOX_LATEST_PATH = PROVIDER_RATES_PATH.latest('moneybox');
const MONEYBOX_HISTORY_PATH = (date: string) => PROVIDER_RATES_PATH.history('moneybox', date);

/** 範例歷史日期（文件用途）— 已驗證生產環境 HTTP 200 */
const EXAMPLE_DATE = '2026-03-19';

/**
 * 匯率 API 端點清單
 */
export const RATES_API = {
  /** 最新匯率 CDN 端點（建議使用）*/
  latestCdn: `${CDN_DATA_BASE}${RATES_LATEST_PATH}`,

  /** 最新匯率 GitHub Raw 備援端點 */
  latestRaw: `${RAW_DATA_BASE}${RATES_LATEST_PATH}`,

  /** 歷史匯率 CDN 端點範例（文件展示用）*/
  historyCdnExample: `${CDN_DATA_BASE}${RATES_HISTORY_PATH(EXAMPLE_DATE)}`,

  /** 歷史匯率 GitHub Raw 備援端點範例（文件展示用）*/
  historyRawExample: `${RAW_DATA_BASE}${RATES_HISTORY_PATH(EXAMPLE_DATE)}`,

  moneyboxCdn: `${CDN_DATA_BASE}${MONEYBOX_LATEST_PATH}`,

  moneyboxRaw: `${RAW_DATA_BASE}${MONEYBOX_LATEST_PATH}`,

  moneyboxHistoryCdnExample: `${CDN_DATA_BASE}${MONEYBOX_HISTORY_PATH(EXAMPLE_DATE)}`,

  moneyboxHistoryRawExample: `${RAW_DATA_BASE}${MONEYBOX_HISTORY_PATH(EXAMPLE_DATE)}`,

  /** GitHub Actions 自動同步任務頁面 */
  actionsUrl: `${APP_INFO.github}/actions`,
} as const;
