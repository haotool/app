/**
 * App Info SSOT Tests — 品牌原子與聯絡資訊
 */
import { describe, it, expect } from 'vitest';
import { APP_INFO, AUTHOR_CONTACT_LINKS, getCopyrightNotice } from './app-info';

describe('APP_INFO 品牌原子', () => {
  it('wordmark 拆分為 Hao + Tool 且串接等於 shortName', () => {
    expect(APP_INFO.wordmarkPrefix).toBe('Hao');
    expect(APP_INFO.wordmarkAccent).toBe('Tool');
    expect(`${APP_INFO.wordmarkPrefix}${APP_INFO.wordmarkAccent}`).toBe(APP_INFO.shortName);
  });

  it('副標為好工具，完整名稱由品牌原子衍生', () => {
    expect(APP_INFO.subtitle).toBe('好工具');
    expect(APP_INFO.name).toBe('HaoTool 好工具');
  });

  it('聯絡資訊正確', () => {
    expect(APP_INFO.email).toBe('haotool.org@gmail.com');
    expect(APP_INFO.github).toBe('https://github.com/haotool/app');
    expect(APP_INFO.socialHandle).toBe('@azlife_1224');
    expect(APP_INFO.threadsUrl).toBe('https://www.threads.net/@azlife_1224');
  });

  it('canonical 網域為 haotool.org', () => {
    expect(APP_INFO.siteUrl).toBe('https://haotool.org/');
    expect(APP_INFO.appsHostUrl).toBe('https://app.haotool.org/');
  });

  it('聯絡連結含 Email/GitHub/Threads；Email 不輸出 mailto href（CF 治理）', () => {
    const ids = AUTHOR_CONTACT_LINKS.map((link) => link.id);
    expect(ids).toEqual(['email', 'github', 'threads']);
    const email = AUTHOR_CONTACT_LINKS.find((link) => link.id === 'email');
    expect(email?.href).toBeNull();
  });

  it('版權聲明含品牌與授權', () => {
    const notice = getCopyrightNotice();
    expect(notice).toContain('HaoTool');
    expect(notice).toContain('GPL-3.0');
    expect(notice).toContain('2025');
  });
});
