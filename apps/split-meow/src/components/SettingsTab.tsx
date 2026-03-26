import { useState } from 'react';
import { useStore } from '../store/useStore';
import { MemberAvatar } from './MemberAvatar';

export function SettingsTab() {
  const { members, updateMember, randomizeAvatar } = useStore();
  const me = members.find((m) => m.id === 'me') ?? members[0] ?? null;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(me?.name ?? '');

  const handleSave = () => {
    if (editName.trim() && me) {
      updateMember(me.id, editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12 pb-8">
      <section className="flex flex-col items-center text-center space-y-6">
        <div className="relative group">
          <button
            onClick={() => me && randomizeAvatar(me.id)}
            className="w-32 h-32 rounded-full overflow-hidden border-[6px] border-surface-container-lowest shadow-ambient relative block"
            title="更換頭像"
          >
            <MemberAvatar
              seed={me?.avatarUrl ?? 'split-meow-me'}
              alt="Profile"
              size={128}
              className="group-hover:opacity-80 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">
                refresh
              </span>
            </div>
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="absolute bottom-0 right-0 bg-[image:var(--background-image-gradient-primary)] p-3 rounded-full text-white shadow-ambient active:scale-90 duration-200 z-10"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        <div className="space-y-1 w-full max-w-xs">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 bg-surface-container-high rounded-full px-4 py-3 text-center text-xl font-medium focus:outline-none focus:bg-primary-container transition-colors shadow-ambient"
                autoFocus
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
          ) : (
            <h1 className="text-3xl font-medium tracking-tight text-on-surface">
              {me?.name || 'User'}
            </h1>
          )}
          <p className="text-on-surface-variant text-sm">財務喵管家</p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-medium px-2">管理成員</h2>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-surface-container-low rounded-[2rem]"
            >
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => randomizeAvatar(member.id)}
                  className="relative group shrink-0"
                  title="更換頭像"
                >
                  <MemberAvatar
                    seed={member.avatarUrl}
                    alt={member.name}
                    size={48}
                    className="group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
                    <span className="material-symbols-outlined text-white text-sm drop-shadow-md">
                      refresh
                    </span>
                  </div>
                </button>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => updateMember(member.id, e.target.value)}
                  className="flex-1 bg-transparent border-b-2 border-transparent focus:border-primary focus:bg-surface-container-high focus:px-3 focus:py-2 focus:rounded-xl outline-none font-medium transition-all"
                  placeholder="輸入名字"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-medium px-2">應用程式設定</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-5 bg-surface-container-low rounded-[2rem] hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">notifications_active</span>
              <span className="font-medium">推播通知</span>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
              <div className="w-4 h-4 bg-on-primary rounded-full absolute right-1"></div>
            </div>
          </div>
          <div className="flex items-center justify-between p-5 bg-surface-container-low rounded-[2rem] hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">payments</span>
              <span className="font-medium">預設幣別</span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant text-sm">
              <span>TWD (NT$)</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-5 bg-surface-container-low rounded-[2rem] hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">toys_fan</span>
              <span className="font-medium">貓咪遊玩模式</span>
            </div>
            <div className="w-12 h-6 bg-outline-variant/30 rounded-full relative p-1 cursor-pointer">
              <div className="w-4 h-4 bg-surface-container-lowest rounded-full absolute left-1"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
