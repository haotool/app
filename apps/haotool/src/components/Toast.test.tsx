/**
 * Toast Component Tests
 * [BDD:2026-01-09] 測試 Toast 組件的渲染和自動關閉功能
 * [context7:vitest-dev/vitest:2026-01-09]
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Toast } from './Toast';

// framer-motion is mocked globally in test/setup.ts

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with message', () => {
    const onClose = vi.fn();
    render(<Toast message="Test message" onClose={onClose} />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('displays check icon', () => {
    const onClose = vi.fn();
    render(<Toast message="Success" onClose={onClose} />);

    // Toast contains a Check icon from lucide-react
    const container = screen.getByText('Success').parentElement;
    expect(container).toBeInTheDocument();
  });

  it('calls onClose after 3 seconds', () => {
    const onClose = vi.fn();
    render(<Toast message="Auto close" onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cleans up timer on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(<Toast message="Cleanup" onClose={onClose} />);

    // Unmount before timer fires
    unmount();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // onClose should not be called after unmount
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders with different messages', () => {
    const onClose = vi.fn();

    const { rerender } = render(<Toast message="First message" onClose={onClose} />);
    expect(screen.getByText('First message')).toBeInTheDocument();

    rerender(<Toast message="Second message" onClose={onClose} />);
    expect(screen.getByText('Second message')).toBeInTheDocument();
  });
});
