import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsTab from '../SettingsTab';
import { DEFAULT_SETTINGS, CACHE_DAYS } from '@app/park-keeper/constants';
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

const theme: ThemeConfig = {
  id: 'minimalist',
  name: 'Zen',
  colors: {
    primary: '#1e293b',
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
  render(
    <SettingsTab
      settings={{ ...DEFAULT_SETTINGS }}
      updateSettings={updateSettings}
      theme={theme}
    />,
  );
  return updateSettings;
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
    const updateSettings = renderSettingsTab();
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '10' } });
    fireEvent.change(slider, { target: { value: '20' } });
    expect(updateSettings).toHaveBeenCalledTimes(2);
    expect(updateSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({ cacheDurationDays: 20 }),
    );
  });

  it('應明示調小天數的單向破壞警告文案', () => {
    renderSettingsTab();
    expect(screen.getByText(/無法復原/)).toBeInTheDocument();
  });
});
