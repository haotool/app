import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export function BottomNav() {
  const { activeTab, setActiveTab } = useStore();
  const { t } = useTranslation();

  const navItems = [
    { id: 'home', icon: 'home', label: t('nav.home') },
    { id: 'history', icon: 'history', label: t('nav.history') },
    { id: 'settings', icon: 'settings_heart', label: t('nav.settings') },
  ] as const;

  return (
    <div
      className="fixed left-0 w-full px-6 z-50 flex justify-center pointer-events-none"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <nav className="flex items-center gap-1 px-2 py-1.5 bg-surface-bright backdrop-blur-sm rounded-full shadow-ambient border border-outline-variant/20 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-full transition-all active:scale-95 duration-200 cursor-pointer min-w-[64px]',
                isActive
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container',
              )}
            >
              <span
                className="material-symbols-outlined text-[20px] leading-none"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium leading-none',
                  isActive ? 'opacity-100' : 'opacity-70',
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
