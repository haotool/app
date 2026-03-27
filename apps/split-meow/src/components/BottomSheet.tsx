import { useState, useRef, useCallback, type ReactNode } from 'react';
import { cn } from '../lib/utils';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 收合時露出的高度（peek），預設 92px */
  peekHeight?: number;
  /** 展開時的最大高度，預設 400px */
  expandedHeight?: number;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose: _onClose,
  children,
  peekHeight = 92,
  expandedHeight = 400,
  className,
}: BottomSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const keyboardHeight = useKeyboardHeight();
  const keyboardOpen = keyboardHeight > 0;

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    isDragging.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    if (Math.abs(e.clientY - dragStartY.current) > 5) {
      isDragging.current = true;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    if (isDragging.current) {
      // drag up → expand; drag down → collapse
      if (delta < -30) setExpanded(true);
      else if (delta > 30) setExpanded(false);
    }
    dragStartY.current = null;
    isDragging.current = false;
  }, []);

  if (!isOpen) return null;

  const height = expanded ? expandedHeight : peekHeight;

  return (
    <div
      data-testid="bottom-sheet"
      data-expanded={String(expanded)}
      className={cn('fixed inset-x-0 z-40 flex justify-center px-4', className)}
      style={{
        /**
         * BottomNav ラッパーの bottom = 1rem + env(safe-area-inset-bottom)
         * BottomNav 高さ = --nav-h（ResizeObserver で動的設定、デフォルト 62px）
         * BottomSheet はこの合計分だけ底から離す → BottomNav と完全に接する
         */
        bottom: 'calc(1rem + var(--nav-h, 62px) + env(safe-area-inset-bottom, 0px))',
        transform: `translateY(${keyboardOpen ? -keyboardHeight : 0}px)`,
        transition: keyboardOpen
          ? 'transform 120ms cubic-bezier(0.0, 0.0, 0.2, 1)'
          : 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className="w-full max-w-lg"
        style={{
          height: `${height}px`,
          transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="h-full rounded-t-[2rem] bg-surface-bright/95 backdrop-blur-xl border border-outline-variant/15 shadow-ambient flex flex-col">
          {/* Drag handle */}
          <button
            type="button"
            aria-label="drag handle"
            className="flex justify-center items-center py-2 cursor-pointer touch-none select-none"
            onClick={toggleExpanded}
          >
            <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
          </button>

          {/* Content area — scrollable when expanded */}
          <div
            className={cn(
              'flex-1 flex flex-col min-h-0',
              expanded ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
