import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 每個測試後清理
afterEach(() => {
  cleanup();
});

// Mock localStorage
const storageData = new Map<string, string>();

const localStorageMock: Storage = {
  get length() {
    return storageData.size;
  },
  clear: vi.fn(() => storageData.clear()),
  getItem: vi.fn((key: string) => storageData.get(key) ?? null),
  key: vi.fn((index: number) => Array.from(storageData.keys())[index] ?? null),
  removeItem: vi.fn((key: string) => {
    storageData.delete(key);
  }),
  setItem: vi.fn((key: string, value: string) => {
    storageData.set(key, value);
  }),
};

global.localStorage = localStorageMock;
