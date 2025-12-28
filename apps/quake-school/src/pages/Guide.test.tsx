/**
 * Guide Page Tests
 * BDD: Given-When-Then
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterWrapper } from '../test/RouterWrapper';
import { Component as Guide } from './Guide';

describe('Guide Page', () => {
  describe('當使用者訪問防災指南頁面時', () => {
    it('應該顯示「地震防災指南」標題', () => {
      render(
        <RouterWrapper initialEntries={['/guide']}>
          <Guide />
        </RouterWrapper>,
      );

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('地震防災指南');
    });

    it('應該顯示三個階段的防災指南', () => {
      render(
        <RouterWrapper initialEntries={['/guide']}>
          <Guide />
        </RouterWrapper>,
      );

      expect(screen.getByText('地震前：做好準備')).toBeInTheDocument();
      expect(screen.getByText('地震時：正確應變')).toBeInTheDocument();
      expect(screen.getByText('地震後：安全確認')).toBeInTheDocument();
    });

    it('應該顯示「趴下、掩護、穩住」三步驟', () => {
      render(
        <RouterWrapper initialEntries={['/guide']}>
          <Guide />
        </RouterWrapper>,
      );

      expect(screen.getByText('趴下 (Drop)')).toBeInTheDocument();
      expect(screen.getByText('掩護 (Cover)')).toBeInTheDocument();
      expect(screen.getByText('穩住 (Hold On)')).toBeInTheDocument();
    });

    it('應該顯示防災包清單', () => {
      render(
        <RouterWrapper initialEntries={['/guide']}>
          <Guide />
        </RouterWrapper>,
      );

      expect(screen.getByText('防災包清單')).toBeInTheDocument();
      expect(screen.getByText('飲用水')).toBeInTheDocument();
      expect(screen.getByText('乾糧')).toBeInTheDocument();
      expect(screen.getByText('手電筒')).toBeInTheDocument();
    });

    it('應該顯示緊急聯絡電話', () => {
      render(
        <RouterWrapper initialEntries={['/guide']}>
          <Guide />
        </RouterWrapper>,
      );

      expect(screen.getByText('緊急聯絡電話')).toBeInTheDocument();
      expect(screen.getByText('119')).toBeInTheDocument();
      expect(screen.getByText('110')).toBeInTheDocument();
      expect(screen.getByText('1999')).toBeInTheDocument();
    });
  });
});
