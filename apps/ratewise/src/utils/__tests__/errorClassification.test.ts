import { describe, expect, it } from 'vitest';
import { classifyUnhandledRejection, isHydrationSuppressionEnabled } from '../errorClassification';

describe('classifyUnhandledRejection', () => {
  it('classifies chunk load errors before generic fetch errors', () => {
    expect(
      classifyUnhandledRejection(new TypeError('Failed to fetch dynamically imported module')),
    ).toBe('chunk-load');
  });

  it('classifies verified history endpoint 404 as expected history miss', () => {
    expect(
      classifyUnhandledRejection(
        new Error(
          'GET https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/2026-05-12.json 404',
        ),
      ),
    ).toBe('expected-history-miss');
  });

  it('does not classify generic Failed to fetch as expected history miss', () => {
    expect(classifyUnhandledRejection(new TypeError('Failed to fetch'))).toBe(
      'generic-fetch-failure',
    );
  });

  it('classifies unrelated errors as unknown', () => {
    expect(classifyUnhandledRejection(new Error('Unexpected application state'))).toBe('unknown');
  });
});

describe('isHydrationSuppressionEnabled', () => {
  it('only enables suppression for explicit non-production diagnostics', () => {
    expect(isHydrationSuppressionEnabled({ prod: true, flag: 'true' })).toBe(false);
    expect(isHydrationSuppressionEnabled({ prod: false, flag: 'true' })).toBe(true);
    expect(isHydrationSuppressionEnabled({ prod: false, flag: undefined })).toBe(false);
  });
});
