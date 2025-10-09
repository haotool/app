const isBrowser = typeof window !== 'undefined';

export const readString = (key: string, fallback: string): string => {
  if (!isBrowser) return fallback;
  const value = window.localStorage.getItem(key);
  return value ?? fallback;
};

export const writeString = (key: string, value: string) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, value);
};

export const readJSON = <T>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const writeJSON = <T>(key: string, value: T) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};
