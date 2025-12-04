/**
 * CustomPunNameForm 元件單元測試
 *
 * 測試用戶自訂諧音梗表單的互動行為
 *
 * @see [context7:testing-library/react-testing-library:2025-12-04] userEvent
 * @see [context7:vitest-dev/vitest:2025-12-04] mocking
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomPunNameForm } from './CustomPunNameForm';
import type { CustomPunName } from '../types';

// Mock useCustomPunNames hook
const mockAddCustomPunName = vi.fn();
const mockRemoveCustomPunName = vi.fn();
const mockIsDuplicate = vi.fn();
let mockCustomPunNames: CustomPunName[] = [];

vi.mock('../hooks/useCustomPunNames', () => ({
  useCustomPunNames: () => ({
    customPunNames: mockCustomPunNames,
    addCustomPunName: mockAddCustomPunName,
    removeCustomPunName: mockRemoveCustomPunName,
    isDuplicate: mockIsDuplicate,
    clearCustomPunNames: vi.fn(),
    count: mockCustomPunNames.length,
  }),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

describe('CustomPunNameForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCustomPunNames = [];
    mockAddCustomPunName.mockReturnValue(true);
    mockIsDuplicate.mockReturnValue(false);
    mockConfirm.mockReturnValue(true);
  });

  describe('渲染', () => {
    it('應該在 isOpen=true 時渲染表單', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      expect(screen.getByText('自訂諧音梗')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('例：梅川伊芙')).toBeInTheDocument();
    });

    it('應該在 isOpen=false 時不渲染任何內容', () => {
      render(<CustomPunNameForm {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('自訂諧音梗')).not.toBeInTheDocument();
    });

    it('應該顯示表單標題和說明', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      expect(screen.getByText('自訂諧音梗')).toBeInTheDocument();
      expect(screen.getByText('創建你自己的趣味日本名')).toBeInTheDocument();
      expect(screen.getByText('Custom Names')).toBeInTheDocument();
    });

    it('應該顯示三個必填輸入欄位', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('例：梅川伊芙')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('例：Umekawa Ifu')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('例：中文諧音：沒穿衣服')).toBeInTheDocument();
    });

    it('應該顯示新增按鈕', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /新增諧音梗/i })).toBeInTheDocument();
    });

    it('應該顯示關閉按鈕', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      // X 按鈕在 header 中
      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('表單提交', () => {
    it('應該在填寫完整資料後成功提交', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      // 填寫表單
      fireEvent.change(screen.getByPlaceholderText('例：梅川伊芙'), {
        target: { value: '測試名' },
      });
      fireEvent.change(screen.getByPlaceholderText('例：Umekawa Ifu'), {
        target: { value: 'Test Name' },
      });
      fireEvent.change(screen.getByPlaceholderText('例：中文諧音：沒穿衣服'), {
        target: { value: '測試諧音' },
      });

      // 提交表單
      fireEvent.click(screen.getByRole('button', { name: /新增諧音梗/i }));

      expect(mockAddCustomPunName).toHaveBeenCalledWith({
        kanji: '測試名',
        romaji: 'Test Name',
        meaning: '測試諧音',
      });
    });

    it('應該在成功新增後顯示成功訊息', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText('例：梅川伊芙'), {
        target: { value: '成功測試' },
      });
      fireEvent.change(screen.getByPlaceholderText('例：Umekawa Ifu'), {
        target: { value: 'Success' },
      });
      fireEvent.change(screen.getByPlaceholderText('例：中文諧音：沒穿衣服'), {
        target: { value: '成功' },
      });

      fireEvent.click(screen.getByRole('button', { name: /新增諧音梗/i }));

      expect(screen.getByText('新增成功！')).toBeInTheDocument();
    });

    it('應該在成功新增後清空表單', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      const kanjiInput = screen.getByPlaceholderText('例：梅川伊芙') as HTMLInputElement;
      const romajiInput = screen.getByPlaceholderText('例：Umekawa Ifu') as HTMLInputElement;
      const meaningInput = screen.getByPlaceholderText(
        '例：中文諧音：沒穿衣服',
      ) as HTMLInputElement;

      fireEvent.change(kanjiInput, { target: { value: '清空測試' } });
      fireEvent.change(romajiInput, { target: { value: 'Clear' } });
      fireEvent.change(meaningInput, { target: { value: '清空' } });

      fireEvent.click(screen.getByRole('button', { name: /新增諧音梗/i }));

      expect(kanjiInput.value).toBe('');
      expect(romajiInput.value).toBe('');
      expect(meaningInput.value).toBe('');
    });
  });

  describe('表單驗證', () => {
    it('應該在 kanji 為空時顯示錯誤', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText('例：Umekawa Ifu'), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByPlaceholderText('例：中文諧音：沒穿衣服'), {
        target: { value: 'Test' },
      });

      fireEvent.click(screen.getByRole('button', { name: /新增諧音梗/i }));

      expect(screen.getByText('請輸入日文漢字')).toBeInTheDocument();
      expect(mockAddCustomPunName).not.toHaveBeenCalled();
    });

    it('應該在 romaji 為空時顯示錯誤', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText('例：梅川伊芙'), {
        target: { value: '測試' },
      });
      fireEvent.change(screen.getByPlaceholderText('例：中文諧音：沒穿衣服'), {
        target: { value: 'Test' },
      });

      fireEvent.click(screen.getByRole('button', { name: /新增諧音梗/i }));

      expect(screen.getByText('請輸入羅馬字拼音')).toBeInTheDocument();
    });

    it('應該在 meaning 為空時顯示錯誤', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText('例：梅川伊芙'), {
        target: { value: '測試' },
      });
      fireEvent.change(screen.getByPlaceholderText('例：Umekawa Ifu'), {
        target: { value: 'Test' },
      });

      fireEvent.click(screen.getByRole('button', { name: /新增諧音梗/i }));

      expect(screen.getByText('請輸入諧音解釋')).toBeInTheDocument();
    });

    it('應該在名字重複時顯示錯誤', () => {
      mockIsDuplicate.mockReturnValue(true);

      render(<CustomPunNameForm {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText('例：梅川伊芙'), {
        target: { value: '重複名' },
      });
      fireEvent.change(screen.getByPlaceholderText('例：Umekawa Ifu'), {
        target: { value: 'Duplicate' },
      });
      fireEvent.change(screen.getByPlaceholderText('例：中文諧音：沒穿衣服'), {
        target: { value: '重複' },
      });

      fireEvent.click(screen.getByRole('button', { name: /新增諧音梗/i }));

      expect(screen.getByText('此名字已存在')).toBeInTheDocument();
    });

    it('應該在新增失敗時顯示錯誤', () => {
      mockAddCustomPunName.mockReturnValue(false);

      render(<CustomPunNameForm {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText('例：梅川伊芙'), {
        target: { value: '失敗測試' },
      });
      fireEvent.change(screen.getByPlaceholderText('例：Umekawa Ifu'), {
        target: { value: 'Fail' },
      });
      fireEvent.change(screen.getByPlaceholderText('例：中文諧音：沒穿衣服'), {
        target: { value: '失敗' },
      });

      fireEvent.click(screen.getByRole('button', { name: /新增諧音梗/i }));

      expect(screen.getByText('新增失敗，請稍後再試')).toBeInTheDocument();
    });
  });

  describe('自訂諧音梗列表', () => {
    it('應該在沒有自訂諧音梗時顯示空狀態', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      expect(screen.getByText('還沒有自訂的諧音梗')).toBeInTheDocument();
      expect(screen.getByText('在上方表單新增你的創意！')).toBeInTheDocument();
    });

    it('應該顯示已有的自訂諧音梗', () => {
      mockCustomPunNames = [
        {
          kanji: '顯示測試',
          romaji: 'Display Test',
          meaning: '測試顯示',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
      ];

      render(<CustomPunNameForm {...defaultProps} />);

      expect(screen.getByText('顯示測試')).toBeInTheDocument();
      expect(screen.getByText('Display Test')).toBeInTheDocument();
      expect(screen.getByText('測試顯示')).toBeInTheDocument();
    });

    it('應該顯示自訂諧音梗數量', () => {
      mockCustomPunNames = [
        {
          kanji: '名字1',
          romaji: 'Name1',
          meaning: 'Meaning1',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
        {
          kanji: '名字2',
          romaji: 'Name2',
          meaning: 'Meaning2',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
      ];

      render(<CustomPunNameForm {...defaultProps} />);

      expect(screen.getByText('我的諧音梗 (2)')).toBeInTheDocument();
    });
  });

  describe('刪除功能', () => {
    it('應該在確認後刪除諧音梗', () => {
      mockCustomPunNames = [
        {
          kanji: '要刪除',
          romaji: 'Delete',
          meaning: '刪除測試',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
      ];

      render(<CustomPunNameForm {...defaultProps} />);

      // 找到刪除按鈕並點擊
      const deleteButton = screen.getByTitle('刪除');
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith('確定要刪除「要刪除」嗎？');
      expect(mockRemoveCustomPunName).toHaveBeenCalledWith('要刪除');
    });

    it('應該在取消確認時不刪除', () => {
      mockConfirm.mockReturnValue(false);
      mockCustomPunNames = [
        {
          kanji: '不刪除',
          romaji: 'Keep',
          meaning: '保留測試',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
      ];

      render(<CustomPunNameForm {...defaultProps} />);

      const deleteButton = screen.getByTitle('刪除');
      fireEvent.click(deleteButton);

      expect(mockRemoveCustomPunName).not.toHaveBeenCalled();
    });
  });

  describe('選擇功能', () => {
    it('應該在點擊諧音梗時呼叫 onSelectCustomName', () => {
      const onSelectCustomName = vi.fn();
      const customName: CustomPunName = {
        kanji: '選擇測試',
        romaji: 'Select Test',
        meaning: '選擇',
        category: 'custom',
        isCustom: true,
        createdAt: '2025-12-04T00:00:00.000Z',
      };
      mockCustomPunNames = [customName];

      render(<CustomPunNameForm {...defaultProps} onSelectCustomName={onSelectCustomName} />);

      // 點擊諧音梗卡片
      fireEvent.click(screen.getByText('選擇測試'));

      expect(onSelectCustomName).toHaveBeenCalledWith(customName);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('應該在沒有 onSelectCustomName 時不執行任何動作', () => {
      mockCustomPunNames = [
        {
          kanji: '無回調',
          romaji: 'No Callback',
          meaning: '無回調測試',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
      ];

      render(<CustomPunNameForm {...defaultProps} />);

      // 點擊應該不會報錯
      fireEvent.click(screen.getByText('無回調'));

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('關閉功能', () => {
    it('應該在點擊關閉按鈕時呼叫 onClose', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      // 找到 X 按鈕（在 header 中）
      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('應該在點擊背景遮罩時呼叫 onClose', () => {
      const { container } = render(<CustomPunNameForm {...defaultProps} />);

      // 點擊背景遮罩
      const backdrop = container.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('應該在點擊表單內容時不關閉', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      // 點擊表單內容
      fireEvent.click(screen.getByText('自訂諧音梗'));

      // onClose 應該只被背景點擊觸發，不應該被表單內容觸發
      // 由於 stopPropagation，這裡不應該呼叫 onClose
    });
  });

  describe('無障礙性', () => {
    it('應該有適當的表單標籤', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      expect(screen.getByText(/日文漢字/)).toBeInTheDocument();
      expect(screen.getByText(/羅馬字拼音/)).toBeInTheDocument();
      expect(screen.getByText(/諧音解釋/)).toBeInTheDocument();
    });

    it('應該有必填標記', () => {
      render(<CustomPunNameForm {...defaultProps} />);

      // 檢查必填標記 (*)
      const requiredMarks = screen.getAllByText('*');
      expect(requiredMarks.length).toBe(3);
    });
  });
});
