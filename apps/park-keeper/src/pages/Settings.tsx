/**
 * Settings page - SSG route wrapper
 * Settings is accessed via bottom nav in Home.tsx; this page serves SSG only.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // In SSG context, render static content
    // In client context, redirect to home with settings tab
    if (typeof window !== 'undefined') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">設定 | 停車好工具</h1>
      <p className="text-slate-600 mb-6">自訂介面主題、語言與快取設定</p>
      <div className="space-y-4 text-left max-w-md">
        <h2 className="text-lg font-semibold">功能</h2>
        <ul className="list-disc list-inside text-slate-600 space-y-2">
          <li>四種介面主題：Zen、Nitro、Kawaii、Classic</li>
          <li>三語言：繁體中文、English、日本語</li>
          <li>快取管理：自訂保留天數</li>
          <li>資料管理：匯出或清除所有紀錄</li>
        </ul>
      </div>
      <p className="text-xs text-slate-400 mt-8">
        <span rel="author">阿璋 (Ah Zhang)</span> · <time dateTime="2026-02-25">2026</time>
      </p>
    </div>
  );
}
