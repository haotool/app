import { routes } from './routes';

describe('routes', () => {
  it('should have 1 root route with path "/"', () => {
    expect(routes).toHaveLength(1);
    expect(routes[0]!).toHaveProperty('path', '/');
  });

  it('root route should have 3 children', () => {
    expect(routes[0]).toBeDefined();
    expect(routes[0]!.children).toBeDefined();
    expect(routes[0]!.children).toHaveLength(3);
  });

  it('children should include index, about, and settings paths', () => {
    const children = routes[0]!.children!;
    const indexChild = children.find((c) => c.index === true);
    const aboutChild = children.find((c) => c.path === 'about');
    const settingsChild = children.find((c) => c.path === 'settings');

    expect(indexChild).toBeDefined();
    expect(indexChild?.index).toBe(true);
    expect(aboutChild).toBeDefined();
    expect(aboutChild?.path).toBe('about');
    expect(settingsChild).toBeDefined();
    expect(settingsChild?.path).toBe('settings');
  });
});
