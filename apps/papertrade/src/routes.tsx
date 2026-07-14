import { Navigate, type RouteObject } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { MarketsPage } from './pages/MarketsPage';
import { ChartPage } from './pages/ChartPage';
import { TradePage } from './pages/TradePage';
import { AssetsPage } from './pages/AssetsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DEFAULT_SYMBOL } from './config/market';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <MarketsPage /> },
      { path: 'chart', element: <Navigate to={`/chart/${DEFAULT_SYMBOL}`} replace /> },
      { path: 'chart/:symbol', element: <ChartPage /> },
      { path: 'trade', element: <TradePage /> },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];
