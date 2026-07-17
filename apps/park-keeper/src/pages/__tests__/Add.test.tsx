import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import Add from '../Add';
import i18n from '@app/park-keeper/services/i18n';
import { dbService } from '@app/park-keeper/services/db';
import type { ParkingRecord } from '@app/park-keeper/types';

interface QuickEntryStubProps {
  onSave: (record: Partial<ParkingRecord>) => void | Promise<void>;
  onClose: () => void;
  isVisible: boolean;
  mode?: 'sheet' | 'fullscreen';
}

// Add 頁只驗證接線（query 白名單、儲存後摘要），QuickEntry 本體另有測試。
vi.mock('@app/park-keeper/components/QuickEntry', () => ({
  default: ({ onSave, onClose, isVisible, mode }: QuickEntryStubProps) =>
    isVisible ? (
      <div data-testid="quick-entry-stub" data-mode={mode}>
        <button
          type="button"
          onClick={() => {
            void Promise.resolve(
              onSave({ plateNumber: 'ABC-1234', floor: 'B2', hasPhoto: false }),
            ).then(onClose);
          }}
        >
          stub-save
        </button>
        <button
          type="button"
          onClick={() => {
            void Promise.resolve(onSave({ floor: 'B1', hasPhoto: false })).then(onClose);
          }}
        >
          stub-save-no-plate
        </button>
      </div>
    ) : null,
}));

function renderAdd(initialEntry: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Add />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('Add - /add 快速記錄頁', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-TW');
  });

  it('以 fullscreen 模式掛載 QuickEntry，並顯示返回首頁鍵', async () => {
    renderAdd('/add');

    const stub = await screen.findByTestId('quick-entry-stub');
    expect(stub).toHaveAttribute('data-mode', 'fullscreen');
    expect(screen.getByLabelText(i18n.t('action.back_home'))).toBeInTheDocument();
  });

  it('from=shortcut 隱藏返回鍵（analytics-free UI 微調）', async () => {
    renderAdd('/add?from=shortcut');

    await screen.findByTestId('quick-entry-stub');
    expect(screen.queryByLabelText(i18n.t('action.back_home'))).not.toBeInTheDocument();
  });

  it('未知 from 值靜默降級且不 render 原始字串', async () => {
    const evil = '<script>alert(1)</script>';
    const { container } = renderAdd(`/add?from=${encodeURIComponent(evil)}`);

    await screen.findByTestId('quick-entry-stub');
    // 靜默降級：視同無參數，返回鍵照常顯示。
    expect(screen.getByLabelText(i18n.t('action.back_home'))).toBeInTheDocument();
    // 原始字串不得出現在 DOM。
    expect(container.innerHTML).not.toContain('alert(1)');
  });

  it('白名單大小寫敏感：from=Shortcut 視為未知值靜默降級', async () => {
    renderAdd('/add?from=Shortcut');

    await screen.findByTestId('quick-entry-stub');
    expect(screen.getByLabelText(i18n.t('action.back_home'))).toBeInTheDocument();
  });

  it('多值 from 取第一個：from=evil&from=shortcut 視為未知值靜默降級', async () => {
    renderAdd('/add?from=evil&from=shortcut');

    await screen.findByTestId('quick-entry-stub');
    // URLSearchParams.get 取首值 evil，不在白名單 → 降級顯示返回鍵。
    expect(screen.getByLabelText(i18n.t('action.back_home'))).toBeInTheDocument();
  });

  it('儲存成功後顯示摘要（樓層/車號/未記錄位置）與返回首頁', async () => {
    const saveSpy = vi.spyOn(dbService, 'saveRecord').mockResolvedValue(undefined);

    renderAdd('/add');

    fireEvent.click(await screen.findByText('stub-save'));

    await waitFor(() => {
      expect(screen.getByText(i18n.t('add.summary_hint'))).toBeInTheDocument();
    });
    expect(saveSpy).toHaveBeenCalledTimes(1);
    const saved = saveSpy.mock.calls[0]![0];
    expect(saved.plateNumber).toBe('ABC-1234');
    expect(saved.floor).toBe('B2');
    expect(saved.latitude).toBeUndefined();

    expect(screen.getByText('B2')).toBeInTheDocument();
    expect(screen.getByText(/ABC-1234/)).toBeInTheDocument();
    // 無座標時明示未記錄位置。
    expect(screen.getByText(i18n.t('record.no_location'))).toBeInTheDocument();
    // header 返回箭頭（aria-label）與摘要 CTA（可見文字）同名，斷言摘要 CTA 存在。
    const backLinks = screen.getAllByRole('link', { name: i18n.t('action.back_home') });
    expect(backLinks.some((el) => el.textContent === i18n.t('action.back_home'))).toBe(true);

    saveSpy.mockRestore();
  });

  it('未填車號儲存後摘要顯示待填文案而非裸露 N/A（formatPlate SSOT，round-2 R2-U2）', async () => {
    const saveSpy = vi.spyOn(dbService, 'saveRecord').mockResolvedValue(undefined);

    renderAdd('/add');

    fireEvent.click(await screen.findByText('stub-save-no-plate'));

    await waitFor(() => {
      expect(screen.getByText(i18n.t('add.summary_hint'))).toBeInTheDocument();
    });
    // 儲存層仍以 sentinel 佔位。
    expect(saveSpy.mock.calls[0]![0].plateNumber).toBe('N/A');
    // 顯示層與 RecordCard／PickupHeroCard／NavOverlay 一致：待填文案，不裸露 N/A。
    expect(screen.getByText(new RegExp(i18n.t('record.plate_unset')))).toBeInTheDocument();
    expect(screen.queryByText(/N\/A/)).toBeNull();

    saveSpy.mockRestore();
  });

  it('入頁觸發 runStartupCleanup 且主題 token 完整接線（issue #725）', async () => {
    const cleanupSpy = vi.spyOn(dbService, 'runStartupCleanup').mockResolvedValue(0);

    renderAdd('/add');
    await screen.findByTestId('quick-entry-stub');

    await waitFor(() => expect(cleanupSpy).toHaveBeenCalledTimes(1));

    // 主題 token 集合與 Home 一致（含 accent/secondary/text-muted/primary-rgb）。
    const rootStyle = document.documentElement.style;
    for (const token of [
      '--color-primary',
      '--color-bg',
      '--color-surface',
      '--color-text',
      '--color-accent',
      '--color-secondary',
      '--color-text-muted',
      '--color-primary-rgb',
    ]) {
      expect(rootStyle.getPropertyValue(token)).not.toBe('');
    }

    cleanupSpy.mockRestore();
  });

  it('runStartupCleanup 失敗不阻斷 /add 記錄流程', async () => {
    const cleanupSpy = vi
      .spyOn(dbService, 'runStartupCleanup')
      .mockRejectedValue(new Error('cleanup boom'));
    const saveSpy = vi.spyOn(dbService, 'saveRecord').mockResolvedValue(undefined);

    renderAdd('/add');

    fireEvent.click(await screen.findByText('stub-save'));
    await waitFor(() => {
      expect(screen.getByText(i18n.t('add.summary_hint'))).toBeInTheDocument();
    });

    cleanupSpy.mockRestore();
    saveSpy.mockRestore();
  });
});
