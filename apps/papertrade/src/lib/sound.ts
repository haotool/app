// WebAudio 純合成音效：無外部資產、無 fetch（security SSOT 第 9 條）。
// 音效設計依交易警示慣例：下行音高輪廓表達負向／出場事件，三角波較正弦穿透、較方波不刺耳，
// 快 attack＋指數衰減 envelope（中頻 400–900Hz、總長 ~300ms、音量適中）。

const TONE_VOLUME = 0.3;
const ATTACK_S = 0.008;
const TONE_HIGH_HZ = 880;
const TONE_LOW_HZ = 440;
const TONE_DURATION_S = 0.14;
const TONE_GAP_S = 0.16;

// 模組級單例：AudioContext 為稀缺資源，全站音效共用一個實例。
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  audioContext ??= new AudioContext();
  return audioContext;
}

// iOS 等平台要求使用者手勢後才可播音：掛一次性 pointerdown listener，
// 於首次手勢內建立／resume context 解鎖。回傳解除函式供卸載清理。
export function unlockAudio(): () => void {
  function resume(): void {
    const context = getAudioContext();
    if (context !== null && context.state === 'suspended') {
      void context.resume();
    }
  }
  window.addEventListener('pointerdown', resume, { once: true });
  return () => window.removeEventListener('pointerdown', resume);
}

function playTone(context: AudioContext, frequencyHz: number, startAt: number): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(frequencyHz, startAt);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(TONE_VOLUME, startAt + ATTACK_S);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + TONE_DURATION_S);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + TONE_DURATION_S + 0.02);
}

// 強平提示音：雙音下行 880→440Hz、總長約 300ms。
export function playLiquidationSound(): void {
  const context = getAudioContext();
  if (context === null || context.state === 'suspended') return;
  const now = context.currentTime;
  playTone(context, TONE_HIGH_HZ, now);
  playTone(context, TONE_LOW_HZ, now + TONE_GAP_S);
}

// 測試隔離用：重置單例。
export function resetAudioForTests(): void {
  audioContext = null;
}
