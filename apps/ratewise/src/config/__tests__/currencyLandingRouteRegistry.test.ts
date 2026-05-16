import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CURRENCY_LANDING_ROUTE_REGISTRY,
  FORWARD_CURRENCY_LANDING_ROUTES,
  REVERSE_CURRENCY_LANDING_ROUTES,
} from '../currencyLandingRouteRegistry';
import { CURRENCY_SEO_PATHS, REVERSE_CURRENCY_SEO_PATHS } from '../seo-paths';

describe('currency landing route registry', () => {
  it('should stay in parity with forward and reverse currency landing SEO paths', () => {
    expect(FORWARD_CURRENCY_LANDING_ROUTES).toHaveLength(17);
    expect(REVERSE_CURRENCY_LANDING_ROUTES).toHaveLength(17);
    expect(CURRENCY_LANDING_ROUTE_REGISTRY).toHaveLength(34);

    expect(FORWARD_CURRENCY_LANDING_ROUTES.map((route) => route.path)).toEqual(CURRENCY_SEO_PATHS);
    expect(REVERSE_CURRENCY_LANDING_ROUTES.map((route) => route.path)).toEqual(
      REVERSE_CURRENCY_SEO_PATHS,
    );
  });

  it('should define canonical paths, amount route patterns, entries, and page modules consistently', () => {
    CURRENCY_LANDING_ROUTE_REGISTRY.forEach((route) => {
      const from = route.from.toLowerCase();
      const to = route.to.toLowerCase();
      const expectedBasePath = `/${from}-${to}/`;
      const expectedPageModule = `${route.from}To${route.to}`;

      expect(route.path).toBe(expectedBasePath);
      expect(route.amountPathPattern).toBe(`${expectedBasePath}:amount`);
      expect(route.entry).toBe(`src/pages/${expectedPageModule}.tsx`);
      expect(route.pageModule).toBe(expectedPageModule);
    });
  });

  it('should point every registry entry at an existing page file', () => {
    CURRENCY_LANDING_ROUTE_REGISTRY.forEach((route) => {
      const pagePath = path.resolve(__dirname, '../../../', route.entry);

      expect(existsSync(pagePath), `${route.entry} should exist`).toBe(true);
    });
  });

  it('should drive route registration from the registry instead of a copied route list', async () => {
    const routesSource = await readFile(path.resolve(__dirname, '../../routes.tsx'), 'utf-8');

    expect(routesSource).toContain('CURRENCY_LANDING_ROUTE_REGISTRY.flatMap');
    expect(routesSource).not.toContain("createLazyRoute('/usd-twd'");
    expect(routesSource).not.toContain("createLazyRoute('/twd-usd'");
  });
});
