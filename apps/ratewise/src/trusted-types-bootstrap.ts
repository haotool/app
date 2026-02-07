/**
 * Trusted Types bootstrap script
 *
 * 依照 web.dev Trusted Types 指南，先建立 default policy 讓第三方腳本
 * （Cloudflare Rocket Loader、Workbox runtime 等）在 CSP 要求下仍可運作。
 * 目前僅做 pass-through，未來可替換成 DOMPurify 之類的 sanitizer。
 */

import { logger } from './utils/logger';

const passThrough = (value: string): string => value;

interface RatewiseTrustedTypePolicy {
  createHTML?: (input: string, sink?: string) => string;
  createScript?: (input: string, sink?: string) => string;
  createScriptURL?: (input: string, sink?: string) => string;
}

type RatewiseTrustedTypePolicyOptions = Required<RatewiseTrustedTypePolicy>;

interface RatewiseTrustedTypesFactory {
  createPolicy: (
    name: string,
    options: RatewiseTrustedTypePolicyOptions,
  ) => RatewiseTrustedTypePolicy;
  getPolicyNames?: () => string[];
  getPolicy?: (name: string) => RatewiseTrustedTypePolicy | null;
}

/**
 * 安全驗證 URL 域名
 * @param url - 要驗證的 URL
 * @param allowedDomains - 允許的域名列表
 * @returns 是否為允許的域名
 */
function isAllowedDomain(url: string, allowedDomains: string[]): boolean {
  try {
    const urlObj = new URL(url, window.location.origin);
    const hostname = urlObj.hostname;

    return allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    // 相對路徑或無效 URL，允許通過（由瀏覽器處理）
    return url.startsWith('/') || url.startsWith('./');
  }
}

/**
 * Trusted Types Policy Configuration
 *
 * Allows scripts from trusted sources (Cloudflare Insights, SSG hydration)
 * and blocks untrusted script URLs.
 */
const POLICY_CONFIG: RatewiseTrustedTypePolicyOptions = {
  createHTML: passThrough,
  createScript: (input: string, sink?: string) => {
    // 允許 Cloudflare Insights 和 SSG 生成的 inline scripts
    if (
      sink === 'script' &&
      (input.includes('cloudflareinsights.com') ||
        input.includes('__staticRouterHydrationData') ||
        input.includes('$RC') || // React SSG hydration
        input.includes('$RV') || // React SSG hydration
        input.includes('__VITE_REACT_SSG_HASH__'))
    ) {
      return input;
    }
    return passThrough(input);
  },
  createScriptURL: (input: string) => {
    // 允許相對路徑和 Cloudflare Insights
    const allowedDomains = ['cloudflareinsights.com', 'static.cloudflareinsights.com'];

    if (input.startsWith('/') || input.startsWith('./') || isAllowedDomain(input, allowedDomains)) {
      return input;
    }

    logger.warn('Blocked untrusted script URL', { url: input });
    return '';
  },
};

declare global {
  interface Window {
    __RATEWISE_TRUSTED_POLICY__?: RatewiseTrustedTypePolicy;
    trustedTypes?: RatewiseTrustedTypesFactory;
  }
}

const initTrustedTypes = (): void => {
  if (typeof window === 'undefined') return;
  const factory = window.trustedTypes;

  if (!factory?.createPolicy) {
    return;
  }

  const existing = factory.getPolicyNames?.() ?? [];

  const ensurePolicy = (name: string): RatewiseTrustedTypePolicy | null => {
    if (existing.includes(name)) {
      return factory.getPolicy?.(name) ?? null;
    }

    try {
      return factory.createPolicy(name, POLICY_CONFIG);
    } catch (error) {
      logger.warn('TrustedTypes policy creation failed', { error });
      return null;
    }
  };

  const defaultPolicy = ensurePolicy('default');
  window.__RATEWISE_TRUSTED_POLICY__ =
    defaultPolicy ?? ensurePolicy('ratewise#default') ?? undefined;
};

initTrustedTypes();

export {};
