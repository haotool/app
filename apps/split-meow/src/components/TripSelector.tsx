import { useState, type FormEvent } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export function TripSelector() {
  const { trips, currentTripId, setCurrentTrip, addTrip } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTripName, setNewTripName] = useState('');

  const currentTrip = trips.find((t) => t.id === currentTripId);

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
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1 px-3 py-2 bg-surface-container-low hover:bg-surface-container rounded-full transition-colors shadow-ambient"
      >
        <span className="font-medium text-sm truncate min-w-0 flex-1 text-left">
          {currentTrip?.name || '選擇行程'}
        </span>
        <span className="material-symbols-outlined text-sm text-on-surface-variant shrink-0">
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
          <div className="absolute top-full mt-2 left-0 w-64 bg-surface-container-lowest rounded-[2rem] shadow-ambient border border-outline-variant/20 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                    placeholder="行程名稱..."
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
                  新增行程
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
