/**
 * Lenis Mock
 * Global mock for lenis smooth scroll library in tests
 */

export default class Lenis {
  constructor() {
    // Mock constructor
  }

  raf(): void {
    // Mock raf
  }

  scrollTo(): void {
    // Mock scrollTo
  }

  stop(): void {
    // Mock stop
  }

  start(): void {
    // Mock start
  }

  destroy(): void {
    // Mock destroy
  }

  on(): () => void {
    return () => void 0;
  }

  off(): void {
    // Mock off
  }
}
