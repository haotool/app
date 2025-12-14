/**
 * Constants Tests
 */
import { describe, it, expect } from 'vitest';
import { APP_NAME, PROJECTS, STATS, FAQS } from '../constants';

describe('Constants', () => {
  describe('APP_NAME', () => {
    it('should be defined', () => {
      expect(APP_NAME).toBeDefined();
      expect(typeof APP_NAME).toBe('string');
    });

    // [fix:2025-12-14] 更新為新的 APP_NAME
    it('should be HAOTOOL', () => {
      expect(APP_NAME).toBe('HAOTOOL');
    });
  });

  describe('PROJECTS', () => {
    it('should be an array', () => {
      expect(Array.isArray(PROJECTS)).toBe(true);
    });

    it('should have at least 2 projects', () => {
      expect(PROJECTS.length).toBeGreaterThanOrEqual(2);
    });

    it('each project should have required fields', () => {
      PROJECTS.forEach((project) => {
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('title');
        expect(project).toHaveProperty('description');
        expect(project).toHaveProperty('tags');
        expect(project).toHaveProperty('link');
        expect(project).toHaveProperty('category');
      });
    });

    it('should include nihonname project', () => {
      const nihonname = PROJECTS.find((p) => p.id === 'nihonname');
      expect(nihonname).toBeDefined();
      expect(nihonname?.featured).toBe(true);
    });

    it('should include ratewise project', () => {
      const ratewise = PROJECTS.find((p) => p.id === 'ratewise');
      expect(ratewise).toBeDefined();
      expect(ratewise?.featured).toBe(true);
    });
  });

  describe('STATS', () => {
    it('should be an array', () => {
      expect(Array.isArray(STATS)).toBe(true);
    });

    it('each stat should have value and label', () => {
      STATS.forEach((stat) => {
        expect(stat).toHaveProperty('value');
        expect(stat).toHaveProperty('label');
        expect(typeof stat.value).toBe('string');
        expect(typeof stat.label).toBe('string');
      });
    });
  });

  describe('FAQS', () => {
    it('should be an array', () => {
      expect(Array.isArray(FAQS)).toBe(true);
    });

    it('each FAQ should have question and answer', () => {
      FAQS.forEach((faq) => {
        expect(faq).toHaveProperty('question');
        expect(faq).toHaveProperty('answer');
        expect(typeof faq.question).toBe('string');
        expect(typeof faq.answer).toBe('string');
      });
    });

    it('should have at least 3 FAQs', () => {
      expect(FAQS.length).toBeGreaterThanOrEqual(3);
    });

    it('should describe HAOTOOL as取自「好工具」的諧音', () => {
      const origin = FAQS.find((faq) => faq.question.includes('名字由來'));
      expect(origin?.answer).toContain('取自「好工具」的諧音');
      expect(origin?.answer).toContain('好工具');
      expect(origin?.answer).toContain('諧音');
    });
  });
});
