import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';

interface PhotoViewerModalProps {
  src: string;
  alt: string;
  onClose: () => void;
  containerClassName?: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

export default function PhotoViewerModal({
  src,
  alt,
  onClose,
  containerClassName = 'fixed inset-0',
}: PhotoViewerModalProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${containerClassName} z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="照片檢視器"
    >
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setScale((current) => clampScale(current - SCALE_STEP));
          }}
          className="h-11 w-11 rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25"
          aria-label="縮小照片"
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
          aria-label="放大照片"
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
          aria-label="重設照片位置"
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
          aria-label="關閉照片"
        >
          <X className="mx-auto" size={18} />
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold tracking-wide text-white/85 backdrop-blur-md">
        拖曳移動，點按右上角按鈕縮放
      </div>

      <motion.img
        src={src}
        alt={alt}
        drag={true}
        dragMomentum={false}
        dragElastic={0.08}
        onClick={(event) => event.stopPropagation()}
        onWheel={(event) => {
          event.stopPropagation();
          const direction = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
          setScale((current) => clampScale(current + direction));
        }}
        style={{ scale }}
        className="max-h-[82vh] max-w-[92vw] cursor-grab rounded-3xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)] active:cursor-grabbing"
      />
    </motion.div>
  );
}
