/**
 * CurrencyPicker primitive（E1 系統元件）
 *
 * 由 E3 選幣 sheet 泛化的共用選幣元件：搜尋、常用置頂、旗幟。
 * 資料（幣別清單/旗幟/名稱）與文案由消費端傳入，primitive 不綁定匯率 domain。
 * 殼層使用 BottomSheet（adaptive 模式）。
 */

import { useMemo, useState, type ReactNode } from 'react';
import { BottomSheet } from './BottomSheet';

export interface CurrencyPickerItem {
  code: string;
  /** emoji 旗幟。 */
  flag: string;
  name: string;
}

export interface CurrencyPickerProps {
  isOpen: boolean;
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
  items: readonly CurrencyPickerItem[];
  /** 置頂常用幣別代碼（依給定順序）。 */
  pinned?: readonly string[];
  title: ReactNode;
  closeLabel: string;
  /** 搜尋輸入的 aria-label 兼 placeholder。 */
  searchLabel: string;
  testId?: string;
}

export function CurrencyPicker({
  isOpen,
  selected,
  onSelect,
  onClose,
  items,
  pinned = [],
  title,
  closeLabel,
  searchLabel,
  testId = 'currency-picker-sheet',
}: CurrencyPickerProps) {
  const [query, setQuery] = useState('');

  const sortedItems = useMemo(() => {
    if (pinned.length === 0) return items;
    const pinnedSet = new Set(pinned);
    const top = pinned
      .map((code) => items.find((item) => item.code === code))
      .filter((item): item is CurrencyPickerItem => item !== undefined);
    return [...top, ...items.filter((item) => !pinnedSet.has(item.code))];
  }, [items, pinned]);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return sortedItems;
    return sortedItems.filter(
      (item) =>
        item.code.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword),
    );
  }, [sortedItems, query]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={typeof title === 'string' ? title : searchLabel}
      title={title}
      closeLabel={closeLabel}
      size="adaptive"
      testId={testId}
    >
      <div className="px-5 pb-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchLabel}
          aria-label={searchLabel}
          data-testid="currency-picker-search"
          className="w-full min-h-11 rounded-control border border-border bg-surface-elevated px-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        />
      </div>
      <ul className="flex-1 overflow-y-auto px-3 pb-6" role="listbox">
        {filteredItems.map((item) => {
          const isSelected = item.code === selected;
          return (
            <li key={item.code}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(item.code)}
                data-testid={`currency-option-${item.code}`}
                className={`flex w-full items-center justify-between rounded-control px-3 min-h-[48px] text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset active:bg-primary/10 ${
                  isSelected ? 'bg-primary/10' : 'hover:bg-surface-elevated'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden="true">
                    {item.flag}
                  </span>
                  <span className="font-semibold text-text">{item.code}</span>
                  <span className="text-sm text-neutral-text-secondary">{item.name}</span>
                </span>
                {isSelected && (
                  <svg
                    className="w-5 h-5 text-primary-on-surface"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
