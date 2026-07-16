import { routes } from './routes';

describe('routes', () => {
  it('should have 1 root route with path "/"', () => {
    expect(routes).toHaveLength(1);
    expect(routes[0]!).toHaveProperty('path', '/');
  });

  it('root route should have 5 children', () => {
    expect(routes[0]).toBeDefined();
    expect(routes[0]!.children).toBeDefined();
    expect(routes[0]!.children).toHaveLength(5);
  });

  it('children should include index, about, settings, add, and guide paths', () => {
    const children = routes[0]!.children!;
    const indexChild = children.find((c) => c.index === true);
    const aboutChild = children.find((c) => c.path === 'about');
    const settingsChild = children.find((c) => c.path === 'settings');
    const addChild = children.find((c) => c.path === 'add');
    const guideChild = children.find((c) => c.path === 'guide');

    expect(indexChild).toBeDefined();
    expect(indexChild?.index).toBe(true);
    expect(aboutChild).toBeDefined();
    expect(aboutChild?.path).toBe('about');
    expect(settingsChild).toBeDefined();
    expect(settingsChild?.path).toBe('settings');
    expect(addChild).toBeDefined();
    expect(addChild?.path).toBe('add');
    expect(guideChild).toBeDefined();
    expect(guideChild?.path).toBe('guide');
  });
});
