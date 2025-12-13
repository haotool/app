/**
 * Routes Configuration Tests
 * Testing route configuration and lazy loading
 */
import { describe, it, expect } from 'vitest';
import routes, { getIncludedRoutes } from './routes';

describe('routes', () => {
  const rootRoute = routes[0];

  it('should export routes as default', () => {
    expect(routes).toBeDefined();
    expect(Array.isArray(routes)).toBe(true);
  });

  it('should have at least one route', () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have root route', () => {
    expect(rootRoute).toBeDefined();
    expect(rootRoute?.path).toBe('/');
  });

  it('should have Layout as Component', () => {
    expect(rootRoute).toBeDefined();
    expect(rootRoute?.Component).toBeDefined();
  });

  it('should have children routes', () => {
    expect(rootRoute).toBeDefined();
    expect(rootRoute?.children).toBeDefined();
    expect(Array.isArray(rootRoute?.children)).toBe(true);
    expect(rootRoute?.children?.length).toBeGreaterThan(0);
  });

  it('should have index route', () => {
    const indexRoute = rootRoute?.children?.find((r) => r.index === true);
    expect(indexRoute).toBeDefined();
  });

  it('should have projects path', () => {
    const projectsRoute = rootRoute?.children?.find((r) => r.path === 'projects');
    expect(projectsRoute).toBeDefined();
  });

  it('should have about path', () => {
    const aboutRoute = rootRoute?.children?.find((r) => r.path === 'about');
    expect(aboutRoute).toBeDefined();
  });

  it('should have contact path', () => {
    const contactRoute = rootRoute?.children?.find((r) => r.path === 'contact');
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
