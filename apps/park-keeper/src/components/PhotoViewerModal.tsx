import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PhotoViewerModalProps {
  src: string;
  alt: string;
  onClose: () => void;
  containerClassName?: string;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const SCALE_STEP = 0.25;

/** 單指下滑關閉：位移閾值（px）。 */
export const SWIPE_DISMISS_OFFSET_PX = 110;
/** 單指下滑關閉：速度閾值（px/s）。 */
export const SWIPE_DISMISS_VELOCITY = 800;

const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

/**
 * 單指下滑關閉判定：僅在未放大（scale<=1）時生效，
 * 放大狀態下的拖曳保留為平移瀏覽，不誤觸關閉。
 */
export function shouldDismissOnDragEnd(scale: number, offsetY: number, velocityY: number): boolean {
  if (scale > 1) return false;
  return offsetY > SWIPE_DISMISS_OFFSET_PX || velocityY > SWIPE_DISMISS_VELOCITY;
}

export default function PhotoViewerModal({
  src,
  alt,
  onClose,
  containerClassName = 'fixed inset-0',
}: PhotoViewerModalProps) {
  const { t } = useTranslation();
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  // scaleRef 讓 native event handler 取得最新 scale（避免 stale closure）
  const scaleRef = useRef(1);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);
  const lastTapRef = useRef(-Infinity);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 非被動 touchmove：pinch 縮放需要 preventDefault() 阻止頁面縮放
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return undefined;

    const handleTouchMove = (e: TouchEvent) => {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      if (e.touches.length === 2 && t0 && t1 && pinchRef.current) {
        e.preventDefault();
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const ratio = dist / pinchRef.current.startDist;
        setScale(clampScale(pinchRef.current.startScale * ratio));
      }
    };

    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLImageElement>) => {
    e.stopPropagation();
    const t0 = e.touches[0];
    const t1 = e.touches[1];
    if (e.touches.length === 2 && t0 && t1) {
      // pinch 開始：記錄初始距離與當前縮放比例
      pinchRef.current = {
        startDist: Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY),
        startScale: scaleRef.current,
      };
    } else if (e.touches.length === 1) {
      // 雙擊偵測：兩次 tap 間距 < 300ms
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        setScale((s) => (s > 1 ? 1 : 2.5));
      }
      lastTapRef.current = now;
    }
  };

  const handleTouchEnd = () => {
    pinchRef.current = null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${containerClassName} z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('photo.viewer_label')}
    >
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setScale((current) => clampScale(current - SCALE_STEP));
          }}
          className="h-11 w-11 rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25"
          aria-label={t('photo.zoom_out')}
        >
          <Minus className="mx-auto" size={18} />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setScale((current) => clampScale(current + SCALE_STEP));
          }}
          className="h-11 w-11 rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25"
          aria-label={t('photo.zoom_in')}
        >
          <Plus className="mx-auto" size={18} />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setScale(1);
          }}
          className="h-11 w-11 rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25"
          aria-label={t('photo.reset')}
        >
          <RotateCcw className="mx-auto" size={16} />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="h-11 w-11 rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25"
          aria-label={t('photo.close')}
        >
          <X className="mx-auto" size={18} />
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold tracking-wide text-white/85 backdrop-blur-md whitespace-nowrap">
        {t('photo.gesture_hint')}
      </div>

      <motion.img
        ref={imgRef}
        src={src}
        alt={alt}
        drag={true}
        dragMomentum={false}
        dragElastic={0.08}
        onDragEnd={(_event, info) => {
          // 未放大時單指下滑（或快速甩動）關閉檢視器。
          if (shouldDismissOnDragEnd(scaleRef.current, info.offset.y, info.velocity.y)) {
            onClose();
          }
        }}
        onClick={(event) => event.stopPropagation()}
        onWheel={(event) => {
          event.stopPropagation();
          const direction = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
          setScale((current) => clampScale(current + direction));
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ scale }}
        className="max-h-[82vh] max-w-[92vw] cursor-grab rounded-3xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)] active:cursor-grabbing"
      />
    </motion.div>
  );
}
