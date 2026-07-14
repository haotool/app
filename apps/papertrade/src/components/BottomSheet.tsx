import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    panelRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 mx-auto flex max-w-lg items-end justify-center">
      <button
        type="button"
        aria-label="關閉視窗"
        onClick={onClose}
        className="backdrop-in absolute inset-0 cursor-default bg-bg/60 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="sheet-in relative z-10 max-h-[86dvh] w-full overflow-y-auto rounded-t-[20px] border-t border-border bg-surface pb-[max(1rem,var(--sab))] outline-none"
      >
        <div className="flex justify-center pt-2.5" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-border" />
        </div>
        <header className="flex min-h-11 items-center justify-between px-4 pt-1.5">
          <h2 className="text-body font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="關閉"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-control text-text-3 active:bg-surface-2"
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="px-4 pt-2">{children}</div>
      </div>
    </div>
  );
}
