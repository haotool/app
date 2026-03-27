declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

function getEnvString(key: 'VITE_APP_VERSION' | 'VITE_BUILD_TIME', fallback: string): string {
  const value: unknown = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export const DEFAULT_APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';

export const APP_VERSION = getEnvString('VITE_APP_VERSION', DEFAULT_APP_VERSION);

export const DEFAULT_BUILD_TIME =
  typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : new Date().toISOString();

export const BUILD_TIME = getEnvString('VITE_BUILD_TIME', DEFAULT_BUILD_TIME);

function normalizeVersionCore(version: string): string {
  const raw = version.startsWith('v') ? version.slice(1) : version;
  return raw.split('+')[0] ?? raw;
}

export function getDisplayVersion(): string {
  return `v${normalizeVersionCore(APP_VERSION)}`;
}

export function getFullVersion(): string {
  const raw = APP_VERSION.startsWith('v') ? APP_VERSION.slice(1) : APP_VERSION;
  return `v${raw}`;
}
