/// <reference types="@testing-library/jest-dom" />

/**
 * Vitest DOM 類型擴展
 *
 * 此文件為 @testing-library/jest-dom 提供類型支援
 * 讓 TypeScript 能識別 toBeInTheDocument, toHaveAttribute 等 matcher
 *
 * 參考: https://github.com/testing-library/jest-dom
 */

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion<T = unknown> extends TestingLibraryMatchers<
    typeof expect.stringContaining,
    T
  > {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<
    typeof expect.stringContaining,
    unknown
  > {}
}
