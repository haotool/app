/**
 * Layout component tests
 * @vitest-environment jsdom
 * [context7:vitest-dev/vitest:2025-12-04] - React Router 測試最佳實踐
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { Layout } from './Layout';

// Test child component
const TestChild = ({ testId = 'test-child' }: { testId?: string }) => (
  <div data-testid={testId}>Test Content</div>
);

// Helper to render Layout with router context
// [fix:2025-12-06] 使用 future flags 消除 React Router 警告
const renderWithRouter = (initialRoute = '/') => {
  return render(
    <MemoryRouter
      initialEntries={[initialRoute]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TestChild testId="home-child" />} />
          <Route path="/about" element={<TestChild testId="about-child" />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
};

describe('Layout', () => {
  it('should render without crashing', () => {
    renderWithRouter();
    expect(screen.getByTestId('home-child')).toBeInTheDocument();
  });

  it('should render child routes via Outlet', () => {
    renderWithRouter();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have proper container styling', () => {
    const { container } = renderWithRouter();
    // Layout uses min-h-[100dvh] for dynamic viewport height
    const layoutDiv = container.querySelector('[class*="min-h-"]');
    expect(layoutDiv).toBeInTheDocument();
    expect(layoutDiv).toHaveClass('bg-stone-100');
  });

  // [UI/UX 2025-12-03] 新增：首頁使用 flex 置中測試
  it('should use flex layout on home page for vertical centering', () => {
    const { container } = renderWithRouter('/');
    const layoutDiv = container.querySelector('[class*="min-h-"]');
    expect(layoutDiv).toHaveClass('flex');
    expect(layoutDiv).toHaveClass('flex-col');
  });

  // [UI/UX 2025-12-03] 新增：其他頁面使用 overflow-y-auto 測試
  it('should use overflow-y-auto on about page for scrolling', () => {
    const { container } = renderWithRouter('/about');
    const layoutDiv = container.querySelector('[class*="min-h-"]');
    expect(layoutDiv).toHaveClass('overflow-y-auto');
    expect(layoutDiv).not.toHaveClass('flex-col');
  });

  // [UI/UX 2025-12-03] 新增：路由切換時樣式正確變更
  it('should switch layout styles based on route', () => {
    // 首先渲染首頁
    const { container: homeContainer, unmount: unmountHome } = renderWithRouter('/');
    const homeLayoutDiv = homeContainer.querySelector('[class*="min-h-"]');
    expect(homeLayoutDiv).toHaveClass('flex-col');
    unmountHome();

    // 然後渲染 About 頁面
    const { container: aboutContainer } = renderWithRouter('/about');
    const aboutLayoutDiv = aboutContainer.querySelector('[class*="min-h-"]');
    expect(aboutLayoutDiv).toHaveClass('overflow-y-auto');
  });
});
