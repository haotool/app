/**
 * Home page tests
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from '../utils/react-helmet-async';
import Home from './Home';

// Helper to render Home with required providers
const renderHome = () => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </HelmetProvider>,
  );
};

describe('Home Page', () => {
  describe('Initial Render', () => {
    it('should render the main title', () => {
      renderHome();
      expect(screen.getByText('皇民化改姓運動')).toBeInTheDocument();
    });

    it('should render the Taiwan 1940 label', () => {
      renderHome();
      expect(screen.getByText('Taiwan 1940')).toBeInTheDocument();
    });

    it('should render surname input field', () => {
      renderHome();
      const surnameInput = screen.getByPlaceholderText('陳');
      expect(surnameInput).toBeInTheDocument();
    });

    it('should render given name input field', () => {
      renderHome();
      const givenNameInput = screen.getByPlaceholderText('隨機');
      expect(givenNameInput).toBeInTheDocument();
    });

    it('should render the submit button', () => {
      renderHome();
      expect(screen.getByText('改名実行')).toBeInTheDocument();
    });

    it('should have disabled submit button when surname is empty', () => {
      renderHome();
      const button = screen.getByRole('button', { name: /改名実行/i });
      expect(button).toBeDisabled();
    });
  });

  describe('User Interaction - Input Step', () => {
    it('should enable submit button when surname is entered', () => {
      renderHome();
      const surnameInput = screen.getByPlaceholderText('陳');
      fireEvent.change(surnameInput, { target: { value: '林' } });

      const button = screen.getByRole('button', { name: /改名実行/i });
      expect(button).not.toBeDisabled();
    });

    it('should allow entering surname', () => {
      renderHome();
      const surnameInput = screen.getByPlaceholderText('陳') as HTMLInputElement;
      fireEvent.change(surnameInput, { target: { value: '王' } });
      expect(surnameInput.value).toBe('王');
    });

    it('should allow entering given name', () => {
      renderHome();
      const givenNameInput = screen.getByPlaceholderText('隨機') as HTMLInputElement;
      fireEvent.change(givenNameInput, { target: { value: '小明' } });
      expect(givenNameInput.value).toBe('小明');
    });
  });

  describe('Name Generation', () => {
    it('should show loading state when generating names', () => {
      renderHome();
      const surnameInput = screen.getByPlaceholderText('陳');
      fireEvent.change(surnameInput, { target: { value: '林' } });

      const button = screen.getByRole('button', { name: /改名実行/i });
      fireEvent.click(button);

      // 載入狀態使用 KamonIcon 動畫（animate-spin 類別）
      const loadingIcon = document.querySelector('.animate-spin');
      expect(loadingIcon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper input labels', () => {
      renderHome();
      expect(screen.getByText('Surname (Traditional Chinese)')).toBeInTheDocument();
      expect(screen.getByText('Given Name')).toBeInTheDocument();
    });
  });
});

describe('Home Page Components', () => {
  describe('SakuraBackground', () => {
    it('should render sakura petals', () => {
      renderHome();
      // The component renders SVG elements for petals
      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });
});
