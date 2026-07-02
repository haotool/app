/**
 * SplashScreen - 品牌啟動頁（Twin Coins LOGO 動畫）
 *
 * 顯示規則：
 * 1. 僅在 PWA standalone（已安裝）冷啟動時自動顯示，瀏覽器分頁不顯示，
 *    避免影響 SEO 爬蟲與 Lighthouse LCP/TBT 量測。
 * 2. 設定頁可關閉（localStorage 持久化），亦可透過自訂事件手動預覽。
 * 3. 動畫僅使用 transform/opacity；prefers-reduced-motion 時停用位移動畫並縮短停留。
 *
 * 視覺 SSOT：scripts/source-images/brand/showcase-twincoins.html（啟動頁 Splash 區塊）。
 * 偏好與決策邏輯：utils/splashPreference.ts。
 */

import { useCallback, useEffect, useState } from 'react';
import { BrandWordmark } from './BrandWordmark';
import { APP_INFO } from '../config/app-info';
import {
  consumeSplashAutoShow,
  prefersReducedMotion,
  SPLASH_PREVIEW_EVENT,
} from '../utils/splashPreference';

const SPLASH_HOLD_MS = 1500;
const SPLASH_HOLD_REDUCED_MS = 900;
const SPLASH_EXIT_MS = 400;

type SplashPhase = 'hidden' | 'enter' | 'exit';

export function SplashScreen() {
  const [phase, setPhase] = useState<SplashPhase>('hidden');

  // 自動顯示：SSR/hydration 一律先渲染 null，掛載後以 macrotask 顯示，
  // 避免 SSG hydration mismatch，也符合 set-state-in-effect 規範（非同步邊界）。
  useEffect(() => {
    if (!consumeSplashAutoShow()) return;
    const timer = window.setTimeout(() => setPhase('enter'), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // 設定頁預覽事件：無條件重播（使用者主動觸發）。
  useEffect(() => {
    const handlePreview = () => setPhase('enter');
    window.addEventListener(SPLASH_PREVIEW_EVENT, handlePreview);
    return () => window.removeEventListener(SPLASH_PREVIEW_EVENT, handlePreview);
  }, []);

  // enter → 停留後淡出；exit → 淡出結束後卸載。
  useEffect(() => {
    if (phase === 'hidden') return;
    const delay =
      phase === 'enter'
        ? prefersReducedMotion()
          ? SPLASH_HOLD_REDUCED_MS
          : SPLASH_HOLD_MS
        : SPLASH_EXIT_MS;
    const timer = window.setTimeout(() => {
      setPhase((current) => (current === 'enter' ? 'exit' : 'hidden'));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // 點擊任意處提前結束（純指標捷徑；啟動頁本身會自動關閉）。
  const handleSkip = useCallback(() => {
    setPhase((current) => (current === 'enter' ? 'exit' : current));
  }, []);

  if (phase === 'hidden') return null;

  return (
    <div
      className="ratewise-splash"
      data-phase={phase}
      data-testid="splash-screen"
      aria-hidden="true"
      onClick={handleSkip}
    >
      <svg
        className="splash-mark"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width="96"
        height="96"
      >
        <defs>
          <linearGradient id="splash-mk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#55A3FF" />
            <stop offset="0.5" stopColor="#3182F6" />
            <stop offset="1" stopColor="#1B64DA" />
          </linearGradient>
          <filter id="splash-halo-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <g className="splash-halo" filter="url(#splash-halo-blur)" opacity="0.18">
          <circle cx="38" cy="50" r="18" fill="#3182F6" />
          <circle cx="62" cy="50" r="18" fill="none" stroke="#3182F6" strokeWidth="7.5" />
        </g>
        <g className="splash-coin-solid">
          <circle cx="38" cy="50" r="18" fill="url(#splash-mk)" />
        </g>
        <g className="splash-coin-ring">
          <circle
            cx="62"
            cy="50"
            r="18"
            fill="#F7FAFF"
            stroke="url(#splash-mk)"
            strokeWidth="7.5"
          />
        </g>
      </svg>
      <BrandWordmark className="splash-wordmark" />
      <span className="splash-tagline brand-subtitle">{APP_INFO.subtitle}</span>
    </div>
  );
}
