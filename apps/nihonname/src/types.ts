/**
 * Type definitions for NihonName
 */

export type SurnameData = Record<string, string[]>;

export interface PunName {
  kanji: string;
  romaji: string;
  meaning: string;
}

export interface GeneratorState {
  originalSurname: string;
  originalGivenName: string;
  japaneseSurname: string;
  punName: PunName;
  step: 'input' | 'result';
}
