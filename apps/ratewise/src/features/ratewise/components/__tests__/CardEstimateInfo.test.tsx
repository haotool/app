/**
 * CardEstimateInfo 測試（ADR-002 Phase 1）：
 * 計算式揭露與引擎乘數同源（值-標籤耦合）、手續費 stepper 夾限、免責連結。
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { CardEstimateInfo, formatCardFeeMultiplier } from '../CardEstimateInfo';
import { useConverterStore } from '../../../../stores/converterStore';
import {
  getCardFeeMultiplier,
  resolveCardBasisRateType,
} from '../../../../utils/exchangeRateCalculation';
import { CARD_FEE_PERCENT_DEFAULT } from '../../constants';
import type { RateType } from '../../types';

const renderInfo = (basisRateType: RateType = 'spot') =>
  render(
    <MemoryRouter>
      <CardEstimateInfo basisRateType={basisRateType} />
    </MemoryRouter>,
  );

describe('CardEstimateInfo', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useConverterStore.setState({ cardFeePercent: CARD_FEE_PERCENT_DEFAULT });
  });

  it('顯示常駐「估算」badge 與計算式（預設 1.5% → × 1.015）', () => {
    renderInfo('spot');

    expect(screen.getByTestId('card-estimate-badge')).toHaveTextContent('估算');
    expect(screen.getByTestId('card-estimate-formula')).toHaveTextContent(
      '= 即期賣出 × 1.015（含 1.5% 海外手續費）',
    );
  });

  it('basisRateType=cash（即期缺失回落）時計算式基準誠實標「現金賣出」', () => {
    renderInfo('cash');

    expect(screen.getByTestId('card-estimate-formula')).toHaveTextContent('現金賣出');
  });

  it('S1 基準揭露與引擎 fallback 同判準：resolveCardBasisRateType 依 spot 可用性決定', () => {
    expect(resolveCardBasisRateType({ spot: true, cash: true })).toBe('spot');
    expect(resolveCardBasisRateType({ spot: true, cash: false })).toBe('spot');
    // 即期缺失（KRW 情境）→ 誠實揭露現金，與引擎賣出腿 spot→cash fallback 一致。
    expect(resolveCardBasisRateType({ spot: false, cash: true })).toBe('cash');
  });

  it('值-標籤耦合：揭露乘數與引擎 getCardFeeMultiplier 同源', () => {
    for (const fee of [0, 1.5, 2.3, 3]) {
      expect(Number(formatCardFeeMultiplier(fee))).toBeCloseTo(getCardFeeMultiplier(fee), 10);
    }
    // 去尾零顯示：0% → 1、3% → 1.03。
    expect(formatCardFeeMultiplier(0)).toBe('1');
    expect(formatCardFeeMultiplier(3)).toBe('1.03');
  });

  it('stepper 調整手續費並同步計算式（1.5 → 1.6 → 1.5）', () => {
    renderInfo('spot');

    fireEvent.click(screen.getByTestId('card-fee-increase'));
    expect(useConverterStore.getState().cardFeePercent).toBe(1.6);
    expect(screen.getByTestId('card-fee-value')).toHaveTextContent('1.6%');
    expect(screen.getByTestId('card-estimate-formula')).toHaveTextContent('1.016');

    fireEvent.click(screen.getByTestId('card-fee-decrease'));
    expect(useConverterStore.getState().cardFeePercent).toBe(1.5);
  });

  it('手續費下限 0%：減號 aria-disabled 且不再下調', () => {
    useConverterStore.setState({ cardFeePercent: 0 });
    renderInfo('spot');

    const decrease = screen.getByTestId('card-fee-decrease');
    expect(decrease).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(decrease);
    expect(useConverterStore.getState().cardFeePercent).toBe(0);
  });

  it('手續費上限 3%：加號 aria-disabled 且不再上調', () => {
    useConverterStore.setState({ cardFeePercent: 3 });
    renderInfo('spot');

    const increase = screen.getByTestId('card-fee-increase');
    expect(increase).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(increase);
    expect(useConverterStore.getState().cardFeePercent).toBe(3);
  });

  it('免責一行連到 /card-rate-guide/', () => {
    renderInfo('spot');

    expect(screen.getByTestId('card-estimate-disclaimer')).toHaveTextContent(
      '實際扣款以發卡行清算日匯率為準',
    );
    expect(screen.getByRole('link', { name: '刷卡匯率指南' })).toHaveAttribute(
      'href',
      '/card-rate-guide/',
    );
  });
});
