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
        <div className="w-full max-w-lg flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3 w-full">
            <div className="text-xl font-medium text-primary flex items-center gap-2">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                pets
              </span>
              <span className="hidden sm:inline">喵喵分帳</span>
            </div>
            <TripSelector />
            <div className="ml-auto">
              <PayerSelector />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-20 px-6 max-w-lg mx-auto">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      <BottomNav />
      <UpdatePrompt />
    </div>
  );
}
