import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getInitialLanguage,
  getLanguageDetectionOrder,
  getPreferredClientLanguage,
  LANGUAGE_STORAGE_KEY,
} from './index';

describe('i18n environment bootstrap', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('locks SSR and the first client hydration render to the default zh-TW locale', () => {
    expect(getInitialLanguage()).toBe('zh-TW');
    expect(getLanguageDetectionOrder(false, false)).toEqual([]);
  });

  it('uses browser detectors only when a DOM is available', () => {
    expect(getLanguageDetectionOrder(true, false)).toEqual(['htmlTag', 'navigator']);
    expect(getLanguageDetectionOrder(true, true)).toEqual(['localStorage', 'htmlTag', 'navigator']);
  });

  it('applies stored language preference after hydration with html language as default', () => {
    expect(
      getPreferredClientLanguage({
        storageLanguage: 'en',
        htmlLanguage: 'zh-TW',
        navigatorLanguage: 'ja-JP',
      }),
    ).toBe('en');
    expect(
      getPreferredClientLanguage({
        storageLanguage: null,
        htmlLanguage: 'zh-Hant',
        navigatorLanguage: 'en-US',
      }),
    ).toBe('zh-TW');
    expect(
      getPreferredClientLanguage({
        storageLanguage: null,
        htmlLanguage: '',
        navigatorLanguage: 'ko-KR',
      }),
    ).toBe('ko');
  });

  it('does not overwrite an existing stored language during the default zh-TW bootstrap', async () => {
    vi.resetModules();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

    await import('./index');

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });
});
