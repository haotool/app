/**
 * 羅馬拼音轉換工具測試
 *
 * @module romajiConverter.test
 */

import { describe, it, expect } from 'vitest';
import { convertToRomaji, containsJapanese, getRomajiDictionarySize } from './romajiConverter';

describe('romajiConverter', () => {
  describe('convertToRomaji', () => {
    it('should convert common kanji names to romaji', () => {
      expect(convertToRomaji('田中')).toBe('Tanaka');
      expect(convertToRomaji('山本')).toBe('Yamamoto');
      // 注意：逐字轉換模式，小 → Ko, 林 → Hayashi
      expect(convertToRomaji('小林')).toBe('Kohayashi');
    });

    it('should convert pun names correctly', () => {
      expect(convertToRomaji('梅川依芙')).toBe('Umekawaifu');
    });

    it('should handle hiragana', () => {
      expect(convertToRomaji('あいうえお')).toBe('Aiueo');
      expect(convertToRomaji('かきくけこ')).toBe('Kakikukeko');
    });

    it('should handle katakana', () => {
      expect(convertToRomaji('アイウエオ')).toBe('Aiueo');
      expect(convertToRomaji('カキクケコ')).toBe('Kakikukeko');
    });

    it('should return empty string for empty input', () => {
      expect(convertToRomaji('')).toBe('');
    });

    it('should preserve unknown characters', () => {
      expect(convertToRomaji('ABC123')).toBe('Abc123');
    });

    it('should handle mixed content', () => {
      const result = convertToRomaji('田中ABC');
      expect(result).toContain('Tanaka');
    });
  });

  describe('containsJapanese', () => {
    it('should return true for hiragana', () => {
      expect(containsJapanese('あいう')).toBe(true);
    });

    it('should return true for katakana', () => {
      expect(containsJapanese('アイウ')).toBe(true);
    });

    it('should return true for kanji', () => {
      expect(containsJapanese('日本語')).toBe(true);
    });

    it('should return false for pure ASCII', () => {
      expect(containsJapanese('Hello World')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(containsJapanese('')).toBe(false);
    });

    it('should return true for mixed content', () => {
      expect(containsJapanese('Hello 日本')).toBe(true);
    });
  });

  describe('getRomajiDictionarySize', () => {
    it('should return a positive number', () => {
      expect(getRomajiDictionarySize()).toBeGreaterThan(0);
    });

    it('should have at least 200 entries', () => {
      // 確保字典有足夠的覆蓋率
      expect(getRomajiDictionarySize()).toBeGreaterThan(200);
    });
  });
});
