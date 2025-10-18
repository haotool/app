/**
 * Sentry initialization
 * [context7:@sentry/react:2025-10-18T02:00:00+08:00]
 *
 * Initialize only in production or when VITE_SENTRY_DSN is explicitly set
 */
import * as Sentry from '@sentry/react';
import { logger } from './logger';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PROD = import.meta.env.MODE === 'production';

export function initSentry() {
  // Only initialize if DSN is provided (production or explicit dev testing)
  if (!SENTRY_DSN) {
    logger.info('Sentry: No DSN configured, skipping initialization');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      enabled: IS_PROD || !!SENTRY_DSN, // Enable if prod or DSN explicitly set

      // Performance monitoring
      tracesSampleRate: IS_PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev

      // Error filtering
      beforeSend(event, hint) {
        // Don't send errors in dev unless explicitly testing
        if (!IS_PROD && !import.meta.env.VITE_SENTRY_DEBUG) {
          return null;
        }

        // Filter out expected/handled errors
        const error = hint.originalException;
        if (error instanceof Error) {
          // Skip network errors that are already logged
          if (error.message.includes('Failed to fetch')) {
            return null;
          }
        }

        return event;
      },

      // Integration options
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],

      // Session Replay (only small % in prod to save quota)
      replaysSessionSampleRate: IS_PROD ? 0.01 : 0.1,
      replaysOnErrorSampleRate: IS_PROD ? 0.5 : 1.0,
    });

    logger.info('Sentry initialized', {
      environment: import.meta.env.MODE,
      tracesSampleRate: IS_PROD ? 0.1 : 1.0,
    });
  } catch (error) {
    logger.error('Failed to initialize Sentry', error as Error);
  }
}

/**
 * Capture exception manually (use sparingly, ErrorBoundary handles most)
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    level: 'info',
    data,
  });
}
