import { describe, expect, it } from 'vitest';
import { JOY_DOWN_THRESHOLD, isJoyDown } from './controls';

describe('isJoyDown（§23 下衝擊的下壓判定）', () => {
  it('閾值為搖桿半徑一半（30px），高於死區避免斜向誤觸', () => {
    expect(JOY_DOWN_THRESHOLD).toBe(30);
  });

  it('輕微下偏（死區至半徑一半間）不判定為下向', () => {
    expect(isJoyDown(13)).toBe(false);
    expect(isJoyDown(30)).toBe(false);
  });

  it('明確下壓過半徑一半才判定為下向', () => {
    expect(isJoyDown(31)).toBe(true);
    expect(isJoyDown(60)).toBe(true);
  });

  it('上向與置中不判定為下向', () => {
    expect(isJoyDown(0)).toBe(false);
    expect(isJoyDown(-45)).toBe(false);
  });
});
