/**
 * About page tests
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from '../utils/helmet';
import About from './About';

// Helper to render About with required providers
const renderAbout = () => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <About />
      </MemoryRouter>
    </HelmetProvider>,
  );
};

describe('About Page', () => {
  it('should render the page title', () => {
    renderAbout();
    expect(screen.getByText('關於皇民化改姓生成器')).toBeInTheDocument();
  });

  it('should render the back link to home', () => {
    renderAbout();
    const backLink = screen.getByText('返回生成器');
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('should render historical background section', () => {
    renderAbout();
    expect(screen.getByText('歷史背景')).toBeInTheDocument();
  });

  it('should render FAQ section with questions', () => {
    renderAbout();
    expect(screen.getByText('常見問題')).toBeInTheDocument();
    expect(screen.getByText('什麼是皇民化運動？')).toBeInTheDocument();
    expect(screen.getByText('改姓是強制的嗎？')).toBeInTheDocument();
    expect(screen.getByText('改姓的原則是什麼？')).toBeInTheDocument();
    expect(screen.getByText('資料來源是什麼？')).toBeInTheDocument();
  });

  it('should render attribution section with source links', () => {
    renderAbout();
    expect(screen.getByText('資料來源')).toBeInTheDocument();
    // 更新後的來源連結標題
    expect(screen.getByText('【歷史說書】日治時期台灣人更改姓名活動及辦法')).toBeInTheDocument();
    expect(screen.getByText('日治時代改姓資料整理──取日文姓氏的參考')).toBeInTheDocument();
    expect(screen.getByText('臺灣總督府檔案事典 - 國史館臺灣文獻館')).toBeInTheDocument();
  });

  it('should render developer section', () => {
    renderAbout();
    expect(screen.getByText('開發者')).toBeInTheDocument();
    expect(screen.getByText('開源專案')).toBeInTheDocument();
  });

  it('should render footer with copyright', () => {
    renderAbout();
    expect(screen.getByText('本系統僅供歷史教育與娛樂用途')).toBeInTheDocument();
  });

  it('should have proper external links with security attributes', () => {
    renderAbout();
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
