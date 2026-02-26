/**
 * useOrientationPermission – Unit Tests
 *
 * TDD: Tests written BEFORE implementation.
 * Covers iOS permission request lifecycle and localStorage caching.
 */
import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import {
  useOrientationPermission,
  ORIENTATION_STORAGE_KEY,
  type OrientationPermissionState,
} from '@app/park-keeper/hooks/useOrientationPermission';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockIOSPermissionAPI(result: 'granted' | 'denied' | 'throws') {
  const mockRequestPermission =
    result === 'throws'
      ? vi.fn().mockRejectedValue(new Error('Permission error'))
      : vi.fn().mockResolvedValue(result);

  vi.stubGlobal('DeviceOrientationEvent', {
    requestPermission: mockRequestPermission,
  });

  return mockRequestPermission;
}

function removeIOSPermissionAPI() {
  // Simulate Android/Chrome where requestPermission does not exist
  vi.stubGlobal('DeviceOrientationEvent', {});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOrientationPermission', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ── 1. Non-iOS (Android / Chrome) ──────────────────────────────────────

  it('returns not-required when DeviceOrientationEvent.requestPermission does not exist', () => {
    removeIOSPermissionAPI();
    const { result } = renderHook(() => useOrientationPermission());
    expect(result.current.permissionState).toBe<OrientationPermissionState>('not-required');
  });

  it('requestPermission is a no-op when not-required', async () => {
    removeIOSPermissionAPI();
    const { result } = renderHook(() => useOrientationPermission());
    // Should resolve (Promise.resolve()) without throwing and state stays not-required
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(result.current.permissionState).toBe('not-required');
  });

  // ── 2. iOS – localStorage cache ─────────────────────────────────────────

  it('returns prompt on iOS with no localStorage cache', () => {
    mockIOSPermissionAPI('granted');
    const { result } = renderHook(() => useOrientationPermission());
    expect(result.current.permissionState).toBe<OrientationPermissionState>('prompt');
  });

  it('returns previously-granted on iOS when localStorage has granted', () => {
    localStorage.setItem(ORIENTATION_STORAGE_KEY, 'granted');
    mockIOSPermissionAPI('granted');
    const { result } = renderHook(() => useOrientationPermission());
    // Still shows prompt (iOS resets per session), but previouslyGranted = true
    expect(result.current.permissionState).toBe<OrientationPermissionState>('prompt');
    expect(result.current.previouslyGranted).toBe(true);
  });

  it('returns denied from localStorage cache without calling native API', () => {
    localStorage.setItem(ORIENTATION_STORAGE_KEY, 'denied');
    mockIOSPermissionAPI('granted'); // native would grant, but cache says denied
    const { result } = renderHook(() => useOrientationPermission());
    expect(result.current.permissionState).toBe<OrientationPermissionState>('denied');
  });

  // ── 3. iOS – requestPermission call ─────────────────────────────────────

  it('transitions prompt → granted and saves to localStorage', async () => {
    const mockFn = mockIOSPermissionAPI('granted');
    const { result } = renderHook(() => useOrientationPermission());

    expect(result.current.permissionState).toBe('prompt');

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mockFn).toHaveBeenCalledOnce();
    expect(result.current.permissionState).toBe<OrientationPermissionState>('granted');
    expect(localStorage.getItem(ORIENTATION_STORAGE_KEY)).toBe('granted');
  });

  it('transitions prompt → denied and saves to localStorage when native denies', async () => {
    const mockFn = mockIOSPermissionAPI('denied');
    const { result } = renderHook(() => useOrientationPermission());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mockFn).toHaveBeenCalledOnce();
    expect(result.current.permissionState).toBe<OrientationPermissionState>('denied');
    expect(localStorage.getItem(ORIENTATION_STORAGE_KEY)).toBe('denied');
  });

  it('transitions to denied but does NOT save to localStorage when native throws (technical error)', async () => {
    // Technical errors (TypeError from wrong 'this', SecurityError from no user gesture, etc.)
    // should NOT persist 'denied' to localStorage — button should reappear on next reload.
    mockIOSPermissionAPI('throws');
    const { result } = renderHook(() => useOrientationPermission());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.permissionState).toBe<OrientationPermissionState>('denied');
    // Intentionally NOT stored — allows retry on reload
    expect(localStorage.getItem(ORIENTATION_STORAGE_KEY)).toBeNull();
  });

  it('is a no-op when state is already granted', async () => {
    const mockFn = mockIOSPermissionAPI('granted');
    const { result } = renderHook(() => useOrientationPermission());

    // First call → granted
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(result.current.permissionState).toBe('granted');

    // Second call → should not invoke native API again
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('is a no-op when state is denied', async () => {
    const mockFn = mockIOSPermissionAPI('denied');
    const { result } = renderHook(() => useOrientationPermission());

    await act(async () => {
      await result.current.requestPermission();
    });
    expect(result.current.permissionState).toBe('denied');

    // Subsequent call should not invoke native API
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(mockFn).toHaveBeenCalledOnce();
  });
});
