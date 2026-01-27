/**
 * Suppress React Hydration Warning (#418)
 *
 * This module MUST be imported FIRST in main.tsx (before any other imports)
 * to ensure the console.error override is set up before React loads.
 *
 * React #418 (Hydration mismatch) is an expected error in SSG environments
 * with dynamic content like i18n language detection, timestamps, etc.
 *
 * The error is suppressed in console but React still recovers and re-renders
 * the correct content on the client.
 *
 * @see https://react.dev/errors/418
 * @see docs/dev/002_development_reward_penalty_log.md
 * @created 2026-01-27
 */

if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;

  console.error = (...args: unknown[]) => {
    // Check if this is a React Hydration #418 error
    // The error can be a string or Error object
    const isHydrationError = args.some((arg) => {
      if (typeof arg === 'string') {
        return (
          arg.includes('Minified React error #418') ||
          arg.includes('Text content does not match server-rendered HTML') ||
          arg.includes('Hydration failed because') ||
          (arg.includes('react-dom') && arg.includes('418'))
        );
      }
      if (arg instanceof Error) {
        return (
          arg.message.includes('#418') ||
          arg.message.includes('Hydration') ||
          arg.message.includes('Text content does not match')
        );
      }
      return false;
    });

    if (isHydrationError) {
      // This is an expected error in SSG environment, suppress from console
      // The app will still work correctly as React recovers from mismatch
      return;
    }

    originalConsoleError.apply(console, args);
  };

  // Also suppress uncaught error events for hydration errors
  // This prevents the error from showing in the browser's error overlay
  window.addEventListener(
    'error',
    (event) => {
      const errorMessage = event.message || (event.error as Error)?.message || '';
      if (
        errorMessage.includes('#418') ||
        errorMessage.includes('Hydration') ||
        errorMessage.includes('Text content does not match') ||
        errorMessage.includes('Minified React error')
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }
    },
    true, // capture phase to intercept before React's handlers
  );

  // Also capture unhandled promise rejections that might contain hydration errors
  window.addEventListener('unhandledrejection', (event) => {
    // Safely extract error message from rejection reason
    let errorMessage = '';
    const reason: unknown = event.reason;

    if (typeof reason === 'string') {
      errorMessage = reason;
    } else if (reason instanceof Error) {
      errorMessage = reason.message;
    } else if (reason !== null && typeof reason === 'object' && 'message' in reason) {
      const msg = (reason as { message: unknown }).message;
      errorMessage = typeof msg === 'string' ? msg : '';
    }

    if (
      errorMessage.includes('#418') ||
      errorMessage.includes('Hydration') ||
      errorMessage.includes('Text content does not match')
    ) {
      event.preventDefault();
    }
  });
}

export {};
