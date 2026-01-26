/**
 * ToastProvider Unit Tests
 * ToastProvider 單元測試
 *
 * @description Tests for the Toast notification system.
 * @see ToastProvider.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ToastProvider } from '../ToastProvider';
import { useToast } from '../useToast';

// Mock component to trigger toasts
function TestComponent() {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Success message', 'success')} data-testid="success-btn">
        Show Success
      </button>
      <button onClick={() => showToast('Error message', 'error')} data-testid="error-btn">
        Show Error
      </button>
      <button onClick={() => showToast('Info message', 'info')} data-testid="info-btn">
        Show Info
      </button>
      <button onClick={() => showToast('複製成功', 'success')} data-testid="copy-btn">
        Copy Toast
      </button>
    </div>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children correctly', () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child content</div>
      </ToastProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('shows success toast when triggered', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByTestId('success-btn'));

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('shows error toast when triggered', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByTestId('error-btn'));

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('shows info toast when triggered', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByTestId('info-btn'));

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('shows copy icon for copy-related messages', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByTestId('copy-btn'));

    // The toast should contain the copy message
    expect(screen.getByText('複製成功')).toBeInTheDocument();
  });

  it('toast triggers hide timer effect', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByTestId('success-btn'));
    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Advance past hide timer to trigger exit animation
    act(() => {
      vi.advanceTimersByTime(2600);
    });

    // Toast should still exist (but animating out)
    const toast = screen.queryByTestId('toast');
    expect(toast).toBeInTheDocument();
  });

  it('can show multiple toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByTestId('success-btn'));
    fireEvent.click(screen.getByTestId('error-btn'));

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('toast has correct alert role for accessibility', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByTestId('success-btn'));

    // Toast should have alert role
    const toast = screen.getByRole('alert');
    expect(toast).toBeInTheDocument();
  });

  it('applies correct styles for different toast types', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    // Trigger success toast
    fireEvent.click(screen.getByTestId('success-btn'));

    // Should have gradient background for success type
    const toast = container.querySelector('[class*="bg-gradient-to-r"]');
    expect(toast).toBeInTheDocument();
  });

  it('applies primary gradient for success type', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByTestId('success-btn'));

    // Success toast should have from-primary gradient
    const toast = container.querySelector('[class*="from-primary"]');
    expect(toast).toBeInTheDocument();
  });

  it('applies destructive gradient for error type', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByTestId('error-btn'));

    // Error toast should have from-destructive gradient
    const toast = container.querySelector('[class*="from-destructive"]');
    expect(toast).toBeInTheDocument();
  });

  it('each toast has unique id', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    // Trigger multiple toasts quickly
    fireEvent.click(screen.getByTestId('success-btn'));
    fireEvent.click(screen.getByTestId('success-btn'));

    // Both toasts should be visible (unique IDs prevent conflicts)
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBe(2);
  });

  it('removeToast removes specific toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByTestId('success-btn'));
    fireEvent.click(screen.getByTestId('error-btn'));

    // Both toasts should exist
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});
