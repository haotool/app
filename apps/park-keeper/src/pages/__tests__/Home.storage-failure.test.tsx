/**
 * Home × 真實 dbService 整合測試（issue #714 review 補強）：
 * openDB 層失敗（indexedDB.open 拋錯）時，getRecords 必須 throw（不再靜默回 []），
 * Home 的 catch 才能真正設 storageUnavailable 並顯示 role=alert 錯誤卡。
 * 與 Home.test.tsx 的差異：本檔不 mock services/db，走完整 openDB 失敗路徑。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import Home from '../Home';
import i18n from '@app/park-keeper/services/i18n';

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

describe('Home × dbService（openDB 失敗整合路徑）', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  const originalIndexedDB = Object.getOwnPropertyDescriptor(window, 'indexedDB');

  beforeAll(async () => {
    await i18n.changeLanguage('zh-TW');
    // db.ts 於 openDB 失敗時會 console.error/warn，靜音以維持測試輸出乾淨。
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // indexedDB 存在但 open 直接拋錯：繞過 init 的 'indexedDB' in window 早期偵測，
    // 專門驗證 getRecords throw → Home catch → storageUnavailable 這條鏈。
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: {
        open: () => {
          throw new Error('openDB boom');
        },
      },
    });
  });

  afterAll(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    // 還原 window.indexedDB，避免污染同 worker 後續測試檔。
    if (originalIndexedDB) {
      Object.defineProperty(window, 'indexedDB', originalIndexedDB);
    } else {
      delete (window as { indexedDB?: IDBFactory }).indexedDB;
    }
  });

  it('openDB 失敗時應顯示 error.storage_unavailable 錯誤卡（role=alert）', async () => {
    // 首屏含 <Link>（快速記錄/教學入口），需 Router context。
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('無法讀取本機資料庫');
  });
});
