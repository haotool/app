/**
 * MiniMapPhotoOverlay — 地圖照片 overlay（可拖曳、跟隨車輛像素座標）。
 * 自 MiniMap.tsx 純搬移拆出（issue #733 可維護性；行為零變更）。
 */
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue } from 'motion/react';

const PHOTO_OVERLAY_SIZE = 64; // w-16 h-16 = 64px
// 車輛圖示幾何：iconAnchor=[20,30]，車身寬半徑 12px。
// 初始位置：車身右側 8px gap，垂直置中於車輛錨點。
// 此位置不遮擋上方標籤 badge（在錨點 -48px 至 -30px）。
const INIT_OFFSET = { dx: 12 + 8, dy: -(PHOTO_OVERLAY_SIZE / 2) };

/**
 * 照片 overlay — 初始定位在車輛右側，跟隨車輛在地圖平移／縮放時同步移動。
 * 使用者拖曳後更新相對偏移並透過 onOffsetCommit 通知父層持久化；
 * 開啟時 initialOffset（record.photoOffset）優先於預設位置。
 */
export default function DraggablePhotoOverlay({
  src,
  onPhotoClick,
  containerRef,
  carPixelPos,
  initialOffset,
  onOffsetCommit,
}: {
  src: string;
  onPhotoClick?: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  carPixelPos: { x: number; y: number } | null;
  initialOffset?: { x: number; y: number };
  onOffsetCommit?: (offset: { x: number; y: number }) => void;
}) {
  // 初始偏移只在掛載時取一次（record.photoOffset 或預設車輛右側）。
  const [initial] = useState(() => {
    const offset = initialOffset ? { dx: initialOffset.x, dy: initialOffset.y } : INIT_OFFSET;
    return {
      offset,
      x: carPixelPos ? carPixelPos.x + offset.dx : offset.dx,
      y: carPixelPos ? carPixelPos.y + offset.dy : offset.dy,
    };
  });
  // 記錄使用者選定的相對偏移（相對車輛錨點像素位置）。
  const offsetRef = useRef(initial.offset);
  // 穩定參照，讓 onDragEnd 讀取最新 carPixelPos 而不產生 stale closure。
  const carPosRef = useRef(carPixelPos);
  useEffect(() => {
    carPosRef.current = carPixelPos;
  }, [carPixelPos]);

  const dragOccurred = useRef(false);

  const x = useMotionValue(initial.x);
  const y = useMotionValue(initial.y);

  // 地圖平移／縮放時，依儲存的相對偏移同步更新絕對像素位置。
  useEffect(() => {
    if (!carPixelPos) return;
    x.set(carPixelPos.x + offsetRef.current.dx);
    y.set(carPixelPos.y + offsetRef.current.dy);
  }, [carPixelPos, x, y]);

  return (
    <motion.div
      data-testid="photo-overlay"
      drag
      dragConstraints={containerRef}
      dragMomentum={false}
      dragElastic={0}
      onPointerDown={() => {
        dragOccurred.current = false;
      }}
      onDragStart={() => {
        dragOccurred.current = true;
      }}
      onDragEnd={() => {
        // 拖曳結束後，計算新的相對偏移，供下次地圖移動時使用並通知父層寫入 DB。
        const pos = carPosRef.current;
        if (pos) {
          offsetRef.current = { dx: x.get() - pos.x, dy: y.get() - pos.y };
          onOffsetCommit?.({ x: offsetRef.current.dx, y: offsetRef.current.dy });
        }
      }}
      onClick={() => {
        if (!dragOccurred.current) onPhotoClick?.();
      }}
      style={{ x, y, position: 'absolute', top: 0, left: 0, touchAction: 'none' }}
      className="z-[500] cursor-grab active:cursor-grabbing touch-none select-none"
    >
      <img
        src={src}
        alt="Parking spot photo"
        draggable={false}
        className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-lg"
      />
    </motion.div>
  );
}
