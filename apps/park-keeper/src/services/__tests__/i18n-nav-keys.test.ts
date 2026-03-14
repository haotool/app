/**
 * i18n completeness tests – navigation keys added in v1.0.15
 * Verifies all three languages have the new keys before runtime.
 */
import i18n from '@app/park-keeper/services/i18n';

const LANGUAGES = ['en', 'zh-TW', 'ja'] as const;

const NEW_KEYS = [
  'nav.unit_meters',
  'nav.slight_right',
  'nav.slight_left',
  'nav.close_nav',
] as const;

describe('i18n – new navigation keys present in all languages', () => {
  for (const lang of LANGUAGES) {
    for (const key of NEW_KEYS) {
      it(`[${lang}] has key "${key}"`, () => {
        const value = i18n.getFixedT(lang)(key);
        // getFixedT returns the key itself when missing
        expect(value).not.toBe(key);
        expect(value.length).toBeGreaterThan(0);
      });
    }
  }
});
