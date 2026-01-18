/**
 * CurrencyInput - Unified currency amount input component
 *
 * A compound input component that combines currency selection, amount input,
 * and calculator access in a single cohesive UI element.
 *
 * Features:
 * - Embedded currency selector (left side)
 * - Embedded calculator button (right side)
 * - Touch targets ≥44px (WCAG 2.2 compliant)
 * - Design token integration
 *
 * @module components/ui/CurrencyInput
 */

import { useRef, useState } from 'react';
import { Calculator } from 'lucide-react';

interface CurrencyOption {
  code: string;
  flag: string;
  name: string;
}

interface CurrencyInputProps {
  /** Current currency code */
  currency: string;
  /** Amount value (raw string) */
  value: string;
  /** Callback when amount changes */
  onChange: (value: string) => void;
  /** Callback when currency changes */
  onCurrencyChange: (currency: string) => void;
  /** Callback to open calculator */
  onOpenCalculator?: () => void;
  /** Available currency options */
  currencies: CurrencyOption[];
  /** Formatted display value (optional) */
  displayValue?: string;
  placeholder?: string;
  /** Visual variant */
  variant?: 'default' | 'highlighted';
  /** Field label */
  label?: string;
  /** Input aria-label */
  'aria-label'?: string;
  /** Currency selector aria-label */
  selectAriaLabel?: string;
  /** Calculator button aria-label */
  calculatorAriaLabel?: string;
  /** Input data-testid */
  'data-testid'?: string;
  /** Calculator button data-testid */
  calculatorTestId?: string;
}

export function CurrencyInput({
  currency,
  value,
  onChange,
  onCurrencyChange,
  onOpenCalculator,
  currencies,
  displayValue,
  placeholder = '0.00',
  variant = 'default',
  label,
  'aria-label': ariaLabel,
  selectAriaLabel,
  calculatorAriaLabel,
  'data-testid': dataTestId,
  calculatorTestId,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleFocus = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleBlur = () => {
    onChange(editValue);
    setIsEditing(false);
    setEditValue('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clean input: remove non-numeric characters except decimal point
    const cleaned = e.target.value.replace(/[^\d.]/g, '');
    // Handle multiple decimal points: keep only the first one
    const parts = cleaned.split('.');
    const validValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    setEditValue(validValue);
    onChange(validValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'Tab',
      '.',
    ];
    const isNumber = /^[0-9]$/.test(e.key);
    const isModifierKey = e.ctrlKey || e.metaKey;
    if (!isNumber && !allowedKeys.includes(e.key) && !isModifierKey) {
      e.preventDefault();
    }
  };

  const isHighlighted = variant === 'highlighted';

  return (
    <div className="currency-input">
      {label && (
        <label
          className="block mb-2"
          style={{
            fontSize: 'var(--font-size-sm, 14px)',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
          }}
        >
          {label}
        </label>
      )}

      <div
        className="relative flex items-center rounded-2xl transition-all duration-200"
        style={{
          height: 'var(--input-height-lg, 56px)',
          background: isHighlighted
            ? 'var(--color-accent-primary-subtle)'
            : 'var(--color-surface-default)',
          border: `2px solid ${isHighlighted ? 'var(--color-accent-primary)' : 'var(--color-border-default)'}`,
        }}
      >
        {/* Currency selector */}
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="appearance-none bg-transparent border-none outline-none cursor-pointer"
          style={{
            paddingLeft: 'var(--spacing-3, 12px)',
            paddingRight: 'var(--spacing-1, 4px)',
            fontSize: 'var(--font-size-base, 16px)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            minWidth: '90px',
            height: '100%',
          }}
          aria-label={selectAriaLabel ?? `Select currency (current: ${currency})`}
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '24px',
            background: 'var(--color-border-default)',
            flexShrink: 0,
          }}
        />

        {/* Amount input */}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={isEditing ? editValue : (displayValue ?? value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel ?? `Enter amount (${currency})`}
          data-testid={dataTestId}
          className="flex-1 bg-transparent border-none outline-none text-right"
          style={{
            padding: '0 var(--spacing-2, 8px)',
            fontSize: 'var(--font-size-2xl, 24px)',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-primary)',
            minWidth: 0,
          }}
        />

        {/* Calculator button */}
        {onOpenCalculator && (
          <button
            type="button"
            onClick={onOpenCalculator}
            className="flex items-center justify-center rounded-lg transition-all duration-200"
            style={{
              width: 'var(--touch-target-min, 44px)',
              height: 'var(--touch-target-min, 44px)',
              marginRight: 'var(--spacing-1, 4px)',
              color: 'var(--color-accent-primary)',
              background: 'transparent',
            }}
            aria-label={calculatorAriaLabel ?? 'Open calculator'}
            data-testid={calculatorTestId}
          >
            <Calculator size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * QuickAmountButtons - Preset amount selection buttons
 */
interface QuickAmountButtonsProps {
  /** Preset amounts to display */
  amounts: readonly number[];
  /** Callback when an amount is selected */
  onSelect: (amount: number) => void;
  /** Visual variant */
  variant?: 'default' | 'primary';
}

export function QuickAmountButtons({
  amounts,
  onSelect,
  variant = 'default',
}: QuickAmountButtonsProps) {
  const isPrimary = variant === 'primary';

  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {amounts.map((amount) => (
        <button
          key={amount}
          onClick={() => {
            onSelect(amount);
            if ('vibrate' in navigator) {
              navigator.vibrate(30);
            }
          }}
          className="rounded-lg transition-all duration-200 transform active:scale-95 hover:scale-105"
          style={{
            padding: 'var(--spacing-1, 4px) var(--spacing-3, 12px)',
            fontSize: 'var(--font-size-sm, 14px)',
            fontWeight: 500,
            minHeight: 'var(--touch-target-min, 44px)',
            background: isPrimary
              ? 'var(--color-accent-primary-subtle)'
              : 'var(--glass-surface-base)',
            color: isPrimary ? 'var(--color-accent-primary)' : 'var(--color-text-primary)',
            border: `1px solid ${isPrimary ? 'var(--color-accent-primary)' : 'var(--glass-border-light)'}`,
          }}
        >
          {amount.toLocaleString()}
        </button>
      ))}
    </div>
  );
}
