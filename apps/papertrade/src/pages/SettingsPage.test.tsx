import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { APP_VERSION } from '../config/version';
import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  it('關於卡尾行顯示 SSOT 版本號', () => {
    render(<SettingsPage />);
    expect(screen.getByText(`版本 v${APP_VERSION}`)).toBeInTheDocument();
  });
});
