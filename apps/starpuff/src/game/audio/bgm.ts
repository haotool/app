import { ZZFX } from 'zzfx';

// 原創輕快短循環（32 步 ×0.22s ≈ 7s）：C 大調五聲音階旋律 + 根音低音。
// 以 zzfx buildSamples 逐音符離線混入單一 loop buffer，無縫循環、零 timer。
const STEP_SECONDS = 0.22;
const ROOT_HZ = 523.25;
const BGM_GAIN = 0.3;

const _ = null;
const MELODY: (number | null)[] = [
  0,
  _,
  4,
  7,
  9,
  _,
  7,
  _,
  4,
  _,
  2,
  4,
  0,
  _,
  _,
  _,
  0,
  _,
  4,
  7,
  12,
  _,
  9,
  _,
  7,
  _,
  9,
  7,
  4,
  _,
  _,
  _,
];
const BASS: (number | null)[] = [
  -24,
  _,
  _,
  _,
  -17,
  _,
  _,
  _,
  -12,
  _,
  _,
  _,
  -19,
  _,
  _,
  _,
  -24,
  _,
  _,
  _,
  -17,
  _,
  _,
  _,
  -12,
  _,
  -19,
  _,
  -24,
  _,
  _,
  _,
];

let loopBuffer: AudioBuffer | null = null;
let source: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;
let muted = false;

function mixTrack(
  data: Float32Array,
  stepLength: number,
  steps: (number | null)[],
  volume: number,
  release: number,
  shape: number,
): void {
  steps.forEach((semitone, i) => {
    if (semitone === null) return;
    const samples = ZZFX.buildSamples(
      volume,
      0,
      ZZFX.getNote(semitone, ROOT_HZ),
      0.01,
      0.1,
      release,
      shape,
      1.6,
    );
    const offset = i * stepLength;
    for (let j = 0; j < samples.length && offset + j < data.length; j++) {
      data[offset + j] = (data[offset + j] ?? 0) + (samples[j] ?? 0);
    }
  });
}

function buildLoopBuffer(): AudioBuffer {
  const ctx = ZZFX.audioContext;
  const stepLength = Math.round(ZZFX.sampleRate * STEP_SECONDS);
  const data = new Float32Array(stepLength * MELODY.length);
  mixTrack(data, stepLength, MELODY, 0.45, 0.16, 0);
  mixTrack(data, stepLength, BASS, 0.5, 0.3, 1);
  const buffer = ctx.createBuffer(1, data.length, ZZFX.sampleRate);
  buffer.getChannelData(0).set(data);
  return buffer;
}

export function startBgm(): void {
  if (source) return;
  const ctx = ZZFX.audioContext;
  loopBuffer ??= buildLoopBuffer();
  if (!gain) {
    gain = ctx.createGain();
    gain.connect(ctx.destination);
  }
  gain.gain.value = muted ? 0 : BGM_GAIN;
  source = ctx.createBufferSource();
  source.buffer = loopBuffer;
  source.loop = true;
  source.connect(gain);
  source.start();
}

export function stopBgm(): void {
  source?.stop();
  source = null;
}

export function setBgmMuted(nextMuted: boolean): void {
  muted = nextMuted;
  if (gain) gain.gain.value = muted ? 0 : BGM_GAIN;
}
