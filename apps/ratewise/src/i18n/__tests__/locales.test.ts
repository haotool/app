import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import en from '../locales/en';
import ja from '../locales/ja';
import ko from '../locales/ko';
import zhTW from '../locales/zh-TW';

type TranslationTree = Record<string, unknown>;

const locales = {
  en,
  ja,
  ko,
  'zh-TW': zhTW,
} as const;

const runtimeI18nGuardFiles = [
  'src/components/OfflineIndicator.tsx',
  'src/components/SkeletonLoader.tsx',
  'src/components/SupportContactLinks.tsx',
  'src/features/ratewise/RateWise.tsx',
  'src/features/ratewise/components/SingleConverter.tsx',
  'src/pages/OpenData.tsx',
  'src/pages/NotFound.tsx',
] as const;

const forbiddenRuntimeTextPatterns = [
  /t\('offline\.[^']+',\s*'[^']+'/,
  /載入即時匯率中/,
  /趨勢圖載入失敗/,
  />查看趨勢圖</,
  /aria-label=\{copied \? '已複製' : '複製'\}/,
  /Support contact links/,
  /推薦最佳/,
  /匯率來源 provider 選單/,
  /title="404 - 找不到頁面"/,
  /頁面錯誤/,
  /aria-label="404 錯誤"/,
  /或許您想前往/,
  /如果您認為這是一個錯誤，請/,
] as const;

function flattenKeys(tree: TranslationTree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value as TranslationTree, path);
    }
    return [path];
  });
}

function getValue(tree: TranslationTree, path: string): unknown {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as TranslationTree)[part];
  }, tree);
}

function interpolationNames(value: string): string[] {
  return [...value.matchAll(/{{\s*([\w.-]+)\s*}}/g)].map((match) => match[1] ?? '').sort();
}

describe('i18n locale coverage', () => {
  const canonicalKeys = flattenKeys(zhTW).sort();

  it('所有語系 key 必須與 zh-TW SSOT 完全一致', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      expect(flattenKeys(messages).sort(), locale).toEqual(canonicalKeys);
    }
  });

  it('所有語系的 interpolation placeholders 必須一致', () => {
    for (const key of canonicalKeys) {
      const canonicalValue = getValue(zhTW, key);
      if (typeof canonicalValue !== 'string') continue;

      const canonicalPlaceholders = interpolationNames(canonicalValue);

      for (const [locale, messages] of Object.entries(locales)) {
        const localizedValue = getValue(messages, key);
        expect(typeof localizedValue, `${locale}.${key}`).toBe('string');
        expect(interpolationNames(localizedValue as string), `${locale}.${key}`).toEqual(
          canonicalPlaceholders,
        );
      }
    }
  });

  it('runtime UI 元件不得保留本批已收斂的硬編中文或 fallback 字串', () => {
    for (const filePath of runtimeI18nGuardFiles) {
      const source = readFileSync(resolve(process.cwd(), filePath), 'utf8');

      for (const pattern of forbiddenRuntimeTextPatterns) {
        expect(source, `${filePath} still contains ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});
