import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToastHost } from './ToastHost';
import { useTradeStore } from '../stores/tradeStore';

describe('ToastHost', () => {
  beforeEach(() => {
    useTradeStore.setState({ toasts: [] });
  });

  it('docks info toasts at the bottom and trading toasts below the page header zone', () => {
    useTradeStore.getState().pushToast({ tone: 'info', title: '離線就緒' });
    useTradeStore.getState().pushToast({ tone: 'long', title: '市價買多成功' });
    render(<ToastHost />);

    const infoContainer = screen.getByText('離線就緒').closest('div[class*="bottom-"]');
    expect(infoContainer).not.toBeNull();
    const topContainer = screen.getByText('市價買多成功').closest('div[class*="top-"]');
    expect(topContainer).toHaveClass('top-24');
  });
});
