import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { MemberAvatar } from './MemberAvatar';
import i18n, { type SupportedLanguage } from '../i18n';

const LANGUAGES: { id: SupportedLanguage; flag: string; name: string }[] = [
  { id: 'zh-TW', flag: '🇹🇼', name: '繁中' },
  { id: 'en', flag: '🇺🇸', name: 'EN' },
  { id: 'ko', flag: '🇰🇷', name: '한국어' },
  { id: 'ja', flag: '🇯🇵', name: '日本語' },
];

export function SettingsTab() {
  const { t } = useTranslation();
  const { members, updateMember, randomizeAvatar, deleteMember, addMember } = useStore();
  const me = members.find((m) => m.id === 'me') ?? members[0] ?? null;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(me?.name ?? '');

  // resolvedLanguage は supportedLngs に一致した確定済みの言語コードを返す
  const currentLang = (i18n.resolvedLanguage ?? 'zh-TW') as SupportedLanguage;

  const handleSave = () => {
    if (editName.trim() && me) {
      updateMember(me.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    // i18next-browser-languagedetector が localStorage('split-meow-language') に自動保存するため手動不要
    void i18n.changeLanguage(lang);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-28">
      <section className="flex flex-col items-center text-center space-y-6">
        <div className="relative group">
          <button
            onClick={() => me && randomizeAvatar(me.id)}
            className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-container-lowest shadow-ambient relative block"
            title={t('settings.change_avatar')}
          >
            <MemberAvatar
              seed={me?.avatarUrl ?? 'split-meow-me'}
              alt="Profile"
              size={96}
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
                className="flex-1 bg-surface-container-high rounded-full px-4 py-3 text-center text-[16px] sm:text-xl font-medium focus:outline-none focus:bg-primary-container transition-colors shadow-ambient"
                autoFocus
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
          ) : (
            <h1 className="text-3xl font-medium tracking-tight text-on-surface">
              {me?.name || t('settings.default_name')}
            </h1>
          )}
          <p className="text-on-surface-variant text-sm">{t('settings.profile_subtitle')}</p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-medium px-2">{t('settings.manage_members')}</h2>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-surface-container-low rounded-[2rem]"
            >
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => randomizeAvatar(member.id)}
                  className="relative group shrink-0 cursor-pointer"
                  title={t('settings.change_avatar')}
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
                  className="flex-1 bg-transparent border-b-2 border-transparent focus:border-primary focus:bg-surface-container-high focus:px-3 focus:py-2 focus:rounded-xl outline-none font-medium text-[16px] transition-all"
                  placeholder={t('settings.name_placeholder')}
                />
              </div>
              {members.length > 1 && (
                <button
                  onClick={() => deleteMember(member.id)}
                  className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-error-container hover:text-error transition-colors cursor-pointer"
                  title={t('settings.delete_member')}
                >
                  <span className="material-symbols-outlined text-[18px]">person_remove</span>
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addMember}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[2rem] border-2 border-dashed border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary-container/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span className="font-medium text-sm">{t('home.add_member')}</span>
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-medium px-2">{t('settings.app_settings')}</h2>
        <div className="space-y-4">
          {/* Language Selector */}
          <div className="flex items-center justify-between p-5 bg-surface-container-low rounded-[2rem]">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">language</span>
              <span className="font-medium">{t('settings.language')}</span>
            </div>
            <div className="flex gap-1 bg-surface-container rounded-full p-1">
              {LANGUAGES.map((lang) => {
                const isActive = currentLang === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container shadow-ambient'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="hidden sm:inline">{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between p-5 bg-surface-container-low rounded-[2rem] hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">notifications_active</span>
              <span className="font-medium">{t('settings.push_notifications')}</span>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
              <div className="w-4 h-4 bg-on-primary rounded-full absolute right-1"></div>
            </div>
          </div>
          <div className="flex items-center justify-between p-5 bg-surface-container-low rounded-[2rem] hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">payments</span>
              <span className="font-medium">{t('settings.default_currency')}</span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant text-sm">
              <span>TWD (NT$)</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-5 bg-surface-container-low rounded-[2rem] hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">toys_fan</span>
              <span className="font-medium">{t('settings.cat_play_mode')}</span>
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
