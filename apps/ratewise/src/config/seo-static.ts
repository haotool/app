// 提供 plain Node 與 Vite 共用的靜態 SEO 文案。
import { APP_INFO } from './app-info';

export const DEFAULT_TITLE = `${APP_INFO.name} — 台銀牌告買賣價匯率換算器 | 顯示實際買賣價，不用中間價`;

export const GUIDE_PAGE_TITLE = `使用指南 — 如何使用 ${APP_INFO.name}換算匯率`;

export const GUIDE_PAGE_DOCUMENT_TITLE = `${GUIDE_PAGE_TITLE} | ${APP_INFO.name}`;
