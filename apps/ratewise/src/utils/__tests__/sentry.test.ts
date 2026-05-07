import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sentryMock = vi.hoisted(() => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'browserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'replay' })),
}));

const loggerMock = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@sentry/react', () => sentryMock);
vi.mock('../logger', () => ({
  logger: loggerMock,
}));

describe('sentry', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@example.com/1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should initialize Sentry only once across repeated calls', async () => {
    const { initSentry } = await import('../sentry');

    await initSentry();
    await initSentry();
    await Promise.all([initSentry(), initSentry()]);

    expect(sentryMock.init).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledWith(
      'Sentry initialized',
      expect.objectContaining({
        environment: 'production',
        tracesSampleRate: 0.1,
      }),
    );
  });

  it('should log missing DSN only once', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    const { initSentry } = await import('../sentry');

    await initSentry();
    await initSentry();

    expect(sentryMock.init).not.toHaveBeenCalled();
    expect(loggerMock.info).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledWith(
      'Sentry: No DSN configured, skipping initialization',
    );
  });
});
