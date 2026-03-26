import { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { MemberAvatar } from './MemberAvatar';

export function PayerSelector() {
  const { members, payerId, setPayerId } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const payer = members.find((m) => m.id === payerId) || members[0];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`付款人：${payer?.name}`}
        className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-low hover:bg-surface-container rounded-full transition-colors text-sm shadow-ambient"
      >
        <MemberAvatar seed={payer?.avatarUrl ?? ''} alt={payer?.name} size={24} />
        <span className="font-medium text-on-surface max-w-[56px] truncate">{payer?.name}</span>
        <span className="material-symbols-outlined text-sm text-on-surface-variant">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 bg-surface-container-lowest rounded-[2rem] shadow-ambient border border-outline-variant/20 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    setPayerId(member.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-2xl text-sm transition-colors flex items-center gap-3',
                    payerId === member.id
                      ? 'bg-primary-container text-on-primary-container font-medium'
                      : 'hover:bg-surface-container-low text-on-surface',
                  )}
                >
                  <MemberAvatar seed={member.avatarUrl} alt={member.name} size={24} />
                  <span className="truncate flex-1">{member.name}</span>
                  {payerId === member.id && (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
