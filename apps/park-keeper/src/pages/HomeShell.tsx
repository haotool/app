import { Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { THEMES, DEFAULT_SETTINGS } from '@app/park-keeper/constants';
import BrandLogo from '@app/park-keeper/components/BrandLogo';
import { pendingCtaPhoto } from '@app/park-keeper/services/pendingCtaPhoto';

/**
 * 首屏 SSG 殼（issue #725 P0 LCP）：與 Home 載入態首屏同構（header＋拍照 hero＋教學入口），
 * FCP/LCP 由預渲染 HTML 直出，不必等 JS 下載與 hydration；掛載後由 Home 原位接手。
 * 拍照 input 以原生 once 監聽轉交 pendingCtaPhoto：殼卸載後相機返回的檔案仍可被 Home 接收。
 */
export default function HomeShell() {
  const { t } = useTranslation();
  const theme = THEMES[DEFAULT_SETTINGS.theme] ?? THEMES['minimalist'];
  if (!theme) throw new Error('Theme config not found');

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden font-sans"
      style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
    >
      {/* glass 不進首屏（issue #753 視覺語言）：與 Home.tsx 首屏 header 同構，避免 hydration 樣式跳動。 */}
      <header
        className="px-6 pb-4 pt-safe-top z-30 border-b border-black/3"
        style={{ backgroundColor: theme.colors.background + 'F0' }}
      >
        <div className="flex justify-between items-center max-w-md mx-auto w-full pt-4">
          <div className="flex items-center gap-3">
            <BrandLogo theme={theme} />
            <h1
              className={`text-2xl font-black tracking-tight ${theme.font} bg-clip-text text-transparent`}
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.colors.text}, ${theme.colors.primary})`,
              }}
            >
              ParkKeeper
            </h1>
          </div>
        </div>
      </header>

      {/* Layout 已提供唯一 main landmark，殼層用 div 與 Home 同構（R6 NEW-3）。 */}
      <div className="flex-1 relative overflow-hidden">
        <div className="h-full overflow-y-auto no-scrollbar px-5 pt-5 pb-40">
          <div className="max-w-md mx-auto space-y-5">
            {/* 與 QuickCaptureCta hero 變體同構（soft depth＋onPrimary），消除 hydration 樣式跳動。 */}
            <label
              data-testid="quick-record-cta"
              className="flex flex-col items-center justify-center gap-3 w-full min-h-[32dvh] rounded-3xl cursor-pointer active:scale-[0.98] transition-transform border border-white/15"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.onPrimary,
                boxShadow: `${theme.colors.primary}33 0px 8px 24px`,
              }}
            >
              <Camera size={44} strokeWidth={2.25} />
              <span className="text-lg font-black tracking-wide">{t('home.quick_record_cta')}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
                {t('record.photo_tap')}
              </span>
              <input
                data-testid="quick-record-cta-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                // 原生監聽（非 React onChange）：殼被 Home 取代後，detached input 的
                // change 事件仍會在相機返回時觸發，檔案經 pendingCtaPhoto 轉交。
                ref={(el) => {
                  el?.addEventListener(
                    'change',
                    () => {
                      const file = el.files?.[0];
                      if (file) pendingCtaPhoto.push(file);
                    },
                    { once: true },
                  );
                }}
              />
            </label>
            <div className="text-center">
              <Link
                to="/guide"
                className="inline-flex items-center justify-center min-h-12 min-w-12 px-4 text-xs font-bold underline underline-offset-4 hover:opacity-80 transition-opacity"
                style={{ color: theme.colors.text }}
              >
                {t('guide.entry')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
