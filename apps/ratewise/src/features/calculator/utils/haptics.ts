/**
 * Haptics Utility - Tactile feedback for mobile devices
 *
 * Follows Linus philosophy:
 * - Simple: Just vibrate, no complex patterns
 * - Practical: Solves real UX problem (missing tactile feedback)
 * - Non-breaking: Graceful degradation if not supported
 *
 * @example
 * import { lightHaptic, mediumHaptic } from './haptics';
 *
 * function handleNumberPress() {
 *   lightHaptic(); // 10ms vibration
 *   // ... rest of logic
 * }
 *
 * function handleEqualsPress() {
 *   mediumHaptic(); // 20ms vibration for emphasis
 *   // ... rest of logic
 * }
 */

/**
 * Light haptic feedback (10ms)
 * Use for: Number keys, operators, decimal point
 *
 * Graceful degradation: silently fails if not supported
 */
export function lightHaptic(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

/**
 * Medium haptic feedback (20ms)
 * Use for: Important operations (=, AC, backspace)
 *
 * Graceful degradation: silently fails if not supported
 */
export function mediumHaptic(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(20);
  }
}

/**
 * Check if device supports vibration
 * Useful for: Conditional UI hints or feature detection
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}
