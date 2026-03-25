import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export function MemberList() {
  const { members, toggleMemberActive, addMember } = useStore();

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
      {members.map((member) => (
        <button
          key={member.id}
          onClick={() => toggleMemberActive(member.id)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all active:scale-95 shadow-ambient',
            member.isActive
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-surface-container-low text-on-surface-variant opacity-60 hover:opacity-100',
          )}
        >
          <img
            src={member.avatarUrl}
            alt={member.name}
            className={cn('w-6 h-6 rounded-full object-cover', !member.isActive && 'grayscale')}
          />
          <span className="text-sm font-medium">{member.name}</span>
        </button>
      ))}
      <button
        onClick={addMember}
        className="w-9 h-9 flex items-center justify-center bg-primary-container text-on-primary-container rounded-full active:scale-90 transition-transform shadow-ambient"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}
