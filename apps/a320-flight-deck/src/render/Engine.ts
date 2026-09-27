/**
 * 渲染引擎：組裝所有渲染模組，每幀以物理步插值姿態渲染；含 RenderScaleManager（動態解析度/畫質降級）、
 * Bloom 後製、Shader 預編譯、背景暫停、WebGL Context 遺失復原、重播。
 */
import {
  ACESFilmicToneMapping,
  Color,
  HalfFloatType,
  PCFShadowMap,
  PerspectiveCamera,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SoundManager } from '../audio/SoundManager';
import { AIRCRAFT } from '../sim/constants';
import { cloneState } from '../sim/replay';
import type { Simulation } from '../sim/simulation';
import type { DuId, SimState } from '../sim/types';
import { AircraftModel } from './aircraft/AircraftModel';
import { CameraDirector } from './camera/CameraDirector';
import { Cockpit } from './cockpit';
import { Displays } from './displays/Displays';
import { Environment } from './environment/Environment';
import {
  QUALITY_PRESETS,
  type FrameContext,
  type QualityLevel,
  type QualitySettings,
} from './types';
import { AirportWorld } from './world/airport';
import { CityWorld } from './world/city';

export type LoadStage = 'systems' | 'deck' | 'avionics' | 'airport' | 'shaders' | 'ready';

export interface PerfStats {
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  programs: number;
  renderScale: number;
  quality: QualityLevel;
  physicsSteps: number;
}

const DUS: DuId[] = ['pfd1', 'nd1', 'ewd', 'sd', 'nd2', 'pfd2', 'mcdu1', 'mcdu2', 'isis'];
const nextFrame = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

export function detectQuality(): QualityLevel {
  // URL 覆寫（?quality=LOW）：低階裝置與自動化測試
  const forced = new URLSearchParams(window.location.search).get('quality')?.toUpperCase();
  if (forced === 'ULTRA' || forced === 'HIGH' || forced === 'MEDIUM' || forced === 'LOW')
    return forced;
  const mobile =
    /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ||
    Math.min(window.innerWidth, window.innerHeight) < 600;
  const cores = navigator.hardwareConcurrency || 4;
  if (mobile) return cores >= 8 ? 'MEDIUM' : 'LOW';
  return cores >= 12 ? 'ULTRA' : 'HIGH';
}

export class Engine {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(58, 1, 0.03, 120000);
  env!: Environment;
  aircraft!: AircraftModel;
  cockpit!: Cockpit;
  displays!: Displays;
  airport!: AirportWorld;
  city!: CityWorld;
  readonly director: CameraDirector;
  readonly sound = new SoundManager();
  quality: QualitySettings;
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  cockpitMode = false;
  contextLost = false;
  /** 重播 */
  replay: { active: boolean; t: number; speed: number; state: SimState | null } = {
    active: false,
    t: 0,
    speed: 1,
    state: null,
  };
  readonly stats: PerfStats;
  onTick: (() => void) | null = null;
  onBeforeFrame: ((dt: number) => void) | null = null;

  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private readonly pose = { position: new Vector3(), quaternion: new Quaternion() };
  private readonly frame: FrameContext;
  private readonly eyeWorld = new Vector3();
  private last = performance.now();
  private hidden = false;
  private frameTimes: number[] = [];
  private slowTime = 0;
  private fastTime = 0;
  private statTimer = 0;
  private frames = 0;
  private stepCountAt = 0;
  private running = false;
  private readonly resizeObs: ResizeObserver;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly sim: Simulation,
    level: QualityLevel,
  ) {
    this.quality = { ...QUALITY_PRESETS[level] };
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: this.quality.msaa === 0,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,
      stencil: false,
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
    this.renderer.debug.checkShaderErrors = import.meta.env.DEV;
    // 多 pass 後製：手動重置統計才能累計整幀 draw calls
    this.renderer.info.autoReset = false;
    this.director = new CameraDirector(this.camera);
    this.director.setReducedMotion(this.reducedMotion);
    this.stats = {
      fps: 0,
      frameMs: 0,
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      programs: 0,
      renderScale: this.quality.renderScale,
      quality: level,
      physicsSteps: 0,
    };
    this.frame = {
      state: sim.state,
      dt: 0,
      time: 0,
      camera: this.camera,
      pose: this.pose,
      // Environment 建構後替換為其即時 lighting
      lighting: {
        sunDirection: new Vector3(0, 1, 0),
        sunColor: new Color(),
        sunIntensity: 3,
        ambientIntensity: 0.5,
        night: 0,
        dusk: 0,
        fogColor: new Color(),
        skyHorizonColor: new Color(),
      },
      quality: this.quality,
      cameraInCockpit: true,
      reducedMotion: this.reducedMotion,
    };
    canvas.addEventListener('webglcontextlost', this.onContextLost, false);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored, false);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(canvas);
    window.visualViewport?.addEventListener('resize', this.resize);
    sim.on((e) => {
      this.director.onSimEvent(e);
      this.sound.onSimEvent(e);
    });
  }

  /** 分階段建構（載入畫面依實際進度顯示） */
  async build(onStage: (s: LoadStage) => void): Promise<void> {
    const q = this.quality;
    onStage('systems');
    await nextFrame();
    this.env = new Environment(this.scene, this.renderer, q);
    this.frame.lighting = this.env.lighting;
    onStage('deck');
    await nextFrame();
    this.aircraft = new AircraftModel(q);
    this.scene.add(this.aircraft.root);
    this.cockpit = new Cockpit(this.sim, q);
    this.aircraft.root.add(this.cockpit.group);
    onStage('avionics');
    await nextFrame();
    this.displays = new Displays(this.renderer);
    for (const du of DUS) this.cockpit.setDisplayTexture(du, this.displays.textures[du]);
    onStage('airport');
    await nextFrame();
    this.airport = new AirportWorld(this.scene, q);
    this.city = new CityWorld(this.scene, q);
    this.setupComposer();
    this.resize();
    onStage('shaders');
    await nextFrame();
    // 先跑一幀讓所有動態物件就位，再預編譯（避免第一次看到跑道才卡頓）
    this.renderFrame(0);
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch (err) {
      console.warn('Shader 預編譯失敗，改為首幀編譯', err);
    }
    onStage('ready');
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.renderer.setAnimationLoop(this.loop);
  }

  private setupComposer(): void {
    this.composer?.dispose();
    this.composer = null;
    this.bloom = null;
    if (!this.quality.bloom) return;
    const size = this.renderer.getDrawingBufferSize(new Vector2());
    const rt = new WebGLRenderTarget(Math.max(1, size.x), Math.max(1, size.y), {
      type: HalfFloatType,
      samples: this.quality.msaa,
    });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new Vector2(size.x, size.y), 0.35, 0.4, 3.2);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  readonly resize = (): void => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const maxDpr = this.quality.level === 'ULTRA' ? 2 : this.quality.level === 'HIGH' ? 1.75 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * this.quality.renderScale;
    this.renderer.setPixelRatio(Math.max(0.5, dpr));
    this.renderer.setSize(w, h, false);
    this.composer?.setPixelRatio(Math.max(0.5, dpr));
    this.composer?.setSize(w, h);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  };

  setQualityLevel(level: QualityLevel): void {
    this.quality = { ...QUALITY_PRESETS[level] };
    this.frame.quality = this.quality;
    this.stats.quality = level;
    this.env.setQuality(this.quality);
    this.aircraft.setQuality(this.quality);
    this.cockpit.setQuality(this.quality);
    this.airport.setQuality(this.quality);
    this.city.setQuality(this.quality);
    this.setupComposer();
    this.resize();
  }

  setReducedMotion(v: boolean): void {
    this.reducedMotion = v;
    this.frame.reducedMotion = v;
    this.director.setReducedMotion(v);
  }

  setCockpitMode(v: boolean): void {
    this.cockpitMode = v;
  }

  setKnobSelectHandler(fn: ((id: string | null) => void) | null): void {
    this.cockpit.interaction.onKnobSelect = fn;
  }

  setReplayTime(t: number): void {
    this.replay.t = t;
  }

  setReplaySpeed(v: number): void {
    this.replay.speed = v;
  }

  // ------------------------------------------------------------------ 重播
  startReplay(): void {
    const dur = this.sim.replay.duration;
    if (dur < 5) return;
    this.replay = {
      active: true,
      t: Math.max(0, dur - 60),
      speed: 1,
      state: cloneState(this.sim.state),
    };
    this.sim.setPaused(true);
    if (this.director.inCockpit) this.director.setMode('CINEMATIC_AUTO');
  }

  stopReplay(): void {
    this.replay = { active: false, t: 0, speed: 1, state: null };
    this.sim.setPaused(false);
  }

  // ------------------------------------------------------------------ 迴圈
  private readonly loop = (): void => {
    const now = performance.now();
    const dt = Math.min(0.25, (now - this.last) / 1000);
    this.last = now;
    if (this.hidden || this.contextLost) return;
    this.onBeforeFrame?.(dt);
    this.renderFrame(dt);
    this.adaptQuality(dt);
    this.onTick?.();
  };

  private renderFrame(dt: number): void {
    const sim = this.sim;
    let state = sim.state;
    if (this.replay.active && this.replay.state) {
      this.replay.t = Math.min(this.sim.replay.duration, this.replay.t + dt * this.replay.speed);
      sim.replay.sample(this.replay.t, this.replay.state, this.pose.position, this.pose.quaternion);
      state = this.replay.state;
    } else {
      const alpha = sim.advance(dt);
      this.pose.position.lerpVectors(sim.prevPos, state.aircraft.position, alpha);
      this.pose.quaternion.slerpQuaternions(sim.prevQuat, state.aircraft.quaternion, alpha);
    }
    const f = this.frame;
    f.state = state;
    f.dt = dt;
    f.time += dt;
    f.cameraInCockpit = this.director.inCockpit;
    this.cockpit.interaction.enabled =
      this.cockpitMode && this.director.inCockpit && !this.replay.active;
    // 順序：飛機姿態 → 攝影機 → 環境（陰影焦點）→ 其他
    this.aircraft.update(f);
    this.director.update(f);
    f.cameraInCockpit = this.director.inCockpit;
    if (this.director.inCockpit) {
      this.eyeWorld
        .set(AIRCRAFT.eyeCaptain.x, AIRCRAFT.eyeCaptain.y - 0.3, AIRCRAFT.eyeCaptain.z - 0.6)
        .applyQuaternion(this.pose.quaternion)
        .add(this.pose.position);
      this.env.setShadowFocus(this.eyeWorld, 6);
    } else {
      this.env.setShadowFocus(this.pose.position, 45);
    }
    this.env.update(f);
    this.airport.update(f);
    this.city.update(f);
    this.cockpit.update(f);
    this.displays.update(f);
    this.sound.update(f, this.director.inCockpit);
    this.renderer.info.reset();
    if (this.composer) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
  }

  /** RenderScaleManager：持續低 FPS 先降解析度、再降畫質；持續高 FPS 回升 */
  private adaptQuality(dt: number): void {
    this.frameTimes.push(dt);
    if (this.frameTimes.length > 90) this.frameTimes.shift();
    this.frames++;
    this.statTimer += dt;
    if (this.statTimer >= 0.5) {
      const info = this.renderer.info;
      this.stats.fps = this.frames / this.statTimer;
      this.stats.frameMs = (this.statTimer / this.frames) * 1000;
      this.stats.drawCalls = info.render.calls;
      this.stats.triangles = info.render.triangles;
      this.stats.textures = info.memory.textures;
      this.stats.programs = info.programs?.length ?? 0;
      this.stats.renderScale = this.quality.renderScale;
      const steps = this.sim.state.meta.stepCount;
      this.stats.physicsSteps = Math.max(0, steps - this.stepCountAt) / this.statTimer;
      this.stepCountAt = steps;
      this.frames = 0;
      this.statTimer = 0;
    }
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const fps = 1 / Math.max(avg, 1e-3);
    if (fps < 42) {
      this.slowTime += dt;
      this.fastTime = 0;
    } else if (fps > 58) {
      this.fastTime += dt;
      this.slowTime = 0;
    } else {
      this.slowTime = 0;
      this.fastTime = 0;
    }
    if (this.slowTime > 3) {
      this.slowTime = 0;
      this.frameTimes = [];
      if (this.quality.renderScale > 0.6) {
        this.quality.renderScale = Math.round((this.quality.renderScale - 0.1) * 100) / 100;
        this.resize();
      } else {
        const order: QualityLevel[] = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW'];
        const i = order.indexOf(this.quality.level);
        if (i < order.length - 1) this.setQualityLevel(order[i + 1]);
      }
    } else if (
      this.fastTime > 8 &&
      this.quality.renderScale < QUALITY_PRESETS[this.quality.level].renderScale
    ) {
      this.fastTime = 0;
      this.quality.renderScale = Math.min(
        QUALITY_PRESETS[this.quality.level].renderScale,
        this.quality.renderScale + 0.1,
      );
      this.resize();
    }
  }

  // ------------------------------------------------------------------ 生命週期事件
  private readonly onVisibility = (): void => {
    this.hidden = document.visibilityState === 'hidden';
    if (this.hidden) this.sound.suspend();
    else {
      this.sim.resetAccumulator();
      this.last = performance.now();
    }
  };

  private readonly onContextLost = (e: Event): void => {
    e.preventDefault();
    this.contextLost = true;
    this.sim.setPaused(true);
    this.sound.suspend();
    this.onTick?.();
  };

  private readonly onContextRestored = (): void => {
    this.contextLost = false;
    this.setupComposer();
    this.resize();
    this.sim.resetAccumulator();
    this.sim.setPaused(false);
    this.onTick?.();
  };

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    this.resizeObs.disconnect();
    window.visualViewport?.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.env.dispose();
    this.aircraft.dispose();
    this.cockpit.dispose();
    this.displays.dispose();
    this.airport.dispose();
    this.city.dispose();
    this.sound.dispose();
    this.composer?.dispose();
    this.renderer.dispose();
  }
}
