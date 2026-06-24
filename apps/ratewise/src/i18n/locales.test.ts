import { describe, expect, it } from 'vitest';
import zhTW from './locales/zh-TW';
import en from './locales/en';
import ja from './locales/ja';
import ko from './locales/ko';

type TranslationTree = Record<string, unknown>;

const localeBundles = {
  'zh-TW': zhTW,
  en,
  ja,
  ko,
} satisfies Record<string, TranslationTree>;

const supportEntryDescriptionKeys = [
  'settings.supportInfoDesc',
  'settings.faqDesc',
  'settings.usageGuideDesc',
  'settings.aboutUsDesc',
  'settings.openDataApiDesc',
  'settings.seoTechDesc',
  'settings.privacyPolicyDesc',
] as const;

function collectLeafPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value as TranslationTree).flatMap(([key, child]) =>
    collectLeafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

function getPath(bundle: TranslationTree, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }

    return (current as TranslationTree)[key];
  }, bundle);
}

describe('support page localization', () => {
  it('keeps supportPages namespace structurally aligned across locales', () => {
    const zhPaths = collectLeafPaths(zhTW.supportPages).sort();

    Object.entries(localeBundles).forEach(([locale, bundle]) => {
      expect(collectLeafPaths(bundle.supportPages).sort(), locale).toEqual(zhPaths);
    });
  });

  it('provides task-oriented descriptions for every support entry card', () => {
    Object.entries(localeBundles).forEach(([locale, bundle]) => {
      supportEntryDescriptionKeys.forEach((key) => {
        expect(getPath(bundle, key), `${locale}:${key}`).toEqual(expect.any(String));
        expect((getPath(bundle, key) as string).trim(), `${locale}:${key}`).not.toHaveLength(0);
      });
    });
  });

  it('does not expose internal AI-governance jargon in settings support cards', () => {
    expect(zhTW.settings.seoTechDesc).not.toContain('AI 引用治理');
    expect(en.settings.seoTechDesc).not.toContain('AI citation governance');
    expect(ja.settings.seoTechDesc).not.toContain('AI 引用ガバナンス');
    expect(ko.settings.seoTechDesc).not.toContain('AI 인용 거버넌스');
  });
});
