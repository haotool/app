import { beforeEach, describe, expect, it, vi } from 'vitest';
import { playLiquidationSound, resetAudioForTests, unlockAudio } from './sound';

type ContextState = 'suspended' | 'running';

function createAudioContextMock(initialState: ContextState) {
  const oscillators: { type: string; started: boolean }[] = [];
  const resume = vi.fn(function (this: { state: ContextState }) {
    this.state = 'running';
    return Promise.resolve();
  });
  class AudioContextMock {
    state: ContextState = initialState;
    currentTime = 0;
    destination = {};
    resume = resume;
    createOscillator() {
      const record = { type: 'sine', started: false };
      oscillators.push(record);
      return {
        get type() {
          return record.type;
        },
        set type(value: string) {
          record.type = value;
        },
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: () => {
          record.started = true;
        },
        stop: vi.fn(),
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
    }
  }
  return { AudioContextMock, oscillators, resume };
}

describe('sound', () => {
  beforeEach(() => {
    resetAudioForTests();
  });

  it('plays a two-tone liquidation sound when the context is running', () => {
    const { AudioContextMock, oscillators } = createAudioContextMock('running');
    vi.stubGlobal('AudioContext', AudioContextMock);

    playLiquidationSound();

    expect(oscillators).toHaveLength(2);
    expect(oscillators.every((oscillator) => oscillator.started)).toBe(true);
    expect(oscillators.every((oscillator) => oscillator.type === 'triangle')).toBe(true);
  });

  it('stays silent while the context is still suspended (no gesture yet)', () => {
    const { AudioContextMock, oscillators } = createAudioContextMock('suspended');
    vi.stubGlobal('AudioContext', AudioContextMock);

    playLiquidationSound();

    expect(oscillators).toHaveLength(0);
  });

  it('does not crash when the WebAudio API is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => playLiquidationSound()).not.toThrow();
  });

  it('resumes a suspended context on the first pointer gesture', () => {
    const { AudioContextMock, resume } = createAudioContextMock('suspended');
    vi.stubGlobal('AudioContext', AudioContextMock);

    const dispose = unlockAudio();
    window.dispatchEvent(new Event('pointerdown'));

    expect(resume).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('unlock listener fires once and can be disposed', () => {
    const { AudioContextMock, resume } = createAudioContextMock('suspended');
    vi.stubGlobal('AudioContext', AudioContextMock);

    const dispose = unlockAudio();
    window.dispatchEvent(new Event('pointerdown'));
    window.dispatchEvent(new Event('pointerdown'));
    expect(resume).toHaveBeenCalledTimes(1);

    dispose();
    resetAudioForTests();
    const disposeSecond = unlockAudio();
    disposeSecond();
    window.dispatchEvent(new Event('pointerdown'));
    expect(resume).toHaveBeenCalledTimes(1);
  });
});
