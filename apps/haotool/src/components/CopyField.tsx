import { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyFieldProps {
  value: string;
  onToast: (message: string, success: boolean) => void;
}

/** 全選文字框內容（剪貼簿不可用時的 fallback）。 */
function selectContents(node: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Email 複製欄（deep-dive §4.5）：sunken 文字框（user-select: all）+ 44×44 複製鈕。
 * 成功後 2s 內 icon 換綠勾（150ms scale-fade）+ Toast「已複製 Email」；
 * 剪貼簿不可用時自動全選文字並提示「請按 ⌘C 複製」。
 */
export default function CopyField({ value, onToast }: CopyFieldProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onToast('已複製 Email', true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      if (textRef.current) selectContents(textRef.current);
      onToast('請按 ⌘C 複製', false);
    }
  };

  return (
    <div className="flex gap-2">
      <span
        ref={textRef}
        className="flex min-w-0 flex-1 items-center break-all rounded-input bg-surface-sunken px-4 py-3 text-[15px] font-medium leading-snug tabular-nums text-text [user-select:all]"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label="複製 Email"
        className="press press-scale focus-ring group inline-flex size-11 shrink-0 items-center justify-center rounded-input border border-border bg-surface hover:border-primary"
      >
        {copied ? (
          <Check className="icon-pop size-5 text-success" aria-hidden="true" />
        ) : (
          <Copy
            className="size-5 text-text-muted group-hover:text-primary-strong"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}
