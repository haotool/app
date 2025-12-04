/**
 * SourceAccordion 組件測試
 *
 * [BDD 2025-12-05] 展開式來源清單組件完整測試
 * [context7:vitest-dev/vitest:2025-12-05]
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceAccordion } from './SourceAccordion';
import type { SurnameSource } from '../types';

// Mock 測試資料
const mockSources: SurnameSource[] = [
  {
    name: '巴哈姆特',
    title: '日治時代改姓資料整理',
    url: 'https://home.gamer.com.tw/creationDetail.php?sn=2850704',
  },
  {
    name: '國史館臺灣文獻館',
    title: '臺灣總督府檔案事典',
    url: 'https://www.th.gov.tw/CP-218-218-1d8a9-1.htm',
  },
];

describe('SourceAccordion', () => {
  describe('Basic Rendering', () => {
    it('should render accordion header', () => {
      render(<SourceAccordion sources={mockSources} />);

      expect(screen.getByText('歷史來源與變異法')).toBeInTheDocument();
    });

    it('should render count when provided', () => {
      render(<SourceAccordion sources={mockSources} count={208} />);

      expect(screen.getByText('(208 筆記錄)')).toBeInTheDocument();
    });

    it('should not render count when not provided', () => {
      render(<SourceAccordion sources={mockSources} />);

      expect(screen.queryByText(/筆記錄/)).not.toBeInTheDocument();
    });

    it('should have correct aria attributes', () => {
      render(<SourceAccordion sources={mockSources} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls', 'source-content');
    });
  });

  describe('Expand/Collapse Behavior', () => {
    it('should be collapsed by default', () => {
      render(<SourceAccordion sources={mockSources} />);

      const content = document.getElementById('source-content');
      expect(content).toHaveStyle({ maxHeight: '0px', opacity: '0' });
    });

    it('should expand when header is clicked', () => {
      render(<SourceAccordion sources={mockSources} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should collapse when clicked again', () => {
      render(<SourceAccordion sources={mockSources} />);

      const button = screen.getByRole('button');
      fireEvent.click(button); // 展開
      fireEvent.click(button); // 收合

      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Source List Rendering', () => {
    it('should render all source items when expanded', () => {
      render(<SourceAccordion sources={mockSources} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('日治時代改姓資料整理')).toBeInTheDocument();
      expect(screen.getByText('臺灣總督府檔案事典')).toBeInTheDocument();
    });

    it('should render source names', () => {
      render(<SourceAccordion sources={mockSources} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('巴哈姆特')).toBeInTheDocument();
      expect(screen.getByText('國史館臺灣文獻館')).toBeInTheDocument();
    });

    it('should render external links with correct attributes', () => {
      render(<SourceAccordion sources={mockSources} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);

      links.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should render correct URLs for each source', () => {
      render(<SourceAccordion sources={mockSources} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute(
        'href',
        'https://home.gamer.com.tw/creationDetail.php?sn=2850704',
      );
      expect(links[1]).toHaveAttribute('href', 'https://www.th.gov.tw/CP-218-218-1d8a9-1.htm');
    });
  });

  describe('Description Rendering', () => {
    const description = '郡望法(穎川源自河南穎川堂)；拆字法(如東城暗示陳)';

    it('should render description when provided', () => {
      render(<SourceAccordion sources={mockSources} description={description} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('變異法說明')).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('should not render description section when not provided', () => {
      render(<SourceAccordion sources={mockSources} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.queryByText('變異法說明')).not.toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    it('should render footer with attribution', () => {
      render(<SourceAccordion sources={mockSources} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText(/國史館臺灣文獻館檔案/)).toBeInTheDocument();
      expect(screen.getByText(/最後更新：2025-12-04/)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should handle empty sources array', () => {
      render(<SourceAccordion sources={[]} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // 應該仍然顯示標題
      expect(screen.getByText('歷史來源與變異法')).toBeInTheDocument();
      // 不應該有連結
      expect(screen.queryAllByRole('link')).toHaveLength(0);
    });
  });
});
