import type { ReactNode } from 'react';

export type ThemeType = 'racing' | 'cute' | 'minimalist' | 'literary';
export type LanguageType = 'en' | 'zh-TW' | 'ja';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  colors: ThemeColors;
  font: string;
  borderRadius: string;
  animationType: 'spring' | 'tween' | 'inertia';
}

export interface ParkingRecord {
  id: string;
  plateNumber: string;
  floor: string;
  notes?: string;
  timestamp: number;
  photoData?: string; // Base64 string
  hasPhoto: boolean;
  latitude?: number;
  longitude?: number;
}

export interface AppSettings {
  theme: ThemeType;
  language: LanguageType;
  cacheDurationDays: number;
  notificationsEnabled: boolean;
}

// Service Types
export interface StorageService {
  saveRecord(record: ParkingRecord): Promise<void>;
  updateRecord(id: string, updates: Partial<ParkingRecord>): Promise<void>;
  getRecords(): Promise<ParkingRecord[]>;
  deleteRecord(id: string): Promise<void>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  cleanupCache(daysToKeep: number): Promise<number>;
  clearAllData(): Promise<void>;
  exportData(format: 'json' | 'csv'): Promise<string>;
}

// Component Prop Types
export interface BaseProps {
  theme: ThemeConfig;
  className?: string;
}

export interface ButtonProps extends BaseProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}
