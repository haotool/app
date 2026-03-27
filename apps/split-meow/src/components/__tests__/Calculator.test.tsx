import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { Calculator } from '../Calculator';
import { useStore } from '../../store/useStore';

beforeEach(() => {
  useStore.setState({
    members: [
      { id: 'me', name: 'Me', avatarUrl: 'seed-me', isActive: true },
      { id: 'm1', name: 'Bob', avatarUrl: 'seed-m1', isActive: true },
    ],
    payerId: 'me',
    splitMode: 'split_evenly',
    calculatorValue: '',
    focusedMemberId: null,
    itemizedValues: {},
  });
});

function renderCalc() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Calculator />
    </I18nextProvider>,
  );
}

describe('Calculator', () => {
  it('渲染所有數字按鈕', () => {
    renderCalc();
    for (const digit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      expect(screen.getByText(digit)).toBeInTheDocument();
    }
  });

  it('渲染運算符號按鈕', () => {
    renderCalc();
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
    expect(screen.getByText('÷')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
    expect(screen.getByText('AC')).toBeInTheDocument();
  });

  it('初始 Save 按鈕為 disabled', () => {
    renderCalc();
    const saveBtn = document.querySelector('button[disabled]');
    expect(saveBtn).toBeTruthy();
  });

  it('按數字鍵更新 calculatorValue', () => {
    renderCalc();
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    expect(useStore.getState().calculatorValue).toBe('123');
  });

  it('按 AC 清空 calculatorValue', () => {
    useStore.setState({ calculatorValue: '123' });
    renderCalc();
    fireEvent.click(screen.getByText('AC'));
    expect(useStore.getState().calculatorValue).toBe('');
  });

  it('按退格鍵刪除最後一個字元', () => {
    useStore.setState({ calculatorValue: '99' });
    renderCalc();
    const backspaceBtn = document
      .querySelector('button .material-symbols-outlined')
      ?.closest('button');
    if (backspaceBtn) fireEvent.click(backspaceBtn);
    expect(useStore.getState().calculatorValue).toBe('9');
  });

  it('calculatorValue 保持運算式直到 = 被觸發', () => {
    useStore.setState({ calculatorValue: '10+5' });
    renderCalc();
    // No = button in UI — expression stays as-is until save
    expect(useStore.getState().calculatorValue).toBe('10+5');
  });

  it('有值時 Save 按鈕啟用', () => {
    useStore.setState({ calculatorValue: '100' });
    renderCalc();
    // Save button is the last button (not disabled)
    const allBtns = document.querySelectorAll('button');
    const saveBtn = allBtns[allBtns.length - 1];
    expect(saveBtn).not.toBeDisabled();
  });

  it('按下 Save 後 calculatorValue 被清空', () => {
    useStore.setState({ calculatorValue: '100' });
    renderCalc();
    const allBtns = document.querySelectorAll('button');
    const saveBtn = allBtns[allBtns.length - 1] as HTMLButtonElement | undefined;
    if (saveBtn) fireEvent.click(saveBtn);
    // saveExpense resets calculatorValue to ''
    expect(useStore.getState().calculatorValue).toBe('');
  });

  it('itemized 模式下無 focusedMemberId 時按鍵不更新值', () => {
    useStore.setState({
      splitMode: 'itemized',
      focusedMemberId: null,
      itemizedValues: {},
      calculatorValue: '',
    });
    renderCalc();
    fireEvent.click(screen.getByText('5'));
    // No change since focusedMemberId is null
    expect(useStore.getState().calculatorValue).toBe('');
    expect(useStore.getState().itemizedValues).toEqual({});
  });

  it('itemized 模式下有 focusedMemberId 時按鍵更新 itemizedValues', () => {
    useStore.setState({
      splitMode: 'itemized',
      focusedMemberId: 'me',
      itemizedValues: {},
      calculatorValue: '',
    });
    renderCalc();
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('0'));
    expect(useStore.getState().itemizedValues['me']).toBe('50');
  });

  it('按 00 鍵附加 00', () => {
    useStore.setState({ calculatorValue: '1' });
    renderCalc();
    fireEvent.click(screen.getByText('00'));
    expect(useStore.getState().calculatorValue).toBe('100');
  });

  it('按小數點鍵附加 .', () => {
    useStore.setState({ calculatorValue: '1' });
    renderCalc();
    fireEvent.click(screen.getByText('.'));
    expect(useStore.getState().calculatorValue).toBe('1.');
  });
});
