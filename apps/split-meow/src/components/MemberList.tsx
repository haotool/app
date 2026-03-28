import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { MemberAvatar } from './MemberAvatar';

export function MemberList() {
  const { t } = useTranslation();
  const { members, payerId, setPayerId, toggleMemberActive, addMember } = useStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const startLongPress = (memberId: string) => {
    longPressTriggered.current = false;
    timerRef.current = setTimeout(() => {
      longPressTriggered.current = true;
      if ('vibrate' in navigator) navigator.vibrate(30);
      setPayerId(memberId);
      timerRef.current = null;
    }, 500);
  };

  const cancelLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (memberId: string) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    toggleMemberActive(memberId);
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
      {members.map((member) => {
        const isPayer = member.id === payerId;
        return (
          <button
            key={member.id}
            onClick={() => handleClick(member.id)}
            onTouchStart={() => startLongPress(member.id)}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            onMouseDown={() => startLongPress(member.id)}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onContextMenu={(e) => {
              e.preventDefault();
              if ('vibrate' in navigator) navigator.vibrate(30);
              setPayerId(member.id);
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all active:scale-95 shadow-ambient',
              member.isActive
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-container-low text-on-surface-variant opacity-60 hover:opacity-100',
            )}
          >
            <div className="relative shrink-0">
              <MemberAvatar
                seed={member.avatarUrl}
                alt={member.name}
                size={24}
                className={cn(!member.isActive && 'grayscale')}
              />
              {isPayer && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-surface-container-lowest" />
              )}
            </div>
            <span className="text-sm font-medium">{member.name}</span>
          </button>
        );
      })}
      <button
        onClick={addMember}
        aria-label={t('home.add_member')}
        className="w-11 h-11 flex items-center justify-center bg-primary-container text-on-primary-container rounded-full active:scale-90 transition-transform shadow-ambient"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}
