/**
 * RecordCard Component - 停車記錄卡片（支援快速編輯車牌）
 *
 * 功能特色：
 * - 點擊即進入快速編輯
 * - useDebounce 自動儲存防抖
 * - 即時 optimistic 顯示
 * - 視覺反饋與載入狀態
 */
import { useCallback, useEffect, useRef, useState, Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { Car, Trash2, MapPin, Clock, Navigation, Loader2, Edit2 } from 'lucide-react';
import type { ThemeConfig, ParkingRecord } from '@app/park-keeper/types';
import { useDebounce } from '@app/park-keeper/hooks/useDebounce';
import PhotoViewerModal from './PhotoViewerModal';

const MiniMap = lazy(() => import('./MiniMap'));

interface RecordCardProps {
  record: ParkingRecord;
  theme: ThemeConfig;
  onDelete: (id: string) => void | Promise<void>;
  onUpdate: (id: string, updates: Partial<ParkingRecord>) => void | Promise<void>;
  onNavigate: (record: ParkingRecord) => void;
  cacheDurationDays?: number;
  miniMapText: {
    markerCarLabel: string;
    markerUserLabel: string;
    legendCurrentLabel: string;
    legendCarLabel: string;
    dragCarHintLabel: string;
    ariaInteractiveSelectionLabel: string;
    ariaInteractiveTrackingLabel: string;
    ariaStaticLabel: string;
  };
}

export default function RecordCard({
  record,
  theme,
  onDelete,
  onUpdate,
  onNavigate,
  cacheDurationDays = 7,
  miniMapText,
}: RecordCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(record.plateNumber);
  const [displayPlate, setDisplayPlate] = useState(record.plateNumber);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const lastCommittedPlateRef = useRef(record.plateNumber);

  const debouncedValue = useDebounce(editValue, 400);

  useEffect(() => {
    lastCommittedPlateRef.current = record.plateNumber;
    setDisplayPlate(record.plateNumber);

    if (!isEditing) {
      setEditValue(record.plateNumber);
    }
  }, [record.plateNumber, isEditing]);

  const normalizePlate = useCallback((value: string) => value.trim().toUpperCase(), []);

  const handleSave = useCallback(
    async (rawPlate: string, closeEditor = false) => {
      const nextPlate = normalizePlate(rawPlate);
      const currentPlate = lastCommittedPlateRef.current;

      if (!nextPlate) {
        setDisplayPlate(currentPlate);
        setEditValue(currentPlate);
        setIsEditing(false);
        return;
      }

      if (nextPlate === currentPlate) {
        setDisplayPlate(currentPlate);
        setEditValue(currentPlate);
        if (closeEditor) {
          setIsEditing(false);
        }
        return;
      }

      setIsSaving(true);
      setDisplayPlate(nextPlate);

      try {
        await onUpdate(record.id, { plateNumber: nextPlate });
        lastCommittedPlateRef.current = nextPlate;
        setEditValue(nextPlate);
      } catch (error) {
        console.error('Failed to update plate number:', error);
        setDisplayPlate(currentPlate);
        setEditValue(currentPlate);
      } finally {
        setIsSaving(false);
        if (closeEditor) {
          setIsEditing(false);
        }
      }
    },
    [normalizePlate, onUpdate, record.id],
  );

  useEffect(() => {
    if (!isEditing) return;

    const nextPlate = normalizePlate(debouncedValue);
    if (!nextPlate || nextPlate === lastCommittedPlateRef.current) return;

    void handleSave(debouncedValue);
  }, [debouncedValue, handleSave, isEditing, normalizePlate]);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditValue(lastCommittedPlateRef.current);
  };

  const handleBlur = () => {
    void handleSave(editValue, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(lastCommittedPlateRef.current);
      setDisplayPlate(lastCommittedPlateRef.current);
    }
  };

  return (
    <div
      className="rounded-4xl p-5 shadow-elevation-2 border border-black/1 overflow-hidden"
      style={{ backgroundColor: theme.colors.surface }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="p-2.5 rounded-2xl"
            style={{
              backgroundColor: `${theme.colors.primary}15`,
              color: theme.colors.primary,
            }}
          >
            <Car size={18} />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="relative">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="font-black text-base leading-none mb-1 w-full px-2 py-1 rounded border-2 outline-none transition-colors"
                  style={{
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.background,
                  }}
                  placeholder="車牌號碼"
                />
                {isSaving && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2
                      size={14}
                      className="animate-spin"
                      style={{ color: theme.colors.primary }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <button
                  type="button"
                  className="font-black text-base leading-none mb-1 cursor-text text-left hover:opacity-70 transition-opacity"
                  onClick={handleEditStart}
                  aria-label={`編輯車牌 ${displayPlate}`}
                >
                  {displayPlate}
                </button>
                <button
                  type="button"
                  onClick={handleEditStart}
                  className="opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity"
                  title="編輯車牌"
                  aria-label="編輯車牌"
                >
                  <Edit2 size={14} style={{ color: theme.colors.primary }} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 text-[10px] font-black opacity-30 uppercase tracking-tight">
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${theme.colors.primary}08`,
                  color: theme.colors.primary,
                }}
              >
                <MapPin size={10} />
                {record.floor}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {new Date(record.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void onDelete(record.id)}
          className="p-2 opacity-10 hover:opacity-100 hover:text-red-500 transition-all"
          aria-label={`刪除停車記錄 ${displayPlate}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Photo + Map row */}
      <div className="flex gap-2.5 h-36 mb-4">
        <div className="flex-[1.2] rounded-2xl overflow-hidden bg-black/5 shadow-inner">
          {record.photoData ? (
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              className="w-full h-full cursor-pointer"
              aria-label="查看停車照片"
            >
              <img
                src={record.photoData}
                alt="停車照片"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <Car size={20} />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onNavigate(record)}
          className="flex-1 rounded-2xl overflow-hidden bg-black/5 shadow-inner border border-black/2 cursor-pointer active:scale-95 transition-transform group relative"
        >
          {record.latitude != null && record.longitude != null ? (
            <Suspense fallback={<div className="w-full h-full animate-pulse bg-gray-200" />}>
              <MiniMap
                lat={record.latitude}
                lng={record.longitude}
                theme={theme}
                interactive={false}
                cacheDurationDays={cacheDurationDays}
                text={miniMapText}
                mapKey={record.id}
                parkedHeading={record.parkedHeading}
              />
            </Suspense>
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20 text-[8px] font-black uppercase tracking-widest">
              No Map
            </div>
          )}
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            style={{ backgroundColor: `${theme.colors.primary}66` }}
          >
            <Navigation size={28} className="text-white drop-shadow-2xl animate-bounce mb-1" />
            <span className="text-[8px] font-black text-white uppercase tracking-widest">
              NAVIGATE
            </span>
          </div>
        </button>
      </div>

      {record.notes && (
        <p className="text-[11px] opacity-60 bg-black/2 p-3 rounded-2xl font-medium leading-relaxed italic">
          &ldquo;{record.notes}&rdquo;
        </p>
      )}

      {/* Save indicator */}
      {isSaving && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-3 text-[10px] font-bold"
          style={{ color: theme.colors.primary }}
        >
          <Loader2 size={12} className="animate-spin" />
          <span>正在儲存...</span>
        </motion.div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && record.photoData && (
        <PhotoViewerModal
          src={record.photoData}
          alt="Parking spot"
          onClose={() => setShowPhotoModal(false)}
        />
      )}
    </div>
  );
}
