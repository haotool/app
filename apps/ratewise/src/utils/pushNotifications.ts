/**
 * Push Notifications Support for PWA
 *
 * iOS Requirements (iOS 16.4+):
 * - PWA must be added to Home Screen
 * - manifest.display must be "standalone"
 * - Permission request must be triggered by user interaction
 *
 * Reference:
 * - https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
 * - https://developer.mozilla.org/en-US/docs/Web/API/Push_API
 * [context7:googlechrome/lighthouse-ci:2025-10-20T04:10:04+08:00]
 */

import { logger } from './logger';

export interface PushSubscriptionResult {
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}

/**
 * Check if Push API is supported
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Check if app is running as standalone PWA (required for iOS push)
 */
export function isStandalonePWA(): boolean {
  // Check iOS standalone mode
  interface NavigatorStandalone extends Navigator {
    standalone?: boolean;
  }

  const isIOSStandalone =
    (window.navigator as NavigatorStandalone).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  // Check Android/Desktop standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return isIOSStandalone || isStandalone;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  return Notification.permission;
}

/**
 * Request notification permission (must be called on user interaction)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }

  // iOS requires standalone PWA mode
  if (!isStandalonePWA()) {
    logger.warn('App must be added to Home Screen for push notifications');
  }

  const permission = await Notification.requestPermission();
  logger.debug('Push permission result', { permission });

  return permission;
}

/**
 * Subscribe to push notifications
 *
 * @param vapidPublicKey - Your VAPID public key (base64url encoded)
 * @returns PushSubscription or null if failed
 */
export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscriptionResult> {
  try {
    if (!isPushSupported()) {
      return {
        success: false,
        error: 'Push notifications not supported',
      };
    }

    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error: `Permission ${permission}`,
      };
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      const appServerKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer as ArrayBuffer,
      });

      logger.debug('New push subscription created');
    } else {
      logger.debug('Using existing push subscription');
    }

    return {
      success: true,
      subscription,
    };
  } catch (error) {
    logger.error('Push subscribe error', error instanceof Error ? error : undefined);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      logger.debug('Unsubscribed from push successfully');
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Push unsubscribe error', error instanceof Error ? error : undefined);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    logger.error('Get push subscription error', error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Show local notification (for testing)
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions,
): Promise<void> {
  if (!isPushSupported()) {
    throw new Error('Notifications not supported');
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    badge: '/pwa-192x192.png',
    icon: '/pwa-192x192.png',
    ...options,
  });
}

// Helper: Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
