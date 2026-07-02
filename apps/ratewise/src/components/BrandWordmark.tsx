/**
 * BrandWordmark - 品牌標準字（wordmark）
 *
 * SSOT：scripts/source-images/brand/showcase-twincoins.html（Nunito 900、accent 主色強調）。
 * 字體以 1.2KB 子集自架（index.html @font-face），品牌名稱不隨語系翻譯；
 * 字串一律取自 APP_INFO（Brand SSOT 哨兵測試守門）。
 */

import { APP_INFO } from '../config/app-info';

export function BrandWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`brand-wordmark ${className}`.trim()}>
      {APP_INFO.wordmarkPrefix}
      <span className="brand-wordmark-accent">{APP_INFO.wordmarkAccent}</span>
    </span>
  );
}
