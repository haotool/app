import { lazy, Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { MarketsPage } from './pages/MarketsPage';
import { TradePage } from './pages/TradePage';
import { AssetsPage } from './pages/AssetsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DEFAULT_SYMBOL } from './config/market';

const ChartPage = lazy(() =>
  import('./pages/ChartPage').then((module) => ({ default: module.ChartPage })),
);

function ChartFallback() {
  return (
    <div className="flex flex-col gap-3 p-4" aria-label="圖表載入中">
      <span className="skeleton-pulse h-16 w-full rounded-card" />
      <span className="skeleton-pulse h-[45dvh] w-full rounded-card" />
    </div>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <MarketsPage /> },
      { path: 'chart', element: <Navigate to={`/chart/${DEFAULT_SYMBOL}`} replace /> },
      {
        path: 'chart/:symbol',
        element: (
          <Suspense fallback={<ChartFallback />}>
            <ChartPage />
          </Suspense>
        ),
      },
      { path: 'trade', element: <TradePage /> },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];
