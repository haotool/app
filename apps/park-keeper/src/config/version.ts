/**
 * ParkKeeper version SSOT
 *
 * Runtime display should use the semantic version core only.
 * Build metadata (e.g. +build.123 or +sha.abc123) is preserved for diagnostics.
 */
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

function getEnvString(key: 'VITE_APP_VERSION' | 'VITE_BUILD_TIME', fallback: string): string {
  const value: unknown = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function getEnvBoolean(key: 'DEV', fallback: boolean): boolean {
  const value: unknown = import.meta.env[key];
  return typeof value === 'boolean' ? value : fallback;
}

export const DEFAULT_APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';

export const APP_VERSION: string = getEnvString('VITE_APP_VERSION', DEFAULT_APP_VERSION);

export const DEFAULT_BUILD_TIME =
  typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : new Date().toISOString();

export const BUILD_TIME: string = getEnvString('VITE_BUILD_TIME', DEFAULT_BUILD_TIME);

export const IS_DEV: boolean = getEnvBoolean('DEV', false);

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

export function getFormattedBuildTime(): string {
  const buildDate = new Date(BUILD_TIME);
  const date = buildDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const time = buildDate.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} ${time}`;
}

export interface VersionInfo {
  version: string;
  displayVersion: string;
  fullVersion: string;
  buildTime: string;
  formattedBuildTime: string;
  isDev: boolean;
}

export function getVersionInfo(): VersionInfo {
  return {
    version: APP_VERSION,
    displayVersion: getDisplayVersion(),
    fullVersion: getFullVersion(),
    buildTime: BUILD_TIME,
    formattedBuildTime: getFormattedBuildTime(),
    isDev: IS_DEV,
  };
}
