import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg text-text">
      <main className="flex-1 pb-[calc(3.5rem+var(--sab))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
