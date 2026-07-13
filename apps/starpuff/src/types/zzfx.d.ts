// zzfx 官方套件無型別定義，依 ZzFX.js 實際匯出補宣告。
declare module 'zzfx' {
  export function zzfx(...parameters: (number | undefined)[]): AudioBufferSourceNode;

  export const ZZFX: {
    volume: number;
    sampleRate: number;
    audioContext: AudioContext;
    play(...parameters: (number | undefined)[]): AudioBufferSourceNode;
    playSamples(
      sampleChannels: number[][],
      volumeScale?: number,
      rate?: number,
      pan?: number,
      loop?: boolean,
    ): AudioBufferSourceNode;
    buildSamples(...parameters: (number | undefined)[]): number[];
    getNote(semitoneOffset?: number, rootNoteFrequency?: number): number;
  };
}
