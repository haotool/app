import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_VERSION } from '../config/version';
import { useSoundPrefsStore } from '../stores/soundPrefsStore';
import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  beforeEach(() => {
    useSoundPrefsStore.setState({ liquidationSound: true });
  });

  it('關於卡尾行顯示 SSOT 版本號', () => {
    render(<SettingsPage />);
    expect(screen.getByText(`版本 v${APP_VERSION}`)).toBeInTheDocument();
  });

  it('頁根 padding 疊加頂部 safe-area（R6-1）', () => {
    render(<SettingsPage />);
    const root = screen.getByRole('heading', { name: '設定' }).parentElement;
    expect(root).toHaveClass('pt-[calc(1.25rem+var(--sat))]');
  });

  it('強平提示音 toggle 預設開啟且可切換 persist 狀態', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const toggle = screen.getByRole('switch', { name: '強平提示音' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(useSoundPrefsStore.getState().liquidationSound).toBe(false);

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(useSoundPrefsStore.getState().liquidationSound).toBe(true);
  });
});
