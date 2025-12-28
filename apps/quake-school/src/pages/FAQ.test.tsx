/**
 * FAQ Page Tests
 * BDD: Given-When-Then
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RouterWrapper } from '../test/RouterWrapper';
import { Component as FAQ } from './FAQ';

describe('FAQ Page', () => {
  describe('當使用者訪問常見問題頁面時', () => {
    it('應該顯示「常見問題」標題', () => {
      render(
        <RouterWrapper initialEntries={['/faq']}>
          <FAQ />
        </RouterWrapper>,
      );

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('常見問題');
    });

    it('應該顯示分類標題', () => {
      render(
        <RouterWrapper initialEntries={['/faq']}>
          <FAQ />
        </RouterWrapper>,
      );

      expect(screen.getByText('地震知識')).toBeInTheDocument();
      expect(screen.getByText('防災準備')).toBeInTheDocument();
      expect(screen.getByText('緊急應變')).toBeInTheDocument();
      expect(screen.getByText('應用程式')).toBeInTheDocument();
    });

    it('應該顯示 FAQ 問題', () => {
      render(
        <RouterWrapper initialEntries={['/faq']}>
          <FAQ />
        </RouterWrapper>,
      );

      expect(screen.getByText('什麼是地震？')).toBeInTheDocument();
      expect(screen.getByText('家庭防災包應該準備什麼？')).toBeInTheDocument();
    });
  });

  describe('當使用者點擊 FAQ 項目時', () => {
    it('應該展開並顯示答案', () => {
      render(
        <RouterWrapper initialEntries={['/faq']}>
          <FAQ />
        </RouterWrapper>,
      );

      // 點擊問題
      const questionButton = screen.getByRole('button', {
        name: /什麼是地震？/i,
      });
      fireEvent.click(questionButton);

      // 應該顯示答案
      expect(screen.getByText(/地震是地球內部板塊運動/i)).toBeInTheDocument();
    });

    it('再次點擊應該收合答案', () => {
      render(
        <RouterWrapper initialEntries={['/faq']}>
          <FAQ />
        </RouterWrapper>,
      );

      const questionButton = screen.getByRole('button', {
        name: /什麼是地震？/i,
      });

      // 展開
      fireEvent.click(questionButton);
      expect(screen.getByText(/地震是地球內部板塊運動/i)).toBeInTheDocument();

      // 收合
      fireEvent.click(questionButton);
      expect(screen.queryByText(/地震是地球內部板塊運動/i)).not.toBeInTheDocument();
    });
  });
});
