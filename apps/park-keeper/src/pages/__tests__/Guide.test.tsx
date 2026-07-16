import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import Guide from '../Guide';
import i18n from '@app/park-keeper/services/i18n';

const LANGUAGES = ['en', 'zh-TW', 'ja'] as const;

const GUIDE_KEYS = [
  'guide.entry',
  'guide.title',
  'guide.intro',
  'guide.ios_title',
  'guide.ios_prereq',
  'guide.ios_step1',
  'guide.ios_step2',
  'guide.ios_step3',
  'guide.ios_step4',
  'guide.ios_step5',
  'guide.ios_step6',
  'guide.ios_url_note',
  'guide.warning_title',
  'guide.warning_body',
  'guide.android_title',
  'guide.android_step1',
  'guide.android_step2',
  'action.back_home',
] as const;

function renderGuide() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/guide']}>
        <Guide />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('Guide - 捷徑教學頁', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-TW');
  });

  it('渲染標題、iOS 與 Android 段落與儲存分區警告', () => {
    renderGuide();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(i18n.t('guide.title'));
    expect(screen.getByText(i18n.t('guide.ios_title'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('guide.android_title'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('guide.warning_title'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('guide.warning_body'))).toBeInTheDocument();
  });

  it('顯示 webapp:// 設定網址（含尾斜線，與安裝網址一致）', () => {
    renderGuide();

    expect(screen.getByText('webapp://app.haotool.org/park-keeper/')).toBeInTheDocument();
  });

  it('提供返回首頁連結', () => {
    renderGuide();

    expect(screen.getByRole('link', { name: i18n.t('action.back_home') })).toBeInTheDocument();
  });
});

describe('i18n - guide/add 新增 key 三語齊備', () => {
  for (const lang of LANGUAGES) {
    for (const key of GUIDE_KEYS) {
      it(`[${lang}] has key "${key}"`, () => {
        const value = i18n.getFixedT(lang)(key);
        expect(value).not.toBe(key);
        expect(value.length).toBeGreaterThan(0);
      });
    }
  }
});
