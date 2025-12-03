/**
 * Layout component tests
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';

// Test child component
const TestChild = () => <div data-testid="test-child">Test Content</div>;

// Helper to render Layout with router context
const renderWithRouter = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TestChild />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
};

describe('Layout', () => {
  it('should render without crashing', () => {
    renderWithRouter();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should render child routes via Outlet', () => {
    renderWithRouter();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have proper container styling', () => {
    const { container } = renderWithRouter();
    const layoutDiv = container.querySelector('.min-h-screen');
    expect(layoutDiv).toBeInTheDocument();
    expect(layoutDiv).toHaveClass('bg-stone-100');
  });
});
