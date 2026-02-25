const DEFAULT_APP_VERSION = '1.0.0';

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : DEFAULT_APP_VERSION;

export const BUILD_TIME =
  typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();

export const IS_DEV = import.meta.env.DEV;

export function getDisplayVersion(): string {
  return APP_VERSION.startsWith('v') ? APP_VERSION : `v${APP_VERSION}`;
}

export function getFullVersion(): string {
  return `${getDisplayVersion()} (${new Date(BUILD_TIME).toLocaleDateString('zh-TW')})`;
}
