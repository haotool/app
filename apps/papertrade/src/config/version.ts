// SSOT：package.json version 經 vite define 注入；vitest 等未注入環境安全回退。
export const VERSION_FALLBACK = '0.0.0';

export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : VERSION_FALLBACK;
