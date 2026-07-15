/**
 * i18n completeness tests – mobile UIUX debt cleanup (issue #714)
 * 驗證 RecordCard / About / Layout / Home 新增硬編收斂 key 三語皆備，
 * 並確保三語 key 集合完全平行（不遺漏、不多餘）。
 */
import i18n from '@app/park-keeper/services/i18n';

const LANGUAGES = ['en', 'zh-TW', 'ja'] as const;

const NEW_KEYS = [
  'record.yesterday',
  'record.edit_plate',
  'record.edit_plate_icon',
  'record.delete',
  'record.view_photo',
  'record.photo_alt',
  'record.no_map',
  'record.navigate',
  'record.saving',
  'error.storage_unavailable',
  'action.add_record',
  'settings.cache_shrink_warning',
  'footer.about',
  'footer.settings',
  'footer.privacy',
  'footer.rights_reserved',
  'about.subtitle',
  'about.features_heading',
  'about.feature.gps.title',
  'about.feature.gps.desc',
  'about.feature.compass.title',
  'about.feature.compass.desc',
  'about.feature.theme.title',
  'about.feature.theme.desc',
  'about.feature.i18n.title',
  'about.feature.i18n.desc',
  'about.feature.offline.title',
  'about.feature.offline.desc',
  'about.privacy_heading',
  'about.privacy_p1',
  'about.privacy_p2',
  'about.privacy_p3',
] as const;

describe('i18n – S5 行動 UIUX 新增 key 三語皆備', () => {
  for (const lang of LANGUAGES) {
    for (const key of NEW_KEYS) {
      it(`[${lang}] has key "${key}"`, () => {
        const value = i18n.getFixedT(lang)(key);
        // getFixedT 缺 key 時會回傳 key 本身
        expect(value).not.toBe(key);
        expect(value.length).toBeGreaterThan(0);
      });
    }
  }
});

describe('i18n – en/zh-TW/ja 三語 key 集合完全平行', () => {
  it('三語資源的 key 集合應完全相同', () => {
    const [en, zhTW, ja] = LANGUAGES.map((lang) => {
      const bundle: Record<string, string> = i18n.getResourceBundle(lang, 'translation') ?? {};
      return Object.keys(bundle).sort();
    });
    expect(zhTW).toEqual(en);
    expect(ja).toEqual(en);
  });
});
