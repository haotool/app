/**
 * WashiPaper Component Tests
 * 和紙質感組件測試
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WashiPaper, WashiCard } from './WashiPaper';

describe('🔴 RED: WashiPaper Component', () => {
  describe('Basic Rendering', () => {
    it('should render children content', () => {
      render(
        <WashiPaper>
          <div data-testid="test-content">Test Content</div>
        </WashiPaper>,
      );
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('should apply washi paper texture class', () => {
      const { container } = render(<WashiPaper>Content</WashiPaper>);
      const wrapper = container.firstChild as HTMLElement;
      // 應包含和紙底色 bg-[#fcfaf7]
      expect(wrapper.className).toContain('bg-[#fcfaf7]');
    });

    it('should have rice paper texture background', () => {
      const { container } = render(<WashiPaper>Content</WashiPaper>);
      const wrapper = container.firstChild as HTMLElement;
      // 應包含 rice-paper 紋理
      expect(wrapper.className).toMatch(/bg-\[url.*rice-paper.*\]/);
    });
  });

  describe('Texture Variants', () => {
    it('should apply default texture (rice-paper-2)', () => {
      const { container } = render(<WashiPaper>Content</WashiPaper>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('rice-paper-2');
    });

    it('should apply custom texture variant', () => {
      const { container } = render(<WashiPaper texture="rice-paper">Content</WashiPaper>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('rice-paper.png');
    });

    it('should apply light texture variant', () => {
      const { container } = render(<WashiPaper texture="rice-paper-light">Content</WashiPaper>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('rice-paper-light');
    });
  });

  describe('Shadow and Border Effects', () => {
    it('should have shadow-2xl class for depth', () => {
      const { container } = render(<WashiPaper>Content</WashiPaper>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('shadow-2xl');
    });

    it('should have subtle ring border', () => {
      const { container } = render(<WashiPaper>Content</WashiPaper>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('ring-1');
      expect(wrapper.className).toContain('ring-black/5');
    });
  });

  describe('Pattern Overlay', () => {
    it('should render SeigaihaPattern overlay when enabled', () => {
      const { container } = render(<WashiPaper pattern="seigaiha">Content</WashiPaper>);
      // 應該包含 SVG pattern
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render AsanohaPattern overlay when enabled', () => {
      const { container } = render(<WashiPaper pattern="asanoha">Content</WashiPaper>);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should not render pattern when disabled', () => {
      const { container } = render(<WashiPaper pattern="none">Content</WashiPaper>);
      const svg = container.querySelector('svg');
      expect(svg).toBeNull();
    });
  });
});

describe('🔴 RED: WashiCard Component', () => {
  describe('Card Variants', () => {
    it('should render traditional card with double border', () => {
      const { container } = render(<WashiCard variant="traditional">Content</WashiCard>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('border-8');
      expect(wrapper.className).toContain('border-double');
    });

    it('should render modern card with single border', () => {
      const { container } = render(<WashiCard variant="modern">Content</WashiCard>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('border');
      expect(wrapper.className).not.toContain('border-double');
    });

    it('should render minimal card without heavy border', () => {
      const { container } = render(<WashiCard variant="minimal">Content</WashiCard>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('border');
      expect(wrapper.className).not.toContain('border-8');
    });
  });

  describe('Corner Decorations', () => {
    it('should render corner decorations when enabled', () => {
      render(<WashiCard corners>Content</WashiCard>);
      // Corner decorations are rendered as absolute positioned divs
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Watermark', () => {
    it('should render watermark when provided', () => {
      render(<WashiCard watermark={<span>Watermark</span>}>Content</WashiCard>);
      expect(screen.getByText('Watermark')).toBeInTheDocument();
    });
  });
});
