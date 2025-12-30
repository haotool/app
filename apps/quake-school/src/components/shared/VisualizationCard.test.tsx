/**
 * VisualizationCard 組件測試
 *
 * BDD 循環: 🔴 RED → 🟢 GREEN → 🔵 REFACTOR
 * 測試目標: 驗證統一卡片容器的結構和空間計算
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisualizationCard } from './VisualizationCard';

describe('🔴 RED: VisualizationCard 統一容器', () => {
  describe('結構渲染測試', () => {
    it('應該渲染三段式結構（header/visualization/footer）', () => {
      render(
        <VisualizationCard
          header={<div data-testid="test-header">Test Header</div>}
          visualization={<div data-testid="test-viz">Test Visualization</div>}
          footer={<div data-testid="test-footer">Test Footer</div>}
        />,
      );

      // 驗證所有三個區塊都存在
      expect(screen.getByTestId('test-header')).toBeInTheDocument();
      expect(screen.getByTestId('test-viz')).toBeInTheDocument();
      expect(screen.getByTestId('test-footer')).toBeInTheDocument();
    });

    it('應該正確應用容器樣式（白色背景、圓角、邊框）', () => {
      const { container: _container } = render(
        <VisualizationCard
          header={<div>Header</div>}
          visualization={<div>Viz</div>}
          footer={<div>Footer</div>}
        />,
      );

      const card = _container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('rounded-[2.5rem]');
      expect(card.className).toContain('border-sky-100');
      expect(card.className).toContain('shadow-xl');
    });

    it('應該支援自訂 className', () => {
      const { container: _container } = render(
        <VisualizationCard
          header={<div>Header</div>}
          visualization={<div>Viz</div>}
          footer={<div>Footer</div>}
          className="custom-class"
        />,
      );

      const card = _container.firstChild as HTMLElement;
      expect(card.className).toContain('custom-class');
    });
  });

  describe('視覺化高度測試', () => {
    it('應該使用預設高度（medium）', () => {
      render(
        <VisualizationCard
          header={<div>Header</div>}
          visualization={<div data-testid="viz">Viz</div>}
          footer={<div>Footer</div>}
        />,
      );

      const vizContainer = screen.getByTestId('viz').parentElement;
      expect(vizContainer?.className).toContain('h-56');
      expect(vizContainer?.className).toContain('sm:h-64');
    });

    it('應該支援 small 高度', () => {
      render(
        <VisualizationCard
          header={<div>Header</div>}
          visualization={<div data-testid="viz">Viz</div>}
          footer={<div>Footer</div>}
          visualizationHeight="small"
        />,
      );

      const vizContainer = screen.getByTestId('viz').parentElement;
      expect(vizContainer?.className).toContain('h-48');
      expect(vizContainer?.className).toContain('sm:h-56');
    });

    it('應該支援 large 高度', () => {
      render(
        <VisualizationCard
          header={<div>Header</div>}
          visualization={<div data-testid="viz">Viz</div>}
          footer={<div>Footer</div>}
          visualizationHeight="large"
        />,
      );

      const vizContainer = screen.getByTestId('viz').parentElement;
      expect(vizContainer?.className).toContain('h-64');
      expect(vizContainer?.className).toContain('sm:h-80');
    });
  });

  describe('視覺化區域樣式測試', () => {
    it('應該應用深色背景（bg-slate-950）', () => {
      render(
        <VisualizationCard
          header={<div>Header</div>}
          visualization={<div data-testid="viz">Viz</div>}
          footer={<div>Footer</div>}
        />,
      );

      const vizContainer = screen.getByTestId('viz').parentElement;
      expect(vizContainer?.className).toContain('bg-slate-950');
    });

    it('應該應用 flex 置中對齊', () => {
      render(
        <VisualizationCard
          header={<div>Header</div>}
          visualization={<div data-testid="viz">Viz</div>}
          footer={<div>Footer</div>}
        />,
      );

      const vizContainer = screen.getByTestId('viz').parentElement;
      expect(vizContainer?.className).toContain('flex');
      expect(vizContainer?.className).toContain('items-center');
      expect(vizContainer?.className).toContain('justify-center');
    });

    it('應該應用 overflow-hidden', () => {
      render(
        <VisualizationCard
          header={<div>Header</div>}
          visualization={<div data-testid="viz">Viz</div>}
          footer={<div>Footer</div>}
        />,
      );

      const vizContainer = screen.getByTestId('viz').parentElement;
      expect(vizContainer?.className).toContain('overflow-hidden');
    });
  });

  describe('React.ReactNode 內容測試', () => {
    it('應該正確渲染複雜的 header 內容', () => {
      render(
        <VisualizationCard
          header={
            <div>
              <h4 data-testid="title">Title</h4>
              <button data-testid="button">Button</button>
            </div>
          }
          visualization={<div>Viz</div>}
          footer={<div>Footer</div>}
        />,
      );

      expect(screen.getByTestId('title')).toBeInTheDocument();
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    it('應該正確渲染 SVG visualization 內容', () => {
      render(
        <VisualizationCard
          header={<div>Header</div>}
          visualization={
            <svg data-testid="test-svg">
              <circle cx="50" cy="50" r="40" />
            </svg>
          }
          footer={<div>Footer</div>}
        />,
      );

      expect(screen.getByTestId('test-svg')).toBeInTheDocument();
    });

    it('應該正確渲染複雜的 footer 內容', () => {
      render(
        <VisualizationCard
          header={<div>Header</div>}
          visualization={<div>Viz</div>}
          footer={
            <div>
              <p data-testid="description">Description</p>
              <input data-testid="slider" type="range" />
            </div>
          }
        />,
      );

      expect(screen.getByTestId('description')).toBeInTheDocument();
      expect(screen.getByTestId('slider')).toBeInTheDocument();
    });
  });
});
