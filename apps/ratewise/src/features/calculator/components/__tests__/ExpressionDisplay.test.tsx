/**
 * ExpressionDisplay.test.tsx - 運算式顯示元件測試
 *
 * 測試核心顯示行為
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpressionDisplay } from '../ExpressionDisplay';

describe('ExpressionDisplay', () => {
  describe('運算式顯示', () => {
    it('應顯示空運算式時顯示提示文字', () => {
      render(<ExpressionDisplay expression="" result={null} error={null} />);
      expect(screen.getByText('輸入數字或表達式')).toBeInTheDocument();
    });

    it('應顯示運算式', () => {
      render(<ExpressionDisplay expression="2 + 3" result={null} error={null} />);
      expect(screen.getByText('2 + 3')).toBeInTheDocument();
    });

    it('應顯示長運算式（含千位分隔符格式化）', () => {
      const longExpression = '123 + 456 - 789 × 012 ÷ 345';
      render(<ExpressionDisplay expression={longExpression} result={null} error={null} />);
      // formatExpression 會移除前導零（012 → 12）並格式化數字
      expect(screen.getByText('123 + 456 - 789 × 12 ÷ 345')).toBeInTheDocument();
    });

    it('應處理特殊字元', () => {
      render(<ExpressionDisplay expression="(1 + 2) × 3" result={null} error={null} />);
      expect(screen.getByText('(1 + 2) × 3')).toBeInTheDocument();
    });
  });

  describe('結果顯示', () => {
    it('應顯示計算結果', () => {
      render(<ExpressionDisplay expression="2 + 3" result={5} error={null} />);
      expect(screen.getByText('= 5')).toBeInTheDocument();
    });

    it('應顯示小數結果', () => {
      render(<ExpressionDisplay expression="1 ÷ 3" result={0.33} error={null} />);
      expect(screen.getByText('= 0.33')).toBeInTheDocument();
    });

    it('應顯示整數結果不帶小數點', () => {
      render(<ExpressionDisplay expression="4 ÷ 2" result={2} error={null} />);
      expect(screen.getByText('= 2')).toBeInTheDocument();
    });

    it('應處理負數結果', () => {
      render(<ExpressionDisplay expression="5 - 10" result={-5} error={null} />);
      expect(screen.getByText('= -5')).toBeInTheDocument();
    });

    it('應處理零結果', () => {
      render(<ExpressionDisplay expression="5 - 5" result={0} error={null} />);
      expect(screen.getByText('= 0')).toBeInTheDocument();
    });
  });

  describe('錯誤顯示', () => {
    it('應顯示錯誤訊息', () => {
      render(<ExpressionDisplay expression="1 + +" result={null} error="表達式格式錯誤" />);
      expect(screen.getByText('表達式格式錯誤')).toBeInTheDocument();
    });

    it('應優先顯示錯誤而非結果', () => {
      render(<ExpressionDisplay expression="2 + 3" result={5} error="Some error" />);
      expect(screen.getByText('Some error')).toBeInTheDocument();
      expect(screen.queryByText('= 5')).not.toBeInTheDocument();
    });
  });

  describe('無障礙', () => {
    it('應包含表達式標籤', () => {
      render(<ExpressionDisplay expression="2 + 3" result={null} error={null} />);
      expect(screen.getByLabelText('當前表達式')).toBeInTheDocument();
    });

    it('應在錯誤時提供 alert role', () => {
      const { container } = render(
        <ExpressionDisplay expression="1 + +" result={null} error="Invalid" />,
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });
  });
});
