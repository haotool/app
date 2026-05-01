import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NonCriticalLazyBoundary } from '../NonCriticalLazyBoundary';

function MaybeThrow({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('lazy import failed');
  }

  return <div data-testid="non-critical-child">ready</div>;
}

describe('NonCriticalLazyBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('非錯誤狀態應渲染 children', () => {
    render(
      <NonCriticalLazyBoundary>
        <MaybeThrow shouldThrow={false} />
      </NonCriticalLazyBoundary>,
    );

    expect(screen.getByTestId('non-critical-child')).toBeInTheDocument();
  });

  it('children 拋錯時只隱藏非關鍵內容', () => {
    render(
      <NonCriticalLazyBoundary>
        <MaybeThrow shouldThrow />
      </NonCriticalLazyBoundary>,
    );

    expect(screen.queryByTestId('non-critical-child')).not.toBeInTheDocument();
  });

  it('resetKey 變更後應重新嘗試渲染', () => {
    const { rerender } = render(
      <NonCriticalLazyBoundary resetKey="first">
        <MaybeThrow shouldThrow />
      </NonCriticalLazyBoundary>,
    );

    expect(screen.queryByTestId('non-critical-child')).not.toBeInTheDocument();

    rerender(
      <NonCriticalLazyBoundary resetKey="second">
        <MaybeThrow shouldThrow={false} />
      </NonCriticalLazyBoundary>,
    );

    expect(screen.getByTestId('non-critical-child')).toBeInTheDocument();
  });

  it('網路恢復事件後應重新嘗試渲染', () => {
    const { rerender } = render(
      <NonCriticalLazyBoundary>
        <MaybeThrow shouldThrow />
      </NonCriticalLazyBoundary>,
    );

    expect(screen.queryByTestId('non-critical-child')).not.toBeInTheDocument();

    rerender(
      <NonCriticalLazyBoundary>
        <MaybeThrow shouldThrow={false} />
      </NonCriticalLazyBoundary>,
    );

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.getByTestId('non-critical-child')).toBeInTheDocument();
  });
});
