/**
 * E3 v2 幣別選擇 bottom sheet：取代 legacy 原生 select（審計指出的最大差距）。
 * 僅供 v2 模式使用，不動 legacy 模式的 select。
 * E1 收斂：改為 CurrencyPicker primitive 的 domain 綁定薄封裝（搜尋/旗幟由 primitive 提供）。
 * @see .claude/prds/ratewise-e1-design-system-design.md
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CurrencyPicker } from '../../../../components/CurrencyPicker';
import { useConverterStore } from '../../../../stores/converterStore';
import { CURRENCY_DEFINITIONS } from '../../constants';
import type { CurrencyCode } from '../../types';

const CURRENCY_CODES = Object.keys(CURRENCY_DEFINITIONS) as CurrencyCode[];

export interface CurrencyPickerSheetProps {
  isOpen: boolean;
  selected: CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
  onClose: () => void;
}

export function CurrencyPickerSheet({
  isOpen,
  selected,
  onSelect,
  onClose,
}: CurrencyPickerSheetProps) {
  const { t } = useTranslation();
  // 常用置頂：直接吃使用者收藏（converterStore SSOT），依收藏順序置頂。
  const favorites = useConverterStore((state) => state.favorites);

  const items = useMemo(
    () =>
      CURRENCY_CODES.map((code) => ({
        code,
        flag: CURRENCY_DEFINITIONS[code].flag,
        name: CURRENCY_DEFINITIONS[code].name,
      })),
    [],
  );

  return (
    <CurrencyPicker
      isOpen={isOpen}
      selected={selected}
      onSelect={(code) => onSelect(code as CurrencyCode)}
      onClose={onClose}
      items={items}
      pinned={favorites}
      title={t('converterV2.pickerTitle')}
      closeLabel={t('converterV2.close')}
      searchLabel={t('converterV2.pickerSearch')}
    />
  );
}
