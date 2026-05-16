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

  it('classifies Firefox NetworkError as generic fetch failure', () => {
    expect(
      classifyUnhandledRejection(new TypeError('NetworkError when attempting to fetch resource.')),
    ).toBe('generic-fetch-failure');
  });

  it('classifies iOS Safari offline message as generic fetch failure', () => {
    expect(
      classifyUnhandledRejection(new Error('The Internet connection appears to be offline.')),
    ).toBe('generic-fetch-failure');
  });

  it.each([
    'The network connection was lost.',
    'A server with the specified hostname could not be found.',
    'Could not connect to the server.',
  ])('classifies Safari network failure "%s" as generic fetch failure', (message) => {
    expect(classifyUnhandledRejection(new TypeError(message))).toBe('generic-fetch-failure');
  });

  it('keeps Safari TypeError("Load failed") on chunk-load so chunk recovery still fires', () => {
    expect(classifyUnhandledRejection(new TypeError('Load failed'))).toBe('chunk-load');
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
