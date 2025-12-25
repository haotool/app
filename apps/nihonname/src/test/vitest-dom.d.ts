/**
 * Type augmentation for @testing-library/jest-dom with Vitest
 *
 * [fix:2025-12-25] 修復 Vitest 4.x + @testing-library/jest-dom 類型衝突
 *
 * Vitest 4.x 使用自己的 Assertion 類型系統，需要顯式擴展以支援 jest-dom matchers
 *
 * @see [context7:/websites/vitest_dev:2025-12-25]
 */
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends TestingLibraryMatchers<T, void> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
}
