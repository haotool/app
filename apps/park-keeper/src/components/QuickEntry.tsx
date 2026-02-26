import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Camera, Trash2, Check, Grid, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeConfig, ParkingRecord } from '@app/park-keeper/types';
import { compressImage } from '@app/park-keeper/services/imageUtils';

const MiniMap = lazy(() => import('./MiniMap'));

const FLOORS = ['B3', 'B2', 'B1', '1F', '2F', '3F', '4F', 'Custom'];

interface QuickEntryProps {
  theme: ThemeConfig;
  onSave: (record: Partial<ParkingRecord>) => void | Promise<void>;
  isVisible: boolean;
  onClose: () => void;
}

const panelVariants: Variants = {
  hidden: { y: '110%', opacity: 0 },
  visible: {
    y: '0%',
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 28,
      stiffness: 300,
      mass: 0.8,
      when: 'beforeChildren',
      staggerChildren: 0.08,
    },
  },
  exit: { y: '110%', opacity: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
};

export default function QuickEntry({ theme, onSave, isVisible, onClose }: QuickEntryProps) {
  const { t } = useTranslation();
  const [plate, setPlate] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [customFloorMode, setCustomFloorMode] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const watchId = useRef<number | null>(null);

  const vibrate = (pattern: number | number[] = 15) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const startPrecisionTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationAccuracy(pos.coords.accuracy);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setLocation((loc) => loc ?? { lat: 25.033, lng: 121.5654 });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    if (isVisible) {
      startPrecisionTracking();
    } else {
      stopTracking();
      setPlate('');
      setSelectedFloor('');
      setNotes('');
      setPhoto(null);
      setPhotoError(false);
      setSaveStatus('idle');
      setCustomFloorMode(false);
    }
    return () => stopTracking();
  }, [isVisible, startPrecisionTracking, stopTracking]);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      setPhotoError(false);
      try {
        const compressed = await compressImage(file, 1024, 0.7);
        setPhoto(compressed);
        vibrate(50);
      } catch {
        setPhotoError(true);
        vibrate([50, 50, 50]);
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    }
  };

  const triggerAutoSave = async (floorValue: string) => {
    if (saveStatus !== 'idle') return;
    setSelectedFloor(floorValue);
    setSaveStatus('saving');
    vibrate([20, 40]);

    // Fallback to Taipei 101 if GPS unavailable
    const DEFAULT_LAT = 25.033;
    const DEFAULT_LNG = 121.5654;

    const recordData: Partial<ParkingRecord> = {
      plateNumber: plate || 'N/A',
      floor: floorValue,
      notes: notes.trim(),
      photoData: photo ?? undefined,
      hasPhoto: !!photo,
      latitude: location?.lat ?? DEFAULT_LAT,
      longitude: location?.lng ?? DEFAULT_LNG,
    };

    await new Promise((r) => setTimeout(r, 600));
    await onSave(recordData);
    setSaveStatus('success');
    setTimeout(() => onClose(), 400);
  };

  const gpsIndicatorClass = isLocating
    ? 'bg-amber-500 animate-pulse'
    : locationAccuracy && locationAccuracy > 50
      ? 'bg-red-500'
      : locationAccuracy && locationAccuracy > 20
        ? 'bg-orange-400'
        : 'bg-green-500';

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              vibrate(10);
              onClose();
            }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
          />
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto overflow-hidden border-t border-white/10"
            style={{ backgroundColor: theme.colors.background }}
          >
            <div
              className="w-full flex justify-center pt-5 pb-2"
              onClick={() => {
                vibrate(10);
                onClose();
              }}
            >
              <div className="w-12 h-1.5 rounded-full bg-black/10" />
            </div>
            <div className="px-6 pb-safe-bottom">
              <div className="max-w-md mx-auto space-y-6 pb-8 pt-2">
                <motion.div variants={itemVariants} className="flex gap-4 h-36">
                  <div className="flex-1 relative rounded-3xl overflow-hidden bg-[var(--color-surface)] border-2 border-dashed border-[color:var(--color-primary)]/10 flex items-center justify-center shadow-inner group">
                    <AnimatePresence mode="wait">
                      {photo ? (
                        <motion.div
                          key="photo"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full relative"
                        >
                          <img
                            src={photo}
                            className="w-full h-full object-cover"
                            alt="Parking spot"
                          />
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              vibrate(10);
                              setPhoto(null);
                            }}
                            className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white backdrop-blur-md"
                          >
                            <Trash2 size={12} />
                          </motion.button>
                        </motion.div>
                      ) : photoError ? (
                        <motion.div
                          key="error"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center justify-center text-center p-2 w-full"
                        >
                          <AlertCircle className="text-red-500 mb-2" size={24} />
                          <span className="text-[10px] font-bold text-red-500 mb-3">
                            {t('error.image')}
                          </span>
                          <button
                            onClick={() => {
                              vibrate(10);
                              setPhotoError(false);
                            }}
                            className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-wide active:scale-95 transition-transform"
                          >
                            {t('action.retry_generic')}
                          </button>
                        </motion.div>
                      ) : (
                        <motion.label
                          key="upload"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95"
                          onClick={() => vibrate(10)}
                        >
                          {isProcessing ? (
                            <Loader2
                              size={28}
                              className="animate-spin text-[var(--color-primary)]"
                            />
                          ) : (
                            <Camera
                              size={28}
                              className="text-[var(--color-primary)] mb-2 opacity-70"
                            />
                          )}
                          <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">
                            {isProcessing ? 'PROCESSING...' : t('record.photo_tap')}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => void handlePhoto(e)}
                            disabled={isProcessing}
                          />
                        </motion.label>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex-1 relative rounded-3xl overflow-hidden border-2 border-[color:var(--color-primary)]/5 shadow-inner bg-[var(--color-surface)]">
                    <Suspense fallback={<div className="w-full h-full bg-black/5 animate-pulse" />}>
                      {location && (
                        <MiniMap
                          lat={location.lat}
                          lng={location.lng}
                          theme={theme}
                          interactive={true}
                          onLocationSelect={(la, ln) => setLocation({ lat: la, lng: ln })}
                        />
                      )}
                    </Suspense>
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-xl shadow-sm">
                      <div className={`w-2 h-2 rounded-full ${gpsIndicatorClass}`} />
                      <span className="text-[8px] font-black uppercase text-gray-500 tracking-tighter">
                        {isLocating ? 'GPS...' : `${locationAccuracy?.toFixed(0) ?? '?'}m`}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-4">
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder={t('record.plate')}
                    className="w-full h-16 px-6 rounded-2xl bg-[var(--color-surface)] border-2 border-[color:var(--color-primary)]/5 outline-none font-black text-2xl tracking-tighter shadow-sm focus:border-[color:var(--color-primary)]/20 transition-all placeholder:opacity-30"
                  />
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('record.notes_placeholder')}
                    className="w-full h-12 px-6 rounded-2xl bg-[var(--color-surface)] border border-[color:var(--color-primary)]/5 outline-none text-[11px] font-bold placeholder:opacity-40"
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
                      {t('record.floor')}
                    </span>
                    <span className="text-[9px] font-bold text-[var(--color-primary)] bg-[color:var(--color-primary)]/10 px-3 py-1 rounded-full animate-pulse">
                      {t('record.save_hint')}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3.5">
                    {FLOORS.map((f) => (
                      <motion.button
                        key={f}
                        layout
                        disabled={saveStatus !== 'idle'}
                        onClick={() => {
                          if (f === 'Custom') {
                            vibrate(10);
                            setCustomFloorMode(true);
                          } else void triggerAutoSave(f);
                        }}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className={`h-14 rounded-2xl text-[13px] font-black border-2 flex items-center justify-center relative overflow-hidden
                          ${selectedFloor === f ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg' : 'bg-[var(--color-surface)] border-black/5 text-[var(--color-text)]'}
                          ${saveStatus !== 'idle' && selectedFloor !== f ? 'opacity-20' : ''}`}
                      >
                        {saveStatus === 'saving' && selectedFloor === f ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : saveStatus === 'success' && selectedFloor === f ? (
                          <Check size={24} strokeWidth={4} />
                        ) : f === 'Custom' ? (
                          <Grid size={20} />
                        ) : (
                          f
                        )}
                      </motion.button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {customFloorMode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        className="pt-2 overflow-hidden"
                      >
                        <div className="flex gap-3">
                          <input
                            autoFocus
                            type="text"
                            value={selectedFloor === 'Custom' ? '' : selectedFloor}
                            onChange={(e) => setSelectedFloor(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && void triggerAutoSave(selectedFloor)
                            }
                            placeholder="Zone..."
                            className="flex-1 h-14 px-6 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-primary)] outline-none text-base font-black shadow-inner"
                          />
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => void triggerAutoSave(selectedFloor)}
                            className="w-14 h-14 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-lg"
                          >
                            <Check size={24} />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
