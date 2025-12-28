/**
 * Lessons 資料測試
 * [BDD 測試策略 - Given-When-Then]
 */
import { describe, it, expect } from 'vitest';
import { LESSONS, QUIZ_QUESTIONS, INTENSITY_LEVELS } from './lessons';

describe('課程資料', () => {
  describe('LESSONS', () => {
    it('應該包含正確數量的課程', () => {
      // Given: LESSONS 資料
      // When: 檢查長度
      // Then: 應該有 5 個課程
      expect(LESSONS).toHaveLength(5);
    });

    it('每個課程應該有必要的屬性', () => {
      // Given: 每個課程
      LESSONS.forEach((lesson) => {
        // Then: 應該有必要的屬性
        expect(lesson).toHaveProperty('id');
        expect(lesson).toHaveProperty('title');
        expect(lesson).toHaveProperty('subtitle');
        expect(lesson).toHaveProperty('level');
        expect(lesson).toHaveProperty('paragraphs');
        expect(lesson.paragraphs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('QUIZ_QUESTIONS', () => {
    it('應該包含 5 個問題', () => {
      // Given: QUIZ_QUESTIONS 資料
      // When: 檢查長度
      // Then: 應該有 5 個問題
      expect(QUIZ_QUESTIONS).toHaveLength(5);
    });

    it('每個問題應該有正確的結構', () => {
      // Given: 每個問題
      QUIZ_QUESTIONS.forEach((question) => {
        // Then: 應該有必要的屬性
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('options');
        expect(question).toHaveProperty('correctIndex');
        expect(question).toHaveProperty('explanation');
        expect(question.options).toHaveLength(3);
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(3);
      });
    });
  });

  describe('INTENSITY_LEVELS', () => {
    it('應該包含 10 個震度等級', () => {
      // Given: INTENSITY_LEVELS 資料
      // When: 檢查長度
      // Then: 應該有 10 個等級
      expect(INTENSITY_LEVELS).toHaveLength(10);
    });

    it('每個等級應該有正確的結構', () => {
      // Given: 每個等級
      INTENSITY_LEVELS.forEach((level) => {
        // Then: 應該有必要的屬性
        expect(level).toHaveProperty('level');
        expect(level).toHaveProperty('title');
        expect(level).toHaveProperty('description');
        expect(level).toHaveProperty('action');
        expect(level).toHaveProperty('color');
      });
    });
  });
});
