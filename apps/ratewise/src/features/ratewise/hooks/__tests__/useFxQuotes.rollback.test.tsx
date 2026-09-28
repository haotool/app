import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const gate = vi.hoisted(() => ({ enabled: true }));
vi.mock('@app/shared/fx/public', () => ({ isFxV3Public: () => gate.enabled }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('stops v3 requests and clears v3 cache on rollback, preserving settings', async () => {
  gate.enabled = true;
  localStorage.setItem('ratewise.fx.v3.active', '{}');
  localStorage.setItem('ratewise.fx.v3.history:old:series', '[]');
  localStorage.setItem('converter-settings', '{}');
  const fetchMock = vi.fn(() => Promise.resolve(new Response('', { status: 404 })));
  vi.stubGlobal('fetch', fetchMock);
  const { useFxQuotes } = await import('../useFxQuotes');
  const { result, rerender, unmount } = renderHook(({ enabled }) => useFxQuotes(enabled), {
    initialProps: { enabled: true },
  });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(fetchMock).toHaveBeenCalled();
  const requestsBeforeRollback = fetchMock.mock.calls.length;

  gate.enabled = false;
  act(() => rerender({ enabled: true }));
  await waitFor(() => expect(localStorage.getItem('ratewise.fx.v3.active')).toBeNull());
  expect(
    Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).some((key) =>
      key?.startsWith('ratewise.fx.v3.'),
    ),
  ).toBe(false);
  expect(localStorage.getItem('converter-settings')).toBe('{}');
  expect(fetchMock).toHaveBeenCalledTimes(requestsBeforeRollback);
  expect(result.current.quotes).toEqual([]);
  unmount();
});

it('does not request v3 when the flag is already off', async () => {
  gate.enabled = false;
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  const { useFxQuotes } = await import('../useFxQuotes');
  const { result } = renderHook(() => useFxQuotes());
  expect(result.current.quotes).toEqual([]);
  expect(fetchMock).not.toHaveBeenCalled();
});
