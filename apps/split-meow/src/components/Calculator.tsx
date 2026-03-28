import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { evaluateExpression } from '../lib/evaluateExpression';

interface CalculatorProps {
  onPawParticle?: (x: number, y: number) => void;
}

export function Calculator({ onPawParticle }: CalculatorProps = {}) {
  const { t } = useTranslation();
  const {
    splitMode,
    calculatorValue,
    itemizedValues,
    focusedMemberId,
    setCalculatorValue,
    setItemizedValue,
    saveExpense,
  } = useStore();

  const currentValue =
    splitMode === 'split_evenly'
      ? calculatorValue
      : focusedMemberId
        ? (itemizedValues[focusedMemberId] ?? '')
        : '';

  const canSave =
    splitMode === 'split_evenly'
      ? evaluateExpression(currentValue) > 0
      : Object.values(itemizedValues).some((v) => evaluateExpression(v) > 0);

  const handlePress = (key: string) => {
    if (splitMode === 'itemized' && !focusedMemberId) return;
    if ('vibrate' in navigator) navigator.vibrate(8);

    let newVal = currentValue;

    if (key === 'AC') {
      newVal = '';
    } else if (key === '⌫') {
      newVal = newVal.slice(0, -1);
    } else if (key === '=') {
      const res = evaluateExpression(newVal);
      if (res !== 0 && Number.isFinite(res)) newVal = String(Number(res.toFixed(2)));
    } else {
      const INFIX_OPS = ['+', '-', '×', '÷'];
      if (INFIX_OPS.includes(key)) {
        const lastChar = newVal.slice(-1);
        if (INFIX_OPS.includes(lastChar)) {
          // 尾端已有運算子時直接替換，避免連按兩個運算子
          newVal = newVal.slice(0, -1) + key;
        } else {
          // 先將完整算式 collapse 成結果，避免 "300+200×" 顯示 0
          const res = evaluateExpression(newVal);
          if (res > 0 && Number.isFinite(res)) {
            newVal = String(Number(res.toFixed(2)));
          }
          newVal += key;
        }
      } else {
        newVal += key;
      }
    }

    if (splitMode === 'split_evenly') {
      setCalculatorValue(newVal);
    } else if (focusedMemberId) {
      setItemizedValue(focusedMemberId, newVal);
    }
  };

  const buttons = [
    {
      label: '⌫',
      class:
        'bg-surface-container-high text-on-surface hover:bg-surface-container-highest text-xl sm:text-2xl font-medium',
      icon: 'backspace',
    },
    {
      label: 'AC',
      class:
        'bg-error-container text-on-error-container hover:bg-error-container/80 text-lg sm:text-xl font-medium',
    },
    {
      label: '%',
      class:
        'bg-surface-container-high text-on-surface hover:bg-surface-container-highest text-xl sm:text-2xl font-medium',
    },
    {
      label: '÷',
      class:
        'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 text-2xl sm:text-3xl font-light',
    },
    {
      label: '7',
      class:
        'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xl sm:text-2xl font-medium',
    },
    {
      label: '8',
      class:
        'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xl sm:text-2xl font-medium',
    },
    {
      label: '9',
      class:
        'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xl sm:text-2xl font-medium',
    },
    {
      label: '×',
      class:
        'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 text-2xl sm:text-3xl font-light',
    },
    {
      label: '4',
      class:
        'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xl sm:text-2xl font-medium',
    },
    {
      label: '5',
      class:
        'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xl sm:text-2xl font-medium',
    },
    {
      label: '6',
      class:
        'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xl sm:text-2xl font-medium',
    },
    {
      label: '-',
      class:
        'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 text-2xl sm:text-3xl font-light',
    },
    {
      label: '1',
      class:
        'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xl sm:text-2xl font-medium',
    },
    {
      label: '2',
      class:
        'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xl sm:text-2xl font-medium',
    },
    {
      label: '3',
      class:
        'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xl sm:text-2xl font-medium',
    },
    {
      label: '+',
      class:
        'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 text-2xl sm:text-3xl font-light',
    },
    {
      label: '0',
      class:
        'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xl sm:text-2xl font-medium',
    },
    {
      label: '00',
      class:
        'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xl sm:text-2xl font-medium',
    },
    {
      label: '.',
      class:
        'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xl sm:text-2xl font-medium',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={(e) => {
            handlePress(btn.label);
            if (onPawParticle) {
              const rect = e.currentTarget.getBoundingClientRect();
              onPawParticle(rect.left + rect.width / 2 - 9, rect.top + rect.height / 2 - 9);
            }
          }}
          className={cn(
            'h-12 sm:h-13 flex items-center justify-center rounded-full active:scale-95 transition-all select-none shadow-ambient',
            btn.class,
          )}
        >
          {btn.icon ? <span className="material-symbols-outlined">{btn.icon}</span> : btn.label}
        </button>
      ))}
      <button
        onClick={canSave ? saveExpense : undefined}
        disabled={!canSave}
        className={cn(
          'relative overflow-hidden rounded-full transition-all flex items-center justify-center gap-2 shadow-ambient text-lg sm:text-xl font-medium',
          canSave
            ? 'bg-[image:var(--background-image-gradient-primary)] text-white hover:opacity-90 active:scale-[0.98]'
            : 'bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed',
        )}
      >
        {t('home.complete')}
        {canSave && (
          <div className="absolute -right-2 -bottom-2 opacity-20">
            <span
              className="material-symbols-outlined text-5xl"
              style={{ transform: 'rotate(15deg)' }}
            >
              pets
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
