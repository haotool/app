/**
 * RecordCard Component - 停車記錄卡片（支援快速編輯車牌）
 *
 * 功能特色：
 * - useOptimistic 即時 UI 更新
 * - useDebounce 自動儲存防抖（300ms）
 * - 雙擊編輯車牌號碼
 * - 視覺反饋與載入狀態
 */
import { useState, useOptimistic, startTransition, Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { Car, Trash2, MapPin, Clock, Navigation, Loader2, Edit2 } from 'lucide-react';
import type { ThemeConfig, ParkingRecord } from '@app/park-keeper/types';
import { useDebounce } from '@app/park-keeper/hooks/useDebounce';

const MiniMap = lazy(() => import('./MiniMap'));

interface RecordCardProps {
  record: ParkingRecord;
  theme: ThemeConfig;
  onDelete: (id: string) => void | Promise<void>;
  onUpdate: (id: string, updates: Partial<ParkingRecord>) => void | Promise<void>;
  onNavigate: (record: ParkingRecord) => void;
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
  miniMapText,
}: RecordCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(record.plateNumber);
  const [isSaving, setIsSaving] = useState(false);

  // useOptimistic for instant UI feedback
  const [optimisticPlate, setOptimisticPlate] = useOptimistic(
    record.plateNumber,
    (_state, newPlate: string) => newPlate,
  );

  // Debounced value for auto-save (300ms delay)
  const debouncedValue = useDebounce(editValue, 300);

  // Auto-save when debounced value changes
  useState(() => {
    if (isEditing && debouncedValue !== record.plateNumber && debouncedValue.trim()) {
      void handleSave(debouncedValue);
    }
  });

  const handleSave = (newPlate: string) => {
    if (newPlate === record.plateNumber || !newPlate.trim()) return;

    setIsSaving(true);

    startTransition(async () => {
      // Optimistically update UI
      setOptimisticPlate(newPlate.toUpperCase());

      try {
        // Actual save operation
        await onUpdate(record.id, { plateNumber: newPlate.toUpperCase() });
      } catch (error) {
        console.error('Failed to update plate number:', error);
        // Revert on error (useOptimistic handles this automatically)
      } finally {
        setIsSaving(false);
        setIsEditing(false);
      }
    });
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(record.plateNumber);
  };

  const handleBlur = () => {
    if (editValue.trim() && editValue !== record.plateNumber) {
      void handleSave(editValue);
    } else {
      setIsEditing(false);
      setEditValue(record.plateNumber);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(record.plateNumber);
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
                <h3
                  className="font-black text-base leading-none mb-1 cursor-pointer hover:opacity-70 transition-opacity"
                  onDoubleClick={handleDoubleClick}
                  title="雙擊編輯"
                >
                  {optimisticPlate}
                </h3>
                <button
                  type="button"
                  onClick={handleDoubleClick}
                  className="opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity"
                  title="編輯車牌"
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
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Photo + Map row */}
      <div className="flex gap-2.5 h-36 mb-4">
        <div className="flex-[1.2] rounded-2xl overflow-hidden bg-black/5 shadow-inner">
          {record.photoData ? (
            <img
              src={record.photoData}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
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
                text={miniMapText}
                mapKey={record.id}
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
    </div>
  );
}
