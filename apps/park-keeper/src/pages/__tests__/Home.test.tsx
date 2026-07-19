/**
 * Home.tsx 骨架/錯誤條件渲染 + FAB aria-label 測試（issue #714 S5）。
 * 僅覆蓋本 stream 新增的狀態缺口與 a11y 行為；Home 內部其餘互動（QuickEntry/
 * NavOverlay/SettingsTab）以 stub 取代，避免拖入非本 stream 範圍的重型依賴。
 */
// fake-indexeddb 讓 `'indexedDB' in window` 於 happy-path 測試中回傳 true，
// 對應正式瀏覽器環境；jsdom 預設不含 IndexedDB。
import 'fake-indexeddb/auto';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
vi.mock('@app/park-keeper/services/mapTileCache', () => ({
  syncMapTileCacheConfig: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@app/park-keeper/services/db', () => ({
  dbService: {
    getSettings: mockGetSettings,
    getRecords: mockGetRecords,
    saveSettings: vi.fn(),
    deleteRecord: vi.fn().mockResolvedValue(undefined),
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
    // 載入態與 SSG 殼同構：hero CTA 與教學入口原位保留（消閃爍/二次 LCP 候選）。
    expect(screen.getByTestId('quick-record-cta')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '捷徑教學' })).toBeInTheDocument();

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

  it('主動作唯一化：底部 + FAB 已移除，手動記錄第三級文字動作可翻譯（issue #753）', async () => {
    mockGetRecords.mockResolvedValue([]);

    renderHome();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '手動記錄（不拍照）' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: '新增停車紀錄' })).toBeNull();
  });

  it('空狀態：拍照 CTA hero 置頂，教學入口具 44px 熱區 class', async () => {
    mockGetRecords.mockResolvedValue([]);

    renderHome();

    await waitFor(() => {
      expect(screen.getByTestId('quick-record-cta')).toBeInTheDocument();
    });
    // hero 變體：≥30dvh 置頂
    expect(screen.getByTestId('quick-record-cta').className).toContain('min-h-[32dvh]');
    expect(screen.queryByTestId('pickup-hero-card')).toBeNull();

    // 空狀態教學卡 accessible name 由完整可見文字組成（WCAG 2.5.3 Label in Name，
    // round-4 Sonnet F3：過窄 aria-label 使 SR 只聽到「捷徑教學」，遺失空狀態說明）。
    const guideLink = screen.getByRole('link', { name: /捷徑教學/ });
    expect(guideLink).toHaveAccessibleName(/尚無停車紀錄[\s\S]*設定捷徑[\s\S]*捷徑教學/);
    expect(guideLink.className).toContain('min-h-11');
  });

  it('空狀態：隱藏搜尋框，避免對空列表呈現死 UI（issue #753）', async () => {
    mockGetRecords.mockResolvedValue([]);

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('尚無停車紀錄')).toBeInTheDocument();
    });
    expect(screen.queryByPlaceholderText('搜尋...')).toBeNull();
  });

  it('有現役記錄：搜尋框照常顯示（issue #753 僅 0 筆時隱藏）', async () => {
    const record: ParkingRecord = {
      id: 'r1',
      plateNumber: 'ABC-1234',
      floor: 'B2',
      notes: '',
      timestamp: Date.now() - 60_000,
      hasPhoto: false,
    };
    mockGetRecords.mockResolvedValue([record]);

    renderHome();

    await screen.findByTestId('pickup-hero-card');
    expect(screen.getByPlaceholderText('搜尋...')).toBeInTheDocument();
  });

  it('有現役記錄：取車 hero 卡置頂、拍照 CTA 降為 compact 且列於 hero 之後', async () => {
    const record: ParkingRecord = {
      id: 'r1',
      plateNumber: 'ABC-1234',
      floor: 'B2',
      notes: '',
      timestamp: Date.now() - 60_000,
      hasPhoto: false,
    };
    mockGetRecords.mockResolvedValue([record]);

    renderHome();

    const hero = await screen.findByTestId('pickup-hero-card');
    const cta = screen.getByTestId('quick-record-cta');

    // DOM 順序：hero 卡在 CTA 之前（取車任務優先）
    expect(hero.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // compact 變體：不再佔 30dvh
    expect(cta.className).not.toContain('min-h-[32dvh]');
    // 樓層 display 級字存在
    expect(screen.getAllByText('B2').length).toBeGreaterThan(0);
  });

  it('僅一筆記錄時列表卡降為精簡列，避免與 hero 卡同筆資訊重複（issue #733）', async () => {
    const record: ParkingRecord = {
      id: 'r1',
      plateNumber: 'ABC-1234',
      floor: 'B2',
      notes: '',
      timestamp: Date.now() - 60_000,
      hasPhoto: false,
    };
    mockGetRecords.mockResolvedValue([record]);

    renderHome();

    await screen.findByTestId('pickup-hero-card');
    // 精簡列：照片＋地圖列不渲染；車牌編輯與刪除等管理操作保留。
    expect(screen.queryByTestId('record-card-media')).toBeNull();
    expect(screen.getByLabelText('刪除停車記錄 ABC-1234')).toBeInTheDocument();
  });

  it('兩筆以上記錄時列表卡維持完整卡（含照片＋地圖列）', async () => {
    const base = {
      plateNumber: 'ABC-1234',
      floor: 'B2',
      notes: '',
      hasPhoto: false,
    };
    mockGetRecords.mockResolvedValue([
      { ...base, id: 'r1', timestamp: Date.now() - 60_000 },
      { ...base, id: 'r2', plateNumber: 'XYZ-5678', timestamp: Date.now() - 120_000 },
    ] satisfies ParkingRecord[]);

    renderHome();

    await screen.findByTestId('pickup-hero-card');
    expect(screen.getAllByTestId('record-card-media')).toHaveLength(2);
  });

  it('兩筆記錄刪除一筆後，剩餘一筆列表卡即時降為精簡列（issue #733）', async () => {
    const base = {
      plateNumber: 'ABC-1234',
      floor: 'B2',
      notes: '',
      hasPhoto: false,
    };
    const remaining = { ...base, id: 'r1', timestamp: Date.now() - 60_000 };
    const removed = {
      ...base,
      id: 'r2',
      plateNumber: 'XYZ-5678',
      timestamp: Date.now() - 120_000,
    };
    mockGetRecords
      .mockResolvedValueOnce([remaining, removed] satisfies ParkingRecord[])
      .mockResolvedValueOnce([remaining] satisfies ParkingRecord[]);

    renderHome();

    await screen.findByTestId('pickup-hero-card');
    expect(screen.getAllByTestId('record-card-media')).toHaveLength(2);

    fireEvent.click(screen.getByLabelText('刪除停車記錄 XYZ-5678'));

    // 刪除後重載列表：僅剩一筆且該筆即 hero → 照片＋地圖列即時收合。
    await waitFor(() => {
      expect(screen.queryByTestId('record-card-media')).toBeNull();
    });
    // 剩餘卡管理操作（刪除入口）仍保留，hero 卡不受影響。
    expect(screen.getByLabelText('刪除停車記錄 ABC-1234')).toBeInTheDocument();
    expect(screen.getByTestId('pickup-hero-card')).toBeInTheDocument();
  });
});
