import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

// 下拉選單尺寸 SSOT：寬度上限 16rem、視窗左右各保留 1rem 安全邊界。
const MENU_MAX_WIDTH_PX = 256;
const EDGE_GUTTER_PX = 16;

export function TripSelector() {
  const { t } = useTranslation();
  const { trips, currentTripId, setCurrentTrip, addTrip } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [menuLayout, setMenuLayout] = useState({ left: 0, width: MENU_MAX_WIDTH_PX });

  // 開啟當下以錨點位置計算選單版位（宣告式 state 驅動）：窄屏（Fold 344）不出界。
  const openMenu = (anchor: HTMLElement) => {
    const anchorLeft = anchor.getBoundingClientRect().left;
    const vw = window.innerWidth;
    const width = Math.min(MENU_MAX_WIDTH_PX, vw - EDGE_GUTTER_PX * 2);
    const desiredLeft = Math.min(
      Math.max(anchorLeft, EDGE_GUTTER_PX),
      Math.max(vw - EDGE_GUTTER_PX - width, EDGE_GUTTER_PX),
    );
    setMenuLayout({ left: desiredLeft - anchorLeft, width });
    setIsOpen(true);
  };

  const currentTrip = trips.find((trip) => trip.id === currentTripId);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (newTripName.trim()) {
      addTrip(newTripName.trim());
      setNewTripName('');
      setIsAdding(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <button
        onClick={(e) => (isOpen ? setIsOpen(false) : openMenu(e.currentTarget))}
        data-testid="trip-selector-button"
        title={currentTrip?.name}
        aria-expanded={isOpen}
        className="w-full min-h-11 flex items-center gap-1 px-3 py-2 bg-surface-container-low hover:bg-surface-container rounded-full transition-colors shadow-ambient"
      >
        <span className="font-medium text-sm truncate min-w-0 flex-1 text-left">
          {currentTrip?.name ?? t('trip.placeholder')}
        </span>
        <span
          className="material-symbols-outlined text-sm text-on-surface-variant shrink-0"
          aria-hidden="true"
        >
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setIsAdding(false);
            }}
          />
          <div
            data-testid="trip-selector-menu"
            style={{ left: menuLayout.left, width: menuLayout.width }}
            className="absolute top-full mt-2 bg-surface-container-lowest rounded-[2rem] shadow-ambient border border-outline-variant/20 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => {
                    setCurrentTrip(trip.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl text-sm transition-colors flex items-center justify-between',
                    currentTripId === trip.id
                      ? 'bg-primary-container text-on-primary-container font-medium'
                      : 'hover:bg-surface-container-low text-on-surface',
                  )}
                >
                  <span className="truncate">{trip.name}</span>
                  {currentTripId === trip.id && (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-outline-variant/20 bg-surface-container-low/50">
              {isAdding ? (
                <form onSubmit={handleAdd} className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newTripName}
                    onChange={(e) => setNewTripName(e.target.value)}
                    placeholder={t('trip.name_placeholder')}
                    className="flex-1 bg-surface-container-high border-none rounded-xl px-4 py-2 text-sm focus:outline-none focus:bg-primary-container transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newTripName.trim()}
                    className="bg-primary text-on-primary p-2 rounded-xl disabled:opacity-50 flex items-center justify-center shadow-ambient"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-primary-container rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  {t('trip.add')}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
