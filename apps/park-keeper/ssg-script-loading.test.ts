// @vitest-environment node
import viteConfig from './vite.config';

describe('park-keeper vite ssg config', () => {
  it('uses defer script loading so hydration data is ready before client bootstrap', () => {
    const prevCI = process.env['CI'];
    process.env['CI'] = '1';

    try {
      const exported =
        typeof viteConfig === 'function'
          ? viteConfig({
              command: 'build',
              mode: 'production',
              isSsrBuild: false,
              isPreview: false,
            })
          : viteConfig;

      expect(exported.ssgOptions?.script).toBe('defer');
    } finally {
      if (prevCI === undefined) delete process.env['CI'];
      else process.env['CI'] = prevCI;
    }
  });
});
