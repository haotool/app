import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickCaptureCta from '../QuickCaptureCta';
import { THEMES } from '@app/park-keeper/constants';

const theme = THEMES['minimalist']!;

describe('QuickCaptureCta', () => {
  it('未提供 onManualEntry 時不渲染第三級文字動作', () => {
    render(
      <QuickCaptureCta
        theme={theme}
        variant="hero"
        label="拍照快速記錄"
        hint="輕觸拍照"
        onPhotoSelected={vi.fn()}
      />,
    );

    expect(screen.queryByText('手動記錄（不拍照）')).toBeNull();
  });

  it.each(['hero', 'compact'] as const)(
    '%s 變體提供 onManualEntry 時渲染第三級文字動作並可觸發（issue #753 FAB 職能遷移）',
    (variant) => {
      const onManualEntry = vi.fn();
      render(
        <QuickCaptureCta
          theme={theme}
          variant={variant}
          label="拍照快速記錄"
          hint="輕觸拍照"
          onPhotoSelected={vi.fn()}
          onManualEntry={onManualEntry}
          manualEntryLabel="手動記錄（不拍照）"
        />,
      );

      const trigger = screen.getByRole('button', { name: '手動記錄（不拍照）' });
      fireEvent.click(trigger);
      expect(onManualEntry).toHaveBeenCalledTimes(1);
    },
  );
});
