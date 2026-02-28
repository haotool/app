import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  it('應該在延遲後返回防抖值', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 300 },
    });

    // 初始值應立即返回
    expect(result.current).toBe('initial');

    // 更新值
    rerender({ value: 'updated', delay: 300 });

    // 值應該還是舊的（還在防抖中）
    expect(result.current).toBe('initial');

    // 等待防抖延遲後
    await waitFor(
      () => {
        expect(result.current).toBe('updated');
      },
      { timeout: 400 },
    );
  });

  it('應該在快速連續更新時只保留最後一個值', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'v1', delay: 300 },
    });

    // 快速連續更新
    rerender({ value: 'v2', delay: 300 });
    rerender({ value: 'v3', delay: 300 });
    rerender({ value: 'v4', delay: 300 });

    // 在防抖期間應該還是初始值
    expect(result.current).toBe('v1');

    // 等待防抖延遲後，應該是最後一個值
    await waitFor(
      () => {
        expect(result.current).toBe('v4');
      },
      { timeout: 400 },
    );
  });

  it('應該在組件卸載時清除定時器', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'test', delay: 300 },
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('應該支援自定義延遲時間', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    rerender({ value: 'updated', delay: 500 });

    // 300ms 後還不應該更新
    await new Promise((r) => setTimeout(r, 300));
    expect(result.current).toBe('initial');

    // 500ms 後應該更新
    await waitFor(
      () => {
        expect(result.current).toBe('updated');
      },
      { timeout: 600 },
    );
  });

  it('應該處理數字類型的防抖', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 0, delay: 300 },
    });

    expect(result.current).toBe(0);

    rerender({ value: 42, delay: 300 });

    await waitFor(
      () => {
        expect(result.current).toBe(42);
      },
      { timeout: 400 },
    );
  });

  it('應該處理對象類型的防抖', async () => {
    const obj1 = { id: 1, name: 'test' };
    const obj2 = { id: 2, name: 'updated' };

    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: obj1, delay: 300 },
    });

    expect(result.current).toBe(obj1);

    rerender({ value: obj2, delay: 300 });

    await waitFor(
      () => {
        expect(result.current).toBe(obj2);
      },
      { timeout: 400 },
    );
  });
});
