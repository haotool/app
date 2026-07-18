import { describe, expect, it } from 'vitest';
import { advanceEgg, createEggProgress, type EasterEggSpec, type EggEvent } from './eggs';
import { LEVELS } from './levels';

function run(spec: EasterEggSpec, events: readonly EggEvent[]): boolean[] {
  let progress = createEggProgress();
  return events.map((event) => {
    const result = advanceEgg(spec, progress, event);
    progress = result.progress;
    return result.triggered;
  });
}

describe('LEVELS easterEggs 資料（§24）', () => {
  it('十二關各掛一顆彩蛋且觸發型別對表', () => {
    expect(LEVELS.map((l) => l.easterEggs.length)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    expect(LEVELS.map((l) => l.easterEggs[0]?.trigger)).toEqual([
      'reach-x',
      'stand-count',
      'eat-sequence',
      'crown-early-hit',
      'stand-count',
      'eat-sequence',
      'crown-early-hit',
      'eat-sequence',
      'eat-sequence',
      'stand-count',
      'eat-sequence',
      'twin-finish',
    ]);
    expect(LEVELS.map((l) => l.easterEggs[0]?.reward)).toEqual([
      'hp-up',
      'full-magazine',
      'gold-star',
      'heal',
      'hp-up',
      'gold-star',
      'heal',
      'gold-star',
      'full-magazine',
      'hp-up',
      'gold-star',
      'gold-star',
    ]);
  });

  it('L10 彩蛋高台（§66）：目標層高存在於平台表且為星門折躍專屬高台', () => {
    const egg = LEVELS[9]?.easterEggs[0];
    if (egg?.trigger !== 'stand-count') throw new Error('L10 彩蛋型別不符');
    expect(LEVELS[9]?.platforms.some((p) => p.y === egg.platformY)).toBe(true);
    expect(egg.platformY).toBeLessThan(272);
  });

  it('L5 彩蛋高台（§51）：目標層高存在於平台表且為氣流柱可達高台', () => {
    const egg = LEVELS[4]?.easterEggs[0];
    if (egg?.trigger !== 'stand-count') throw new Error('L5 彩蛋型別不符');
    expect(LEVELS[4]?.platforms.some((p) => p.y === egg.platformY)).toBe(true);
    expect(egg.platformY).toBeLessThan(272);
  });

  it('L2 彩蛋平台層高存在於平台表（272 為最高層）', () => {
    const egg = LEVELS[1]?.easterEggs[0];
    if (egg?.trigger !== 'stand-count') throw new Error('L2 彩蛋型別不符');
    expect(LEVELS[1]?.platforms.some((p) => p.y === egg.platformY)).toBe(true);
    expect(Math.min(...(LEVELS[1]?.platforms.map((p) => p.y) ?? []))).toBe(egg.platformY);
  });
});

describe('advanceEgg：reach-x', () => {
  const spec: EasterEggSpec = { trigger: 'reach-x', reward: 'hp-up', maxX: 60 };

  it('走到最左緣觸發一次，之後鎖存', () => {
    const results = run(spec, [
      { kind: 'position', x: 100 },
      { kind: 'position', x: 59 },
      { kind: 'position', x: 30 },
    ]);
    expect(results).toEqual([false, true, false]);
  });

  it('無關事件不推進', () => {
    expect(run(spec, [{ kind: 'swallow', flavor: 'jelly' }])).toEqual([false]);
  });
});

describe('advanceEgg：stand-count', () => {
  const spec: EasterEggSpec = {
    trigger: 'stand-count',
    reward: 'full-magazine',
    platformY: 272,
    count: 3,
  };

  it('上升緣計數：連續站立不重複計，離開再站上才 +1', () => {
    const results = run(spec, [
      { kind: 'stand', platformY: 272 },
      { kind: 'stand', platformY: 272 },
      { kind: 'stand', platformY: null },
      { kind: 'stand', platformY: 272 },
      { kind: 'stand', platformY: null },
      { kind: 'stand', platformY: 272 },
    ]);
    expect(results).toEqual([false, false, false, false, false, true]);
  });

  it('非目標平台不計數', () => {
    expect(
      run(spec, [
        { kind: 'stand', platformY: 336 },
        { kind: 'stand', platformY: null },
        { kind: 'stand', platformY: 336 },
      ]),
    ).toEqual([false, false, false]);
  });
});

describe('advanceEgg：eat-sequence', () => {
  const spec: EasterEggSpec = {
    trigger: 'eat-sequence',
    reward: 'gold-star',
    sequence: ['jelly', 'floaty', 'puffy'],
  };

  it('依序連吞觸發；插入異種即斷鏈可重排', () => {
    const results = run(spec, [
      { kind: 'swallow', flavor: 'jelly' },
      { kind: 'swallow', flavor: 'floaty' },
      { kind: 'swallow', flavor: 'jelly' },
      { kind: 'swallow', flavor: 'floaty' },
      { kind: 'swallow', flavor: 'puffy' },
    ]);
    expect(results).toEqual([false, false, false, false, true]);
  });

  it('滑動視窗只看最近三口', () => {
    const results = run(spec, [
      { kind: 'swallow', flavor: 'puffy' },
      { kind: 'swallow', flavor: 'jelly' },
      { kind: 'swallow', flavor: 'floaty' },
      { kind: 'swallow', flavor: 'puffy' },
    ]);
    expect(results).toEqual([false, false, false, true]);
  });
});

describe('advanceEgg：twin-finish（§70）', () => {
  const spec: EasterEggSpec = { trigger: 'twin-finish', reward: 'gold-star' };

  it('收到雙子連破事件觸發一次並鎖存；無關事件不推進', () => {
    const results = run(spec, [
      { kind: 'boss-hit', sinceActiveMs: 100 },
      { kind: 'twin-finish' },
      { kind: 'twin-finish' },
    ]);
    expect(results).toEqual([false, true, false]);
  });
});

describe('advanceEgg：crown-early-hit', () => {
  const spec: EasterEggSpec = { trigger: 'crown-early-hit', reward: 'heal', windowMs: 5000 };

  it('時間窗內首擊觸發；逾時不觸發', () => {
    expect(run(spec, [{ kind: 'boss-hit', sinceActiveMs: 4200 }])).toEqual([true]);
    expect(run(spec, [{ kind: 'boss-hit', sinceActiveMs: 5001 }])).toEqual([false]);
  });

  it('逾時首擊後不再回頭觸發', () => {
    const results = run(spec, [
      { kind: 'boss-hit', sinceActiveMs: 6000 },
      { kind: 'boss-hit', sinceActiveMs: 6500 },
    ]);
    expect(results).toEqual([false, false]);
  });
});
