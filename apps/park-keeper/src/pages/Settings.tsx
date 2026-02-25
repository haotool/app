/**
 * Settings Page
 * Reuses the same ParkKeeper settings-tab UI from Home while avoiding
 * SSR hydration mismatch on this route.
 */
import { ClientOnly } from 'vite-react-ssg';
import HomeSkeleton from '@app/park-keeper/components/HomeSkeleton';
import Home from './Home';

export default function SettingsPage() {
  return (
    <ClientOnly fallback={<HomeSkeleton />}>{() => <Home initialTab="settings" />}</ClientOnly>
  );
}
