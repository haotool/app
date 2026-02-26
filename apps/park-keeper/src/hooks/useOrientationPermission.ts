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
 *
 * CRITICAL iOS constraints (both must be respected):
 *   1. Call .requestPermission() directly on DeviceOrientationEvent — extracting it to
 *      a variable loses the required 'this' binding, causing a silent TypeError on iOS.
 *   2. Call synchronously from the user-gesture handler — iOS WebKit may drop the
 *      "user activation" token through async function layers, suppressing the dialog.
 *   3. Only persist 'denied' from an explicit user denial (resolved 'denied'), NOT from
 *      technical errors (TypeError, SecurityError) — so the button reappears on reload.
 */
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type OrientationPermissionState =
  | 'not-required' // Android / Chrome – no permission needed
  | 'prompt' // iOS – waiting for user to tap the Enable button
  | 'granted' // iOS – permission granted in this session
  | 'denied'; // iOS – permission explicitly denied by user (cached)

export interface UseOrientationPermissionResult {
  /** Current permission state */
  permissionState: OrientationPermissionState;
  /** True if the user previously granted permission (cached in localStorage) */
  previouslyGranted: boolean;
  /**
   * Call this from a user-gesture handler (onClick) to trigger iOS permission dialog.
   * Returns Promise<void> for awaiting in tests; synchronous call path for iOS user-activation.
   */
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

  /**
   * NOT declared `async` — this is intentional.
   *
   * iOS WebKit requirements enforced here:
   * 1. .requestPermission() is called directly on DeviceOrientationEvent (not via a
   *    variable), preserving the required 'this' binding. Calling a detached reference
   *    (const fn = DeviceOrientationEvent.requestPermission; fn()) throws a silent
   *    TypeError on iOS, which was our primary bug.
   * 2. No `async` keyword so WebKit does not wrap the execution in a new microtask
   *    before the API call, preserving the user-activation token.
   * 3. Technical errors (SecurityError, TypeError) do NOT persist 'denied' to
   *    localStorage — only an explicit user denial does. This allows the button to
   *    reappear on the next page load so the user can retry.
   */
  const requestPermission = (): Promise<void> => {
    // No-op for non-iOS or already-resolved states
    if (
      permissionState === 'not-required' ||
      permissionState === 'granted' ||
      permissionState === 'denied'
    ) {
      return Promise.resolve();
    }

    // Call directly on DeviceOrientationEvent — preserves 'this' binding.
    // Using .then()/.catch() (not async/await) to maintain synchronous call path.
    return (
      DeviceOrientationEvent as unknown as {
        requestPermission: () => Promise<string>;
      }
    )
      .requestPermission()
      .then((result) => {
        if (result === 'granted') {
          storePermission('granted');
          setPermissionState('granted');
        } else {
          // Explicit user denial: persist so button does not re-appear next session
          storePermission('denied');
          setPermissionState('denied');
        }
      })
      .catch(() => {
        // Technical error (SecurityError, TypeError, no-user-gesture, etc.).
        // Do NOT persist to localStorage — button reappears on reload so user can retry.
        setPermissionState('denied');
      });
  };

  return { permissionState, previouslyGranted, requestPermission };
}
