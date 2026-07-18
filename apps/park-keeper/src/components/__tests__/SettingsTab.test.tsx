import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsTab from '../SettingsTab';
import i18n from '@app/park-keeper/services/i18n';
import { THEMES, DEFAULT_SETTINGS, CACHE_DAYS } from '@app/park-keeper/constants';
import type { ThemeConfig } from '@app/park-keeper/types';

const { cleanupCacheMock, clearAllDataMock } = vi.hoisted(() => ({
  cleanupCacheMock: vi.fn(() => Promise.resolve(0)),
  clearAllDataMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('motion/react', () => {
  const motionProps = ['initial', 'animate', 'whileInView', 'viewport', 'transition', 'exit'];
  return {
    LayoutGroup: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
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
            delete domProps['layoutId'];
            return React.createElement(tag, domProps, children);
          };
          Component.displayName = `motion.${String(prop)}`;
          return Component;
        },
      },
    ),
  };
});

vi.mock('@app/park-keeper/services/db', () => ({
  dbService: {
    cleanupCache: cleanupCacheMock,
    clearAllData: clearAllDataMock,
  },
}));

// settings.cache_shrink_warning 三語 key 已就位（issue #714 S5），
// 文案斷言統一固定 zh-TW，不再依賴 call-site defaultValue fallback。
beforeAll(async () => {
  await i18n.changeLanguage('zh-TW');
});

const theme: ThemeConfig = {
  id: 'minimalist',
  name: 'Zen',
  colors: {
    primary: '#1e293b',
    onPrimary: '#ffffff',
    secondary: '#f1f5f9',
    accent: '#3b82f6',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
  },
  font: 'font-minimalist',
  borderRadius: '12px',
  animationType: 'tween',
};

function renderSettingsTab(updateSettings = vi.fn()) {
  const view = render(
    <SettingsTab
      settings={{ ...DEFAULT_SETTINGS }}
      updateSettings={updateSettings}
      theme={theme}
    />,
  );
  return { updateSettings, unmount: view.unmount };
}

describe('SettingsTab – 保存天數滑桿', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('滑桿 min/max 應綁定 CACHE_DAYS SSOT', () => {
    renderSettingsTab();
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', String(CACHE_DAYS.MIN));
    expect(slider).toHaveAttribute('max', String(CACHE_DAYS.MAX));
  });

  it('快速拖曳期間清理應防抖：僅以最後值執行一次', () => {
    renderSettingsTab();
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '10' } });
    fireEvent.change(slider, { target: { value: '20' } });
    fireEvent.change(slider, { target: { value: '3' } });
    expect(cleanupCacheMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(600);
    expect(cleanupCacheMock).toHaveBeenCalledTimes(1);
    expect(cleanupCacheMock).toHaveBeenCalledWith(3);
  });

  it('每次拖曳 tick 仍即時更新設定值（UI 與持久化不防抖）', () => {
    const { updateSettings } = renderSettingsTab();
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '10' } });
    fireEvent.change(slider, { target: { value: '20' } });
    expect(updateSettings).toHaveBeenCalledTimes(2);
    expect(updateSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({ cacheDurationDays: 20 }),
    );
  });

  it('卸載時清除待執行的防抖清理 timer', () => {
    const { unmount } = renderSettingsTab();
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '3' } });
    unmount();

    vi.advanceTimersByTime(600);
    expect(cleanupCacheMock).not.toHaveBeenCalled();
  });

  it('應明示調小天數的單向破壞警告文案', () => {
    renderSettingsTab();
    expect(screen.getByText(/無法復原/)).toBeInTheDocument();
  });
});

describe('SettingsTab – S3 交接：settings.cache_shrink_warning 三語 key', () => {
  afterEach(async () => {
    await i18n.changeLanguage('zh-TW');
  });

  // en/ja 若 key 缺失會 fallback 到 call-site 的 zh defaultValue，斷言即失敗，
  // 可有效驗證三語 key 已就位且被實際消費。
  it.each([
    ['zh-TW', '調小天數將立即清除較舊照片，且無法復原。'],
    ['en', 'Lowering the days immediately removes older photos. This cannot be undone.'],
    ['ja', '日数を減らすと古い写真がすぐに削除されます。元に戻せません。'],
  ])('[%s] 滑桿警告應渲染 i18n 譯文而非 defaultValue', async (lang, expected) => {
    await i18n.changeLanguage(lang);
    renderSettingsTab();
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

describe('SettingsTab – a11y 與主題 token', () => {
  it('主題卡應以 aria-pressed 反映當前啟用狀態，且裝飾色來自 theme.colors.accent', () => {
    renderSettingsTab();

    const activeCard = screen.getByRole('button', { name: theme.name, pressed: true });
    expect(activeCard).toBeInTheDocument();

    for (const th of Object.values(THEMES)) {
      if (th.id === DEFAULT_SETTINGS.theme) continue;
      const card = screen.getByRole('button', { name: th.name, pressed: false });
      expect(card).toBeInTheDocument();
    }
  });

  it('保留天數滑桿應具備 aria-label', () => {
    renderSettingsTab();

    expect(screen.getByRole('slider', { name: '保留天數' })).toBeInTheDocument();
  });
});
