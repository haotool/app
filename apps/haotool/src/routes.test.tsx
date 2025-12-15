/**
 * Routes Configuration Tests
 * Testing route configuration and lazy loading
 * [update:2025-12-16] - Updated to match new route structure (Home is standalone)
 */
import { describe, it, expect } from 'vitest';
import routes, { getIncludedRoutes } from './routes';

describe('routes', () => {
  it('should export routes as default', () => {
    expect(routes).toBeDefined();
    expect(Array.isArray(routes)).toBe(true);
  });

  it('should have at least two route groups', () => {
    // One for Home (standalone), one for Layout-wrapped pages
    expect(routes.length).toBeGreaterThanOrEqual(2);
  });

  it('should have home route as standalone', () => {
    const homeRoute = routes[0];
    expect(homeRoute).toBeDefined();
    expect(homeRoute?.path).toBe('/');
    // Home is standalone, no Component wrapper (uses lazy)
    expect(homeRoute?.lazy).toBeDefined();
  });

  it('should have Layout-wrapped routes', () => {
    const layoutRoute = routes[1];
    expect(layoutRoute).toBeDefined();
    expect(layoutRoute?.path).toBe('/');
    expect(layoutRoute?.Component).toBeDefined();
    expect(layoutRoute?.children).toBeDefined();
  });

  it('should have projects path in Layout children', () => {
    const layoutRoute = routes[1];
    const projectsRoute = layoutRoute?.children?.find((r) => r.path === 'projects');
    expect(projectsRoute).toBeDefined();
  });

  it('should have about path in Layout children', () => {
    const layoutRoute = routes[1];
    const aboutRoute = layoutRoute?.children?.find((r) => r.path === 'about');
    expect(aboutRoute).toBeDefined();
  });

  it('should have contact path in Layout children', () => {
    const layoutRoute = routes[1];
    const contactRoute = layoutRoute?.children?.find((r) => r.path === 'contact');
    expect(contactRoute).toBeDefined();
  });
});

describe('getIncludedRoutes', () => {
  it('should return array of routes for SSG', () => {
    const includedRoutes = getIncludedRoutes();
    expect(Array.isArray(includedRoutes)).toBe(true);
  });

  it('should include home route', () => {
    const includedRoutes = getIncludedRoutes();
    expect(includedRoutes).toContain('/');
  });

  it('should include projects route', () => {
    const includedRoutes = getIncludedRoutes();
    expect(includedRoutes.some((r) => r.includes('projects'))).toBe(true);
  });

  it('should include about route', () => {
    const includedRoutes = getIncludedRoutes();
    expect(includedRoutes.some((r) => r.includes('about'))).toBe(true);
  });

  it('should include contact route', () => {
    const includedRoutes = getIncludedRoutes();
    expect(includedRoutes.some((r) => r.includes('contact'))).toBe(true);
  });

  it('should all start with slash', () => {
    const includedRoutes = getIncludedRoutes();
    includedRoutes.forEach((route) => {
      expect(route.startsWith('/')).toBe(true);
    });
  });

  it('should have trailing slashes for non-root routes', () => {
    const includedRoutes = getIncludedRoutes();
    const nonRootRoutes = includedRoutes.filter((r) => r !== '/');
    nonRootRoutes.forEach((route) => {
      expect(route.endsWith('/')).toBe(true);
    });
  });
});
