import { useStore } from './store/useStore';
import { HomeTab } from './components/HomeTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsTab } from './components/SettingsTab';
import { BottomNav } from './components/BottomNav';
import { TripSelector } from './components/TripSelector';
import { UpdatePrompt } from './components/UpdatePrompt';
import { PayerSelector } from './components/PayerSelector';

export default function App() {
  const { activeTab } = useStore();

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-24 font-sans">
      {/* Top Navigation Anchor */}
      <header className="fixed top-0 w-full z-50 bg-surface-bright/70 backdrop-blur-md flex justify-center">
        <div className="w-full max-w-lg flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2 w-full min-w-0">
            <div className="shrink-0 text-base font-medium text-primary flex items-center gap-1.5">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                pets
              </span>
              <span>喵喵分帳</span>
            </div>
            <div className="flex-1 min-w-0">
              <TripSelector />
            </div>
            <div className="shrink-0">
              <PayerSelector />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-[64px] px-4 max-w-lg mx-auto">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Bottom gradient fade — masks scrolled content behind the floating BottomNav */}
      <div
        className="fixed inset-x-0 bottom-0 h-28 pointer-events-none z-40"
        style={{ background: 'linear-gradient(to top, #fbf9f7 40%, transparent)' }}
        aria-hidden="true"
      />
      <BottomNav />
      <UpdatePrompt />
    </div>
  );
}
