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
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Car, Trash2, MapPin, Clock, Navigation, Loader2, Edit2 } from 'lucide-react';
import type { ThemeConfig, ParkingRecord } from '@app/park-keeper/types';
import { CACHE_DAYS } from '@app/park-keeper/constants';
import { useDebounce } from '@app/park-keeper/hooks/useDebounce';
import { formatPlateLabel, isPlateUnset } from '@app/park-keeper/services/formatPlate';
import { formatSmartTime } from '@app/park-keeper/services/formatSmartTime';
import PhotoViewerModal from './PhotoViewerModal';

const MiniMap = lazy(() => import('./MiniMap'));

interface RecordCardProps {
  record: ParkingRecord;
  theme: ThemeConfig;
  onDelete: (id: string) => void | Promise<void>;
  onUpdate: (id: string, updates: Partial<ParkingRecord>) => void | Promise<void>;
  onNavigate: (record: ParkingRecord) => void;
  /** 精簡列：隱藏照片＋地圖列。單筆記錄與 hero 卡並列時避免同筆資訊重複（issue #733）。 */
  compact?: boolean;
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
  compact = false,
  cacheDurationDays = CACHE_DAYS.DEFAULT,
  miniMapText,
}: RecordCardProps) {
  const { t, i18n } = useTranslation();
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

  // accessible name（aria-label）與可見文字統一走 formatPlate SSOT，避免裸露 N/A sentinel（round-3 P2）。
  const plateLabel = formatPlateLabel(displayPlate, t('record.plate_unset'));

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
                  placeholder={t('record.plate')}
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
            ) : compact ? (
              // compact 精簡列：與 hero 卡同筆時只留操作，車牌／樓層／時間已由 hero 呈現，
              // 不重複資訊欄位（issue #753 單筆去重）。
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wide opacity-40">
                  {t('record.manage_label')}
                </span>
                <button
                  type="button"
                  onClick={handleEditStart}
                  className="p-4 -m-4 opacity-45 hover:opacity-100 transition-opacity"
                  title={t('record.edit_plate_icon')}
                  aria-label={t('record.edit_plate_icon')}
                >
                  <Edit2 size={14} style={{ color: theme.colors.primary }} />
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <button
                  type="button"
                  className="font-black text-base leading-none mb-1 cursor-text text-left hover:opacity-70 transition-opacity"
                  onClick={handleEditStart}
                  aria-label={t('record.edit_plate', { plate: plateLabel })}
                >
                  {/* 未填車號 sentinel 經 formatPlate SSOT 轉換，避免裸露佔位值像資料錯誤。 */}
                  {isPlateUnset(displayPlate) ? (
                    <span className="opacity-45">{plateLabel}</span>
                  ) : (
                    displayPlate
                  )}
                </button>
                {/* 觸控無 hover：編輯入口常駐可見（issue #725 P2）。 */}
                <button
                  type="button"
                  onClick={handleEditStart}
                  className="p-4 -m-4 opacity-45 hover:opacity-100 transition-opacity"
                  title={t('record.edit_plate_icon')}
                  aria-label={t('record.edit_plate_icon')}
                >
                  <Edit2 size={14} style={{ color: theme.colors.primary }} />
                </button>
              </div>
            )}
            {!compact && (
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
                  {formatSmartTime(record.timestamp, i18n.language, t('home.just_now'))}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void onDelete(record.id)}
          className="p-4 -m-4 opacity-45 hover:opacity-100 hover:text-red-500 transition-all"
          aria-label={t('record.delete', { plate: plateLabel })}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Photo + Map row（compact 精簡列隱藏：hero 卡已承載照片與導航入口） */}
      {!compact && (
        <div data-testid="record-card-media" className="flex gap-2.5 h-36 mb-4">
          <div className="flex-[1.2] rounded-2xl overflow-hidden bg-black/5 shadow-inner">
            {record.photoData ? (
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="w-full h-full cursor-pointer"
                aria-label={t('record.view_photo')}
              >
                <img
                  src={record.photoData}
                  alt={t('record.photo_alt')}
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
            className="flex-1 rounded-2xl overflow-hidden bg-black/5 shadow-inner border border-black/2 cursor-pointer active:scale-95 transition-transform relative"
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
                {t('record.no_map')}
              </div>
            )}
            {/* 觸控無 hover：導航 affordance 改常駐角標 pill（issue #725 P2）。 */}
            <div
              className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1 px-2.5 py-1.5 rounded-full shadow-md pointer-events-none"
              style={{
                backgroundColor: `${theme.colors.primary}E6`,
                color: theme.colors.onPrimary,
              }}
            >
              <Navigation size={11} />
              <span className="text-[9px] font-black uppercase tracking-widest">
                {t('record.navigate')}
              </span>
            </div>
          </button>
        </div>
      )}

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
          <span>{t('record.saving')}</span>
        </motion.div>
      )}

      {/* Photo Modal — createPortal 確保在 Framer Motion transform 容器外渲染，fixed 定位才正確 */}
      {showPhotoModal &&
        record.photoData &&
        createPortal(
          <PhotoViewerModal
            src={record.photoData}
            alt={t('record.photo_alt')}
            onClose={() => setShowPhotoModal(false)}
          />,
          document.body,
        )}
    </div>
  );
}
