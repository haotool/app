import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ConnectionBanner } from './ConnectionBanner';
import { ToastHost } from './ToastHost';
import { DisclaimerDialog } from './DisclaimerDialog';
import { useAutoUpdate } from '../hooks/useAutoUpdate';
import { startMarketFeed } from '../services/marketFeed';
import { unlockAudio } from '../lib/sound';

export function AppShell() {
  useEffect(() => startMarketFeed(), []);
  // 首次使用者手勢解鎖 AudioContext（iOS 必要），強平提示音才能即時播放。
  useEffect(() => unlockAudio(), []);
  useAutoUpdate();

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg text-text lg:max-w-6xl">
      <ConnectionBanner />
      <main className="flex-1 pb-[calc(3.5rem+var(--sab))]">
        <Outlet />
      </main>
      <BottomNav />
      <ToastHost />
      <DisclaimerDialog />
    </div>
  );
}
