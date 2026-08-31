import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from './store/useStore';
import { HomeTab } from './components/HomeTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsTab } from './components/SettingsTab';
import { BottomNav } from './components/BottomNav';
import { TripSelector } from './components/TripSelector';
import { UpdatePrompt } from './components/UpdatePrompt';
import { PayerSelector } from './components/PayerSelector';
import { CatCompanion } from './components/CatCompanion';
import { CatPlayLayer, type Particle } from './components/CatPlayLayer';
import { makePawParticle, makeCelebrateParticles } from './lib/catPlay';
import { useCurrencyAutoDetect } from './hooks/useCurrencyAutoDetect';

function ShareButton() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = t('app.title');
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // 使用者取消或不支援，降級為複製
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard 也不可用（罕見）
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => void handleShare()}
        title={t('app.share')}
        aria-label={t('app.share')}
        className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-90 transition-all duration-200 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">{copied ? 'check' : 'share'}</span>
      </button>
      {/* Toast */}
      <div
        className={`absolute top-full right-0 mt-2 px-3 py-1.5 rounded-full bg-inverse-surface text-inverse-on-surface text-xs font-medium whitespace-nowrap shadow-md pointer-events-none transition-all duration-200 ${
          copied ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
        }`}
      >
        {t('app.copied')}
      </div>
    </div>
  );
}

export default function App() {
  const { activeTab, catPlayMode } = useStore();
  const { t } = useTranslation();
  const [particles, setParticles] = useState<Particle[]>([]);
  useCurrencyAutoDetect();
  const prevTabRef = useRef(activeTab);

  // 儲存費用後 activeTab 切換到 history → 觸發慶祝動畫
  useEffect(() => {
    if (catPlayMode && prevTabRef.current !== 'history' && activeTab === 'history') {
      const next = makeCelebrateParticles(10);
      setTimeout(() => setParticles((prev) => [...prev, ...next]), 0);
    }
    prevTabRef.current = activeTab;
  }, [activeTab, catPlayMode]);

  const handlePawParticle = useCallback((x: number, y: number) => {
    setParticles((prev) => [...prev, makePawParticle(x, y)]);
  }, []);

  const handleRemoveParticle = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <div className="min-h-dvh bg-surface text-on-surface font-sans">
      {/* Top Navigation Anchor（含 safe-area-top，瀏海/Dynamic Island 不壓內容） */}
      <header
        className="fixed top-0 w-full z-50 bg-surface-bright/70 backdrop-blur-md flex justify-center"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="w-full max-w-lg flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2 w-full min-w-0">
            <div className="shrink-0 text-base font-medium text-primary flex items-center gap-1.5">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                pets
              </span>
              {/* 窄屏（<368px，含 Fold 344）只留品牌圖示，保障 TripSelector 最小可讀寬 */}
              <span className="hidden xs:inline">{t('app.title')}</span>
            </div>
            <div className="flex-1 min-w-[72px]">
              <TripSelector />
            </div>
            <div className="shrink-0">
              <PayerSelector />
            </div>
            <div className="shrink-0">
              <ShareButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main
        className="px-4 max-w-lg mx-auto"
        style={{ paddingTop: 'calc(64px + env(safe-area-inset-top, 0px))' }}
      >
        {activeTab === 'home' && (
          <HomeTab onPawParticle={catPlayMode ? handlePawParticle : undefined} />
        )}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Bottom gradient fade — masks scrolled content behind the floating BottomNav */}
      <div
        className="fixed inset-x-0 bottom-0 pointer-events-none z-40"
        style={{
          height: 'calc(var(--chrome-bottom) + 2.5rem)',
          background: 'linear-gradient(to top, var(--color-surface) 25%, transparent)',
        }}
        aria-hidden="true"
      />
      <BottomNav />
      <UpdatePrompt />

      {/* Cat Play Mode overlays */}
      {catPlayMode && <CatCompanion />}
      {particles.length > 0 && (
        <CatPlayLayer particles={particles} onRemove={handleRemoveParticle} />
      )}
    </div>
  );
}
