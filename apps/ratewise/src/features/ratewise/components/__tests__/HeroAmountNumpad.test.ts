import { describe, expect, it } from 'vitest';
import { applyHeroAmountKey } from '../HeroAmountNumpad';
describe('applyHeroAmountKey', () => {
  it('appends single digits', () => {
    expect(applyHeroAmountKey('12', '3')).toBe('123');
    expect(applyHeroAmountKey('', '5')).toBe('5');
  });
  it('replaces leading zero', () => {
    expect(applyHeroAmountKey('0', '7')).toBe('7');
  });
  it('appends 00 when non-zero', () => {
    expect(applyHeroAmountKey('12', '00')).toBe('1200');
  });
  it('00 on empty/zero stays 0', () => {
    expect(applyHeroAmountKey('', '00')).toBe('0');
    expect(applyHeroAmountKey('0', '00')).toBe('0');
  });
  it('backspace removes char', () => {
    expect(applyHeroAmountKey('123', 'backspace')).toBe('12');
  });
  it('backspace on single char returns empty', () => {
    expect(applyHeroAmountKey('5', 'backspace')).toBe('');
    expect(applyHeroAmountKey('', 'backspace')).toBe('');
  });
});
