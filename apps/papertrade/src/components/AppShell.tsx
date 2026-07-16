import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ConnectionBanner } from './ConnectionBanner';
import { ToastHost } from './ToastHost';
import { DisclaimerDialog } from './DisclaimerDialog';
import { useAutoUpdate } from '../hooks/useAutoUpdate';
import { startMarketFeed } from '../services/marketFeed';

export function AppShell() {
  useEffect(() => startMarketFeed(), []);
  useAutoUpdate();

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg text-text">
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
