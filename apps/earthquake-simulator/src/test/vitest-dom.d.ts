/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare global {
  namespace Vi {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface JestAssertion<T = unknown>
      extends jest.Matchers<void, T>, jest.Matchers<T>, TestingLibraryMatchers<T, void> {}
  }
}
