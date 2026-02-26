/**
 * useOrientationPermission
 *
 * Manages iOS 13+ DeviceOrientationEvent.requestPermission() lifecycle.
 * - Non-iOS (Android/Chrome): returns 'not-required', no dialog needed
 * - iOS: returns 'prompt' until the user taps an explicit button
 *   then calls native API and caches result in localStorage
 *
 * iOS permission resets every browser session by design (Apple privacy policy).
 * localStorage cache is used only to improve button label UX ("Re-enable" vs "Enable").
 */
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type OrientationPermissionState =
  | 'not-required' // Android / Chrome – no permission needed
  | 'prompt' // iOS – waiting for user to tap the Enable button
  | 'granted' // iOS – permission granted in this session
  | 'denied'; // iOS – permission denied (this session or cached)

export interface UseOrientationPermissionResult {
  /** Current permission state */
  permissionState: OrientationPermissionState;
  /** True if the user previously granted permission (cached in localStorage) */
  previouslyGranted: boolean;
  /** Call this from a user-gesture handler (onClick) to trigger iOS permission dialog */
  requestPermission: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants – exported for testing
// ---------------------------------------------------------------------------

export const ORIENTATION_STORAGE_KEY = 'pk:orientation-perm' as const;

// ---------------------------------------------------------------------------
// Internal helpers (pure, no React)
// ---------------------------------------------------------------------------

function hasRequestPermissionAPI(): boolean {
  return (
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown })
      .requestPermission === 'function'
  );
}

function readStoredPermission(): 'granted' | 'denied' | null {
  try {
    const val = localStorage.getItem(ORIENTATION_STORAGE_KEY);
    if (val === 'granted' || val === 'denied') return val;
    return null;
  } catch {
    // localStorage unavailable (e.g. private mode)
    return null;
  }
}

function storePermission(state: 'granted' | 'denied'): void {
  try {
    localStorage.setItem(ORIENTATION_STORAGE_KEY, state);
  } catch {
    // Ignore write failures
  }
}

function computeInitialState(): OrientationPermissionState {
  if (typeof window === 'undefined') return 'prompt'; // SSG safety
  if (!hasRequestPermissionAPI()) return 'not-required';
  // On iOS: cached 'denied' means we stay denied; otherwise always start at 'prompt'
  // (iOS resets per session, so 'granted' cache only affects button label)
  const cached = readStoredPermission();
  return cached === 'denied' ? 'denied' : 'prompt';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOrientationPermission(): UseOrientationPermissionResult {
  const [permissionState, setPermissionState] =
    useState<OrientationPermissionState>(computeInitialState);

  // previouslyGranted: read once from storage; affects button label only
  const previouslyGranted = readStoredPermission() === 'granted';

  const requestPermission = async (): Promise<void> => {
    // No-op for non-iOS or already-resolved states
    if (
      permissionState === 'not-required' ||
      permissionState === 'granted' ||
      permissionState === 'denied'
    ) {
      return;
    }

    try {
      const requestFn = (
        DeviceOrientationEvent as unknown as {
          requestPermission: () => Promise<string>;
        }
      ).requestPermission;

      const result = await requestFn();
      const newState: OrientationPermissionState = result === 'granted' ? 'granted' : 'denied';
      storePermission(newState === 'granted' ? 'granted' : 'denied');
      setPermissionState(newState);
    } catch {
      // User dismissed or permission error
      storePermission('denied');
      setPermissionState('denied');
    }
  };

  return { permissionState, previouslyGranted, requestPermission };
}
