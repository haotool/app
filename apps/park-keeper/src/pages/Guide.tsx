/**
 * /guide 捷徑教學頁：iOS 藍牙斷線自動化（webapp://）與 Android 長按圖示捷徑設定步驟。
 * i18n 三語；含 Safari 與已安裝 PWA 儲存分區警告。
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SITE_CONFIG } from '../../app.config.mjs';

// webapp:// 必須與安裝時網址字元級一致（含尾斜線），自 SSOT 網址推導。
const WEBAPP_URL = SITE_CONFIG.url.replace(/^https:/, 'webapp:');

const IOS_STEP_KEYS = [
  'guide.ios_step1',
  'guide.ios_step2',
  'guide.ios_step3',
  'guide.ios_step4',
  'guide.ios_step5',
  'guide.ios_step6',
] as const;

const ANDROID_STEP_KEYS = ['guide.android_step1', 'guide.android_step2'] as const;

export default function Guide() {
  const { t } = useTranslation();

  return (
    <article className="min-h-screen max-w-2xl mx-auto px-6 pb-16 pt-safe-top">
      <header className="pt-8 pb-6">
        <Link
          to="/"
          aria-label={t('action.back_home')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          {t('action.back_home')}
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">{t('guide.title')}</h1>
        <p className="text-slate-600 mt-3 leading-relaxed">{t('guide.intro')}</p>
      </header>

      <section aria-labelledby="guide-ios" className="mb-10">
        <h2 id="guide-ios" className="text-xl font-bold text-slate-800 mb-3">
          {t('guide.ios_title')}
        </h2>
        <p className="text-sm text-slate-600 mb-4">{t('guide.ios_prereq')}</p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
          {IOS_STEP_KEYS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
        <div className="mt-4 p-4 rounded-xl bg-slate-100 border border-slate-200">
          <code className="text-sm font-mono text-slate-800 break-all">{WEBAPP_URL}</code>
        </div>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">{t('guide.ios_url_note')}</p>
      </section>

      <section
        aria-labelledby="guide-warning"
        className="mb-10 p-4 rounded-xl bg-amber-50 border border-amber-200"
      >
        <h2 id="guide-warning" className="flex items-center gap-2 font-bold text-amber-800 mb-2">
          <TriangleAlert size={18} aria-hidden />
          {t('guide.warning_title')}
        </h2>
        <p className="text-sm text-amber-800 leading-relaxed">{t('guide.warning_body')}</p>
      </section>

      <section aria-labelledby="guide-android" className="mb-10">
        <h2 id="guide-android" className="text-xl font-bold text-slate-800 mb-3">
          {t('guide.android_title')}
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
          {ANDROID_STEP_KEYS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
      </section>
    </article>
  );
}
