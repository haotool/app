/**
 * SoundManager：全部以 WebAudio 程序合成（無音檔）。
 * 發動機（fan 嘯聲 / core 隆隆 / 推力轟鳴 / buzzsaw）、氣流、雨、地面滾動、APU、起落架與襟翼馬達、
 * 開關聲、合成語音 callout、警告鐘聲。外部視角用 HRTF 空間化，座艙內低通悶聲。
 */
import { Vector3 } from 'three';
import { AIRCRAFT } from '../sim/constants';
import { surfaceType } from '../sim/terrain';
import type { SimEvent } from '../sim/types';
import type { FrameContext } from '../render/types';

type Ctx = AudioContext;

interface EngineVoice {
  fanOsc: OscillatorNode;
  fanFilter: BiquadFilterNode;
  fanGain: GainNode;
  whineOsc: OscillatorNode;
  whineGain: GainNode;
  coreFilter: BiquadFilterNode;
  coreGain: GainNode;
  roarFilter: BiquadFilterNode;
  roarGain: GainNode;
  buzzOsc: OscillatorNode;
  buzzGain: GainNode;
  out: GainNode; // 單具發動機總和
  panner: PannerNode;
  extGain: GainNode;
  local: Vector3;
}

const smooth = (p: AudioParam, v: number, t: number, tc = 0.08): void => {
  p.setTargetAtTime(v, t, tc);
};

export class SoundManager {
  private ctx: Ctx | null = null;
  private disposed = false;
  private master!: GainNode;
  private fxBus!: GainNode; // 可被 duck 的環境/機械聲
  private alertBus!: GainNode; // 警告與 callout（不被 duck）
  private cockpitMix!: GainNode;
  private cockpitFilter!: BiquadFilterNode;
  private cockpitGain!: GainNode;
  private noise!: AudioBuffer;
  private readonly engines: EngineVoice[] = [];
  private windFilter!: BiquadFilterNode;
  private windGain!: GainNode;
  private rainGain!: GainNode;
  private rollFilter!: BiquadFilterNode;
  private rollGain!: GainNode;
  private vibOsc!: OscillatorNode;
  private vibGain!: GainNode;
  private apuOsc!: OscillatorNode;
  private apuGain!: GainNode;
  private motorOsc!: OscillatorNode;
  private motorGain!: GainNode;
  private readonly sources: AudioScheduledSourceNode[] = [];

  private volume = 0.8;
  private muted = false;
  private userResumed = false;
  private forcedSuspend = false;
  private inCockpitSm = 1;
  private warnNextChime = 0;
  private duckUntil = 0; // 警告/鐘聲：深度 duck
  private calloutDuckUntil = 0; // callout：淺度 duck
  private thumpDist = 0;
  private voice: SpeechSynthesisVoice | null = null;
  private readonly onVoices = (): void => this.pickVoice();
  private readonly tmp = new Vector3();
  private readonly fwd = new Vector3();
  private readonly up = new Vector3();

  constructor() {
    if (typeof speechSynthesis !== 'undefined') {
      this.pickVoice();
      speechSynthesis.addEventListener('voiceschanged', this.onVoices);
    }
  }

  /** 首次使用者手勢時才建立音訊圖（避免瀏覽器自動播放限制） */
  async resume(): Promise<void> {
    if (this.disposed) return;
    if (!this.ctx) {
      const AC = typeof window !== 'undefined' ? window.AudioContext : undefined;
      if (!AC) return;
      this.ctx = new AC({ latencyHint: 'interactive' });
      this.build(this.ctx);
    }
    this.userResumed = true;
    this.forcedSuspend = false;
    if (this.ctx && this.ctx.state !== 'running') await this.ctx.resume();
  }

  suspend(): void {
    this.forcedSuspend = true;
    if (this.ctx?.state === 'running') this.ctx.suspend().catch(() => undefined);
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
    this.applyMaster();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.applyMaster();
  }

  dispose(): void {
    this.disposed = true;
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        // 已停止
      }
    }
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
      speechSynthesis.removeEventListener('voiceschanged', this.onVoices);
    }
    this.ctx?.close().catch(() => undefined);
  }

  // ---------------------------------------------------------------------------
  // 建圖
  // ---------------------------------------------------------------------------
  private build(ctx: Ctx): void {
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);
    this.fxBus = ctx.createGain();
    this.fxBus.connect(this.master);
    this.alertBus = ctx.createGain();
    this.alertBus.gain.value = 0.9;
    this.alertBus.connect(this.master);
    this.applyMaster();

    // 座艙路徑：發動機總和經低通 → 悶聲
    this.cockpitMix = ctx.createGain();
    this.cockpitFilter = ctx.createBiquadFilter();
    this.cockpitFilter.type = 'lowpass';
    this.cockpitFilter.frequency.value = 650;
    this.cockpitGain = ctx.createGain();
    this.cockpitMix.connect(this.cockpitFilter).connect(this.cockpitGain).connect(this.fxBus);

    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b = 0.97 * b + 0.03 * w; // 混入少量粉紅成分
      data[i] = w * 0.7 + b * 2;
    }

    for (const side of [-1, 1]) this.engines.push(this.buildEngine(ctx, side));

    // 氣流
    const windSrc = this.noiseSource(ctx);
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.Q.value = 0.6;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    windSrc.connect(this.windFilter).connect(this.windGain).connect(this.fxBus);

    // 雨打玻璃
    const rainSrc = this.noiseSource(ctx);
    const rainHp = ctx.createBiquadFilter();
    rainHp.type = 'highpass';
    rainHp.frequency.value = 2200;
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    rainSrc.connect(rainHp).connect(this.rainGain).connect(this.fxBus);

    // 地面滾動
    const rollSrc = this.noiseSource(ctx);
    this.rollFilter = ctx.createBiquadFilter();
    this.rollFilter.type = 'lowpass';
    this.rollFilter.frequency.value = 120;
    this.rollGain = ctx.createGain();
    this.rollGain.gain.value = 0;
    rollSrc.connect(this.rollFilter).connect(this.rollGain).connect(this.fxBus);

    // 機身低頻震動（座艙）
    this.vibOsc = ctx.createOscillator();
    this.vibOsc.frequency.value = 32;
    this.vibGain = ctx.createGain();
    this.vibGain.gain.value = 0;
    this.vibOsc.connect(this.vibGain).connect(this.fxBus);
    this.start(this.vibOsc);

    // APU
    this.apuOsc = ctx.createOscillator();
    this.apuOsc.type = 'sawtooth';
    const apuBp = ctx.createBiquadFilter();
    apuBp.type = 'bandpass';
    apuBp.frequency.value = 900;
    apuBp.Q.value = 2;
    this.apuGain = ctx.createGain();
    this.apuGain.gain.value = 0;
    this.apuOsc.connect(apuBp).connect(this.apuGain).connect(this.fxBus);
    this.start(this.apuOsc);

    // 液壓馬達（起落架/襟翼作動）
    this.motorOsc = ctx.createOscillator();
    this.motorOsc.type = 'sawtooth';
    this.motorOsc.frequency.value = 190;
    const motorLp = ctx.createBiquadFilter();
    motorLp.type = 'lowpass';
    motorLp.frequency.value = 700;
    this.motorGain = ctx.createGain();
    this.motorGain.gain.value = 0;
    this.motorOsc.connect(motorLp).connect(this.motorGain).connect(this.fxBus);
    this.start(this.motorOsc);
  }

  private buildEngine(ctx: Ctx, side: number): EngineVoice {
    const out = ctx.createGain();
    const fanOsc = ctx.createOscillator();
    fanOsc.type = 'sawtooth';
    const fanFilter = ctx.createBiquadFilter();
    fanFilter.type = 'bandpass';
    fanFilter.Q.value = 3;
    const fanGain = ctx.createGain();
    fanGain.gain.value = 0;
    fanOsc.connect(fanFilter).connect(fanGain).connect(out);

    const whineOsc = ctx.createOscillator();
    const whineGain = ctx.createGain();
    whineGain.gain.value = 0;
    whineOsc.connect(whineGain).connect(out);

    const coreSrc = this.noiseSource(ctx);
    const coreFilter = ctx.createBiquadFilter();
    coreFilter.type = 'lowpass';
    const coreGain = ctx.createGain();
    coreGain.gain.value = 0;
    coreSrc.connect(coreFilter).connect(coreGain).connect(out);

    const roarSrc = this.noiseSource(ctx);
    const roarFilter = ctx.createBiquadFilter();
    roarFilter.type = 'bandpass';
    roarFilter.Q.value = 0.7;
    const roarGain = ctx.createGain();
    roarGain.gain.value = 0;
    roarSrc.connect(roarFilter).connect(roarGain).connect(out);

    const buzzOsc = ctx.createOscillator();
    buzzOsc.type = 'sawtooth';
    const buzzLp = ctx.createBiquadFilter();
    buzzLp.type = 'lowpass';
    buzzLp.frequency.value = 1800;
    const buzzGain = ctx.createGain();
    buzzGain.gain.value = 0;
    buzzOsc.connect(buzzLp).connect(buzzGain);

    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 15;
    panner.rolloffFactor = 0.7;
    panner.maxDistance = 20000;
    const extGain = ctx.createGain();
    out.connect(panner);
    buzzGain.connect(panner); // buzzsaw 只在外部
    panner.connect(extGain).connect(this.fxBus);
    out.connect(this.cockpitMix);

    for (const o of [fanOsc, whineOsc, buzzOsc]) this.start(o);
    return {
      fanOsc,
      fanFilter,
      fanGain,
      whineOsc,
      whineGain,
      coreFilter,
      coreGain,
      roarFilter,
      roarGain,
      buzzOsc,
      buzzGain,
      out,
      panner,
      extGain,
      local: new Vector3(
        side * AIRCRAFT.engine.x,
        AIRCRAFT.engine.y,
        AIRCRAFT.engine.inletZ + AIRCRAFT.engine.length,
      ),
    };
  }

  private noiseSource(ctx: Ctx): AudioBufferSourceNode {
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    s.loopStart = Math.random();
    this.start(s);
    return s;
  }

  private start(s: AudioScheduledSourceNode): void {
    s.start();
    this.sources.push(s);
  }

  private applyMaster(): void {
    if (!this.ctx) return;
    smooth(this.master.gain, this.muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
  }

  // ---------------------------------------------------------------------------
  // 每幀更新
  // ---------------------------------------------------------------------------
  update(frame: FrameContext, inCockpit: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const s = frame.state;
    if (s.meta.paused) {
      if (ctx.state === 'running') ctx.suspend().catch(() => undefined);
      return;
    }
    if (this.userResumed && !this.forcedSuspend && ctx.state === 'suspended')
      ctx.resume().catch(() => undefined);
    if (ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const dt = Math.min(frame.dt, 0.1);

    this.inCockpitSm += ((inCockpit ? 1 : 0) - this.inCockpitSm) * (1 - Math.exp(-dt * 8));
    const cp = this.inCockpitSm;
    const ext = 1 - cp;

    // 聽者 = 攝影機
    const cam = frame.camera;
    const L = ctx.listener;
    this.fwd.set(0, 0, -1).applyQuaternion(cam.quaternion);
    this.up.set(0, 1, 0).applyQuaternion(cam.quaternion);
    if (L.positionX) {
      L.positionX.value = cam.position.x;
      L.positionY.value = cam.position.y;
      L.positionZ.value = cam.position.z;
      L.forwardX.value = this.fwd.x;
      L.forwardY.value = this.fwd.y;
      L.forwardZ.value = this.fwd.z;
      L.upX.value = this.up.x;
      L.upY.value = this.up.y;
      L.upZ.value = this.up.z;
    }

    // 發動機
    let n1Avg = 0;
    for (let i = 0; i < 2; i++) {
      const e = s.engines[i];
      const v = this.engines[i];
      const n1 = e.n1 / 100;
      const n2 = e.n2 / 100;
      const thr = Math.min(1.2, Math.abs(e.thrust) / 120000);
      n1Avg += n1 / 2;
      smooth(v.fanOsc.frequency, 30 + e.n1 * 17, t);
      smooth(v.fanFilter.frequency, 60 + e.n1 * 17, t);
      smooth(v.fanGain.gain, n1 * n1 * 0.08, t);
      smooth(v.whineOsc.frequency, 200 + e.n2 * 55, t);
      smooth(v.whineGain.gain, n2 * 0.012 * (0.4 + ext), t);
      smooth(v.coreFilter.frequency, 80 + e.n2 * 4, t);
      smooth(v.coreGain.gain, n2 * 0.25, t);
      smooth(v.roarFilter.frequency, 300 + thr * 900 + e.reverser * 400, t);
      smooth(v.roarGain.gain, Math.pow(thr, 1.5) * (0.35 + e.reverser * 0.4), t);
      smooth(v.buzzOsc.frequency, Math.max(20, e.n1 * 0.97 * 2), t);
      smooth(v.buzzGain.gain, e.n1 > 82 ? ((e.n1 - 82) / 18) * 0.05 : 0, t);
      smooth(v.extGain.gain, ext, t);
      this.tmp.copy(v.local).applyQuaternion(frame.pose.quaternion).add(frame.pose.position);
      v.panner.positionX.value = this.tmp.x;
      v.panner.positionY.value = this.tmp.y;
      v.panner.positionZ.value = this.tmp.z;
    }
    smooth(this.cockpitGain.gain, cp * 0.45, t);

    // 氣流（起落架、擾流板、襟翼增量）
    const ias = s.flight.ias;
    const gearOut = (s.gear.position[0] + s.gear.position[1] + s.gear.position[2]) / 3;
    const spoil = s.controls.spoilersL.reduce((a, b) => a + b, 0) / 250;
    const flaps = s.controls.flapsAngle / 40;
    const air = Math.min(1.5, (ias / 300) ** 2) * (1 + gearOut * 0.6 + spoil * 0.6 + flaps * 0.25);
    smooth(this.windFilter.frequency, 250 + ias * 4, t);
    smooth(this.windGain.gain, air * (cp * 0.28 + ext * 0.16), t, 0.15);

    // 雨
    smooth(
      this.rainGain.gain,
      s.weather.precipitation * (cp * 0.22 + ext * 0.08) * (1 + Math.min(1, ias / 150)),
      t,
      0.2,
    );

    // 地面滾動與跑道中心線燈 thump
    const gsMs = s.flight.gs * 0.514444;
    const onGround = s.flight.onGround;
    smooth(this.rollFilter.frequency, 90 + s.flight.gs * 1.5, t);
    smooth(
      this.rollGain.gain,
      onGround ? Math.min(1, s.flight.gs / 80) * (cp * 0.4 + ext * 0.25) : 0,
      t,
    );
    if (
      onGround &&
      gsMs > 3 &&
      surfaceType(frame.pose.position.x, frame.pose.position.z) === 'runway'
    ) {
      this.thumpDist += gsMs * dt;
      if (this.thumpDist > 15) {
        this.thumpDist -= 15;
        this.thump(70, 0.06, 0.18 * cp + 0.05);
      }
    }

    // 座艙震動
    smooth(
      this.vibGain.gain,
      cp * (n1Avg * 0.06 + (onGround ? Math.min(0.08, s.flight.gs / 1500) : 0)),
      t,
    );

    // APU
    const apuN = s.apu.n / 100;
    smooth(this.apuOsc.frequency, 60 + apuN * 380, t, 0.3);
    smooth(this.apuGain.gain, apuN * (cp * 0.02 + ext * 0.06), t, 0.3);

    // 起落架/襟翼液壓馬達
    const gearMoving = s.gear.position.some((p) => p > 0.01 && p < 0.99);
    const flapMoving =
      Math.abs(s.controls.flapsAngle - s.controls.flapsTarget) > 0.1 ||
      Math.abs(s.controls.slatsAngle - s.controls.slatsTarget) > 0.1;
    smooth(this.motorOsc.frequency, gearMoving ? 180 : 230, t);
    smooth(this.motorGain.gain, (gearMoving ? 0.05 : 0) + (flapMoving ? 0.025 : 0), t, 0.2);

    // 主警告：連續重複鐘聲直到解除
    if (s.warnings.masterWarning) {
      if (t >= this.warnNextChime) {
        this.crcChime(t);
        this.warnNextChime = t + 0.62;
      }
      this.duckUntil = t + 0.4;
    }
    smooth(
      this.fxBus.gain,
      t < this.duckUntil ? 0.45 : t < this.calloutDuckUntil ? 0.75 : 1,
      t,
      0.1,
    );
  }

  // ---------------------------------------------------------------------------
  // 事件
  // ---------------------------------------------------------------------------
  onSimEvent(e: SimEvent): void {
    const ctx = this.ctx;
    if (ctx?.state !== 'running') {
      if (e.type === 'CALLOUT' || e.type === 'V1') this.speak(e.type === 'V1' ? 'V one' : e.text);
      return;
    }
    const t = ctx.currentTime;
    switch (e.type) {
      case 'CLICK':
        this.click(e.kind);
        break;
      case 'CALLOUT':
        this.speak(e.text);
        break;
      case 'V1':
        this.speak('V one');
        break;
      case 'MASTER_CAUTION':
        if (e.on) this.singleChime(t);
        break;
      case 'AP_DISCONNECT':
        this.cavalryCharge(t);
        break;
      case 'ATHR_DISCONNECT':
        for (let i = 0; i < 3; i++) this.tone(t + i * 0.18, 1450, 0.09, 0.14, 'square');
        break;
      case 'CHIME':
        this.tone(t, 950, 1.2, 0.18, 'sine');
        this.tone(t + 0.55, 740, 1.4, 0.18, 'sine');
        break;
      case 'TOUCHDOWN': {
        const k = Math.min(1.5, Math.abs(e.vs) / 300 + 0.3);
        this.thump(55, 0.35, 0.5 * k);
        this.burst(t, 'bandpass', 2600, 0.45, 0.22 * k);
        break;
      }
      case 'GEAR_LOCKED':
        this.thump(55, 0.15, 0.35);
        this.burst(t, 'lowpass', 300, 0.12, 0.25);
        break;
      case 'GEAR_LEVER':
        this.burst(t, 'lowpass', 500, 0.08, 0.15);
        break;
      case 'REVERSE':
        if (e.deployed) this.burst(t, 'lowpass', 400, 0.3, 0.2);
        break;
      case 'GROUND_SPOILERS':
        if (e.deployed) this.burst(t, 'bandpass', 900, 0.25, 0.12);
        break;
      default:
        break;
    }
  }

  private click(kind: Extract<SimEvent, { type: 'CLICK' }>['kind']): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    switch (kind) {
      case 'button':
        this.burst(t, 'bandpass', 1500, 0.012, 0.25);
        break;
      case 'switch':
        this.burst(t, 'highpass', 2500, 0.01, 0.3);
        this.burst(t + 0.025, 'bandpass', 1800, 0.01, 0.2);
        break;
      case 'knob':
        this.burst(t, 'highpass', 3200, 0.005, 0.18);
        break;
      case 'lever':
        this.thump(110, 0.08, 0.2);
        this.burst(t, 'lowpass', 700, 0.04, 0.2);
        break;
      case 'detent':
        this.thump(90, 0.05, 0.22);
        break;
      case 'key':
        this.burst(t, 'bandpass', 2200, 0.008, 0.15);
        break;
      case 'guard':
        this.burst(t, 'highpass', 1800, 0.02, 0.3);
        break;
    }
  }

  /** 短噪聲爆發（開關、撞擊、胎噪） */
  private burst(t: number, type: BiquadFilterType, freq: number, dur: number, gain: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.fxBus);
    src.start(t, Math.random());
    src.stop(t + dur + 0.02);
  }

  private thump(freq: number, dur: number, gain: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(freq * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.fxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private tone(t: number, freq: number, dur: number, gain: number, type: OscillatorType): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.alertBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** 連續重複鐘聲（CRC）單次 */
  private crcChime(t: number): void {
    this.tone(t, 1320, 0.45, 0.16, 'triangle');
    this.tone(t, 1760, 0.45, 0.09, 'sine');
  }

  private singleChime(t: number): void {
    this.tone(t, 1100, 0.9, 0.18, 'sine');
    this.tone(t, 2200, 0.5, 0.05, 'sine');
    this.duckUntil = t + 0.6;
  }

  /** AP 解除 cavalry charge（約 1.5 s） */
  private cavalryCharge(t: number): void {
    const notes = [784, 988, 1175, 1568];
    for (let r = 0; r < 2; r++) {
      notes.forEach((f, i) => this.tone(t + r * 0.75 + i * 0.13, f, 0.22, 0.13, 'triangle'));
    }
    this.duckUntil = t + 1.6;
  }

  private pickVoice(): void {
    if (typeof speechSynthesis === 'undefined') return;
    const voices = speechSynthesis.getVoices();
    this.voice =
      voices.find(
        (v) => v.lang === 'en-US' && /Alex|Daniel|Fred|Google US English|Male/i.test(v.name),
      ) ??
      voices.find((v) => v.lang.startsWith('en')) ??
      null;
  }

  /** 合成語音 callout；不可用時退化為音調 */
  private speak(text: string): void {
    if (this.muted) return;
    if (typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined') {
      speechSynthesis.cancel(); // 保持即時性，新 callout 取代舊的
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 1.15;
      u.pitch = 0.6;
      u.volume = this.volume;
      if (this.voice) u.voice = this.voice;
      speechSynthesis.speak(u);
    } else if (this.ctx?.state === 'running') {
      this.tone(this.ctx.currentTime, 900, 0.14, 0.15, 'square');
    }
    if (this.ctx) this.calloutDuckUntil = this.ctx.currentTime + 0.8;
  }
}
