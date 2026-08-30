import { Analytics } from '@vercel/analytics/react';

/** Vercel Web Analytics：部署至 Vercel 且 Dashboard 啟用後收集 page view。 */
export function VercelAnalytics() {
  return <Analytics />;
}
