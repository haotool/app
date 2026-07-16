/**
 * Home.tsx 骨架/錯誤條件渲染 + FAB aria-label 測試（issue #714 S5）。
 * 僅覆蓋本 stream 新增的狀態缺口與 a11y 行為；Home 內部其餘互動（QuickEntry/
 * NavOverlay/SettingsTab）以 stub 取代，避免拖入非本 stream 範圍的重型依賴。
 */
// fake-indexeddb 讓 `'indexedDB' in window` 於 happy-path 測試中回傳 true，
// 對應正式瀏覽器環境；jsdom 預設不含 IndexedDB。
import 'fake-indexeddb/auto';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import Home from '../Home';
import { DEFAULT_SETTINGS } from '@app/park-keeper/constants';
import type { ParkingRecord } from '@app/park-keeper/types';
import i18n from '@app/park-keeper/services/i18n';

const { mockGetSettings, mockGetRecords } = vi.hoisted(() => ({
  mockGetSettings: vi.fn(),
  mockGetRecords: vi.fn(),
}));

vi.mock('motion/react', () => {
  const motionProps = [
    'variants',
    'initial',
    'animate',
    'exit',
    'whileTap',
    'whileHover',
    'transition',
    'layout',
    'layoutId',
  ];
  return {
    motion: new Proxy(
      {},
      {
        get(_target, prop) {
          const Component = ({
            children,
            ...props
          }: { children?: React.ReactNode } & Record<string, unknown>) => {
            const tag = String(prop);
            const domProps = { ...props };
            motionProps.forEach((key) => delete domProps[key]);
            return React.createElement(tag, domProps, children);
          };
          Component.displayName = `motion.${String(prop)}`;
          return Component;
        },
      },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    LayoutGroup: ({ children }: { children: React.ReactNode }) => children,
    useReducedMotion: () => false,
  };
});

vi.mock('@app/park-keeper/components/QuickEntry', () => ({ default: () => null }));
vi.mock('@app/park-keeper/components/NavOverlay', () => ({ default: () => null }));
vi.mock('@app/park-keeper/components/SettingsTab', () => ({ default: () => null }));
vi.mock('@app/park-keeper/components/BrandLogo', () => ({ default: () => null }));
vi.mock('@app/park-keeper/components/UpdatePrompt', () => ({ UpdatePrompt: () => null }));
vi.mock('@app/park-keeper/services/mapTileCache', () => ({
  syncMapTileCacheConfig: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@app/park-keeper/services/db', () => ({
  dbService: {
    getSettings: mockGetSettings,
    getRecords: mockGetRecords,
    saveSettings: vi.fn(),
    runStartupCleanup: vi.fn().mockResolvedValue(0),
  },
}));

// 首屏含 <Link>（快速記錄/教學入口），需 Router context。
function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe('Home', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-TW');
  });

  beforeEach(() => {
    mockGetSettings.mockResolvedValue(DEFAULT_SETTINGS);
  });

  it('IndexedDB 讀取期間顯示骨架，完成後顯示空狀態', async () => {
    let resolveRecords: (value: ParkingRecord[]) => void = () => {};
    mockGetRecords.mockReturnValue(
      new Promise((resolve) => {
        resolveRecords = resolve;
      }),
    );

    const { container } = renderHome();

    expect(container.querySelector('.animate-pulse')).not.toBeNull();

    resolveRecords([]);

    await waitFor(() => {
      expect(container.querySelector('.animate-pulse')).toBeNull();
    });
    expect(screen.getByText('尚無停車紀錄')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('IndexedDB 讀取失敗時顯示錯誤提示卡（role=alert）', async () => {
    mockGetRecords.mockRejectedValue(new Error('boom'));

    renderHome();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('無法讀取本機資料庫');
  });

  it('FAB 應具備可翻譯的 aria-label', async () => {
    mockGetRecords.mockResolvedValue([]);

    renderHome();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '新增停車紀錄' })).toBeInTheDocument();
    });
  });
});
