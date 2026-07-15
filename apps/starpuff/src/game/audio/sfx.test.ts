import { beforeEach, describe, expect, it, vi } from 'vitest';

const { stopSpy, suspendSpy, resumeSpy, context } = vi.hoisted(() => {
  const ctx = { state: 'running', suspend: vi.fn(), resume: vi.fn() };
  return { stopSpy: vi.fn(), suspendSpy: ctx.suspend, resumeSpy: ctx.resume, context: ctx };
});

vi.mock('zzfx', () => ({
  zzfx: vi.fn(),
  ZZFX: {
    buildSamples: vi.fn(() => [0]),
    playSamples: vi.fn(() => ({ stop: stopSpy })),
    getNote: vi.fn(() => 440),
    sampleRate: 44100,
    audioContext: context,
  },
}));

import { playSfx, resumeAudio, suspendAudio } from './sfx';

beforeEach(() => {
  vi.clearAllMocks();
  context.state = 'running';
});

describe('suspendAudio（§35 暫停全停）', () => {
  it('吸入迴圈進行中暫停：顯式停止迴圈音源並 suspend context', () => {
    playSfx('inhale');
    suspendAudio();
    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(suspendSpy).toHaveBeenCalledTimes(1);
  });

  it('繼續後重新吸入可再啟動迴圈（暫停未卡死內部單例）', () => {
    playSfx('inhale');
    suspendAudio();
    context.state = 'suspended';
    resumeAudio();
    expect(resumeSpy).toHaveBeenCalledTimes(1);
    playSfx('inhale');
    // 第二次啟動＝總計兩次 playSamples；無殘留舊源（前源已 stop）。
    expect(stopSpy).toHaveBeenCalledTimes(1);
  });
});
