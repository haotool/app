import { beforeEach, describe, expect, it, vi } from 'vitest';

// node 環境無 AudioContext，mock zzfx 以驗證純靜音邏輯。
const zzfxMock = vi.hoisted(() => {
  const gainNode = { gain: { value: -1 }, connect: vi.fn() };
  const bufferSource = {
    buffer: null as AudioBuffer | null,
    loop: false,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const inhaleSource = { stop: vi.fn() };
  return {
    gainNode,
    bufferSource,
    inhaleSource,
    zzfx: vi.fn(),
    ZZFX: {
      sampleRate: 44100,
      audioContext: {
        destination: {},
        state: 'running',
        resume: vi.fn(),
        createGain: vi.fn(() => gainNode),
        createBuffer: vi.fn(() => ({
          getChannelData: vi.fn(() => ({ set: vi.fn() }) as unknown as Float32Array),
        })),
        createBufferSource: vi.fn(() => bufferSource),
      },
      buildSamples: vi.fn(() => [0, 0, 0, 0]),
      playSamples: vi.fn(() => inhaleSource),
      getNote: vi.fn(() => 440),
    },
  };
});

vi.mock('zzfx', () => ({ zzfx: zzfxMock.zzfx, ZZFX: zzfxMock.ZZFX }));

async function loadAudio() {
  const mute = await import('./mute');
  const sfx = await import('./sfx');
  const bgm = await import('./bgm');
  return { ...mute, ...sfx, ...bgm };
}

describe('audio mute', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    zzfxMock.gainNode.gain.value = -1;
  });

  it('setMuted 抑制 SFX，解除後恢復播放', async () => {
    const { setMuted, playSfx } = await loadAudio();
    setMuted(true);
    playSfx('jump');
    expect(zzfxMock.zzfx).not.toHaveBeenCalled();
    setMuted(false);
    playSfx('jump');
    expect(zzfxMock.zzfx).toHaveBeenCalledTimes(1);
  });

  it('setMuted 停掉進行中的 inhale 迴圈', async () => {
    const { setMuted, playSfx } = await loadAudio();
    playSfx('inhale');
    expect(zzfxMock.ZZFX.playSamples).toHaveBeenCalledTimes(1);
    setMuted(true);
    expect(zzfxMock.inhaleSource.stop).toHaveBeenCalledTimes(1);
    playSfx('inhale');
    expect(zzfxMock.ZZFX.playSamples).toHaveBeenCalledTimes(1);
  });

  it('setMuted 切換 BGM gain 於 0 與預設音量之間', async () => {
    const { setMuted, startBgm } = await loadAudio();
    startBgm();
    expect(zzfxMock.gainNode.gain.value).toBeGreaterThan(0);
    setMuted(true);
    expect(zzfxMock.gainNode.gain.value).toBe(0);
    setMuted(false);
    expect(zzfxMock.gainNode.gain.value).toBeGreaterThan(0);
  });

  it('isMuted 反映當前狀態', async () => {
    const { setMuted, isMuted } = await loadAudio();
    expect(isMuted()).toBe(false);
    setMuted(true);
    expect(isMuted()).toBe(true);
  });
});
