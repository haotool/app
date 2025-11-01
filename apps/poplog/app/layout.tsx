import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Q版便便記錄器 v4.1.0',
  description: 'PWA 便便追蹤應用程式',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Q版便便記錄器',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('poop.v4.theme') || 'light';
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="m-0 p-0 bg-surface text-on-surface">{children}</body>
    </html>
  );
}
