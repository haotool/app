/**
 * Trusted Types bootstrap script
 *
 * 依照 web.dev Trusted Types 指南，先建立 default policy 讓第三方腳本
 * （Cloudflare Rocket Loader、Workbox runtime 等）在 CSP 要求下仍可運作。
 * 目前僅做 pass-through，未來可替換成 DOMPurify 之類的 sanitizer。
 */

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

const POLICY_CONFIG: RatewiseTrustedTypePolicyOptions = {
  createHTML: passThrough,
  createScript: passThrough,
  createScriptURL: passThrough,
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
      console.warn('[TrustedTypes] 建立 policy 失敗:', error);
      return null;
    }
  };

  const defaultPolicy = ensurePolicy('default');
  window.__RATEWISE_TRUSTED_POLICY__ =
    defaultPolicy ?? ensurePolicy('ratewise#default') ?? undefined;
};

initTrustedTypes();

export {};
