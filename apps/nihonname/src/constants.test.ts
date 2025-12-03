/**
 * Constants tests
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { SURNAME_MAP, JAPANESE_GIVEN_NAMES, FUNNY_NAMES, PRIMARY_SOURCE } from './constants';

describe('Constants', () => {
  describe('SURNAME_MAP', () => {
    it('should contain common surnames', () => {
      expect(SURNAME_MAP['陳']).toBeDefined();
      expect(SURNAME_MAP['林']).toBeDefined();
      expect(SURNAME_MAP['黃']).toBeDefined();
      expect(SURNAME_MAP['張']).toBeDefined();
      expect(SURNAME_MAP['李']).toBeDefined();
    });

    it('should have multiple mappings for common surnames', () => {
      const chenMappings = SURNAME_MAP['陳'];
      const linMappings = SURNAME_MAP['林'];
      expect(chenMappings).toBeDefined();
      expect(linMappings).toBeDefined();
      expect(chenMappings!.length).toBeGreaterThan(5);
      expect(linMappings!.length).toBeGreaterThan(5);
    });

    it('should return valid Japanese surnames', () => {
      const chenMappings = SURNAME_MAP['陳'];
      expect(chenMappings).toContain('田中');
      expect(chenMappings).toContain('山本');
    });
  });

  describe('JAPANESE_GIVEN_NAMES', () => {
    it('should contain given names', () => {
      expect(JAPANESE_GIVEN_NAMES.length).toBeGreaterThan(10);
    });

    it('should contain common Japanese names', () => {
      expect(JAPANESE_GIVEN_NAMES).toContain('太郎');
      expect(JAPANESE_GIVEN_NAMES).toContain('花子');
    });
  });

  describe('FUNNY_NAMES', () => {
    it('should contain pun names', () => {
      expect(FUNNY_NAMES.length).toBeGreaterThan(5);
    });

    it('should have correct structure', () => {
      const first = FUNNY_NAMES[0];
      expect(first).toBeDefined();
      if (first) {
        expect(first.kanji).toBeDefined();
        expect(first.romaji).toBeDefined();
        expect(first.meaning).toBeDefined();
      }
    });
  });

  describe('PRIMARY_SOURCE', () => {
    it('should have valid source info', () => {
      expect(PRIMARY_SOURCE.title).toBeDefined();
      expect(PRIMARY_SOURCE.author).toBeDefined();
      expect(PRIMARY_SOURCE.url).toBeDefined();
      expect(PRIMARY_SOURCE.docName).toBeDefined();
    });

    it('should have valid URL', () => {
      expect(PRIMARY_SOURCE.url).toMatch(/^https?:\/\//);
    });
  });
});
