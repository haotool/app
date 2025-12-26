/**
 * UpdateToast BDD Tests
 *
 * BDD 階段: Stage 3 GREEN
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { UpdateToast } from '../update-toast';

describe('UpdateToast', () => {
  it('should render when show is true', () => {
    render(<UpdateToast show onClose={vi.fn()} onUpdate={vi.fn()} />);

    expect(screen.getByText('有新版本可用')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '立即更新' })).toBeInTheDocument();
  });

  it('should not render when show is false', () => {
    render(<UpdateToast show={false} onClose={vi.fn()} onUpdate={vi.fn()} />);

    expect(screen.queryByText('有新版本可用')).not.toBeInTheDocument();
  });

  it('should call onClose when dismiss button is clicked', () => {
    const handleClose = vi.fn();
    render(<UpdateToast show onClose={handleClose} onUpdate={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '稍後更新' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onUpdate and show updating state after click', () => {
    const handleUpdate = vi.fn();
    render(<UpdateToast show onClose={vi.fn()} onUpdate={handleUpdate} />);

    const updateButton = screen.getByRole('button', { name: '立即更新' });
    fireEvent.click(updateButton);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    // 組件在 isUpdating 為 true 時不渲染按鈕，改為顯示更新狀態
    expect(screen.queryByRole('button', { name: '立即更新' })).not.toBeInTheDocument();
    expect(screen.getByText('正在更新版本…')).toBeInTheDocument();
  });
});
