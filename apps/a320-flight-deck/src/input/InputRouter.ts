/**
 * InputRouter：輸入優先序 = 座艙控制拖曳 > 滑鼠飛行（FLY MODE 左鍵）> 攝影機環視（右鍵/觸控）。
 * 鍵盤飛行、側桿平滑回中、手機觸控與傾斜控制（需使用者授權）都寫入 Simulation.user。
 */
import { TLA } from '../sim/constants';
import type { Engine } from '../render/Engine';

export interface MouseFlightView {
  active: boolean;
  cx: number;
  cy: number;
  x: number; // -1..1
  y: number;
}

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const approach = (v: number, t: number, r: number): number =>
  v < t ? Math.min(t, v + r) : Math.max(t, v - r);

export class InputRouter {
  readonly mouse: MouseFlightView = { active: false, cx: 0, cy: 0, x: 0, y: 0 };
  /** 手機虛擬搖桿 / 傾斜輸入（-1..1） */
  readonly touch = { active: false, pitch: 0, roll: 0, rudder: 0, brake: 0 };
  tiltEnabled = false;
  private tilt = { pitch: 0, roll: 0, zeroBeta: 0, zeroGamma: 0, calibrated: false };
  private readonly keys = new Set<string>();
  private kb = { pitch: 0, roll: 0, rudder: 0 };
  private pointerMode: 'none' | 'cockpit' | 'fly' | 'look' = 'none';
  private lastX = 0;
  private lastY = 0;
  private pinchDist = 0;
  private readonly pointers = new Map<number, { x: number; y: number }>();
  onToggleCockpit: (() => void) | null = null;
  onCycleCamera: (() => void) | null = null;
  onTogglePause: (() => void) | null = null;
  onToggleHud: (() => void) | null = null;
  onToggleDev: (() => void) | null = null;

  constructor(private readonly engine: Engine) {
    const c = engine.canvas;
    c.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    c.addEventListener('wheel', this.onWheel, { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', () => this.keys.clear());
  }

  private ndc(e: { clientX: number; clientY: number }): [number, number] {
    const r = this.engine.canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1];
  }

  private readonly onDown = (e: PointerEvent): void => {
    const eng = this.engine;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      return;
    }
    void eng.sound.resume();
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    const [nx, ny] = this.ndc(e);
    const inter = eng.cockpit.interaction;
    if (
      inter.enabled &&
      inter.pointerDown(nx, ny, eng.camera, e.button, e.shiftKey, e.pointerType)
    ) {
      this.pointerMode = 'cockpit';
      eng.canvas.setPointerCapture(e.pointerId);
      return;
    }
    if (e.button === 0 && !eng.cockpitMode && e.pointerType === 'mouse' && !eng.replay.active) {
      this.pointerMode = 'fly';
      this.mouse.active = true;
      this.mouse.cx = e.clientX;
      this.mouse.cy = e.clientY;
      this.mouse.x = 0;
      this.mouse.y = 0;
      return;
    }
    this.pointerMode = 'look';
  };

  private readonly onMove = (e: PointerEvent): void => {
    const eng = this.engine;
    if (this.pointers.has(e.pointerId))
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 2 && this.pointerMode !== 'cockpit') {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      eng.director.zoom((this.pinchDist - d) * 0.01);
      this.pinchDist = d;
      return;
    }
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    const [nx, ny] = this.ndc(e);
    switch (this.pointerMode) {
      case 'cockpit':
        eng.cockpit.interaction.pointerMove(nx, ny, eng.camera, dx, dy);
        return;
      case 'fly': {
        const range = Math.min(window.innerWidth, window.innerHeight) * 0.22;
        this.mouse.x = clamp((e.clientX - this.mouse.cx) / range, -1, 1);
        this.mouse.y = clamp((e.clientY - this.mouse.cy) / range, -1, 1);
        return;
      }
      case 'look':
        eng.director.look(dx, dy);
        return;
      default:
        // 懸停：座艙控制提示
        if (eng.cockpit.interaction.enabled && e.pointerType === 'mouse')
          eng.cockpit.interaction.pointerMove(nx, ny, eng.camera, 0, 0);
    }
  };

  private readonly onUp = (e: PointerEvent): void => {
    this.pointers.delete(e.pointerId);
    if (this.pointerMode === 'cockpit') this.engine.cockpit.interaction.pointerUp();
    if (this.pointerMode === 'fly') {
      this.mouse.active = false;
      this.mouse.x = 0;
      this.mouse.y = 0;
    }
    if (this.pointers.size === 0) this.pointerMode = 'none';
  };

  private readonly onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const eng = this.engine;
    const [nx, ny] = this.ndc(e);
    if (
      eng.cockpit.interaction.enabled &&
      eng.cockpit.interaction.wheel(nx, ny, eng.camera, e.deltaY)
    )
      return;
    eng.director.zoom(e.deltaY * 0.002);
  };

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    const k = e.key.toLowerCase();
    if (e.repeat && ['c', 'v', 'g', 'p', 'b', '[', ']', 'z', 'x', 'h', 'f3', 't', '/'].includes(k))
      return;
    const sim = this.engine.sim;
    const s = sim.state;
    this.keys.add(k);
    const tla = (d: number): void => {
      for (const id of ['thr.lever1', 'thr.lever2']) {
        const e2 = s.engines[id === 'thr.lever1' ? 0 : 1];
        let v = e2.tla + d;
        if (v < TLA.IDLE && e2.tla >= TLA.IDLE && !s.flight.onGround) v = TLA.IDLE;
        sim.command({ type: 'set', id, value: v });
      }
    };
    switch (k) {
      case 'c':
        this.onToggleCockpit?.();
        break;
      case 'v':
        this.onCycleCamera?.();
        break;
      case 'p':
        this.onTogglePause?.();
        break;
      case 'h':
        this.onToggleHud?.();
        break;
      case 'f3':
        e.preventDefault();
        this.onToggleDev?.();
        break;
      case 'g':
        sim.command({ type: 'press', id: 'gear.lever' });
        break;
      case 'b':
        sim.command({ type: 'press', id: 'pbrk' });
        break;
      case '[':
        sim.command({ type: 'rotate', id: 'flaps', delta: -1 });
        break;
      case ']':
        sim.command({ type: 'rotate', id: 'flaps', delta: 1 });
        break;
      case '/':
        if (s.controls.speedbrakeHandle > 0.05)
          sim.command({ type: 'set', id: 'spdbrk', value: 0 });
        else if (s.flight.onGround || e.shiftKey) sim.command({ type: 'press', id: 'spdbrk' });
        else sim.command({ type: 'set', id: 'spdbrk', value: 0.5 });
        break;
      case 'z':
        sim.command({
          type: 'press',
          id: s.afs.ap1 || s.afs.ap2 ? 'sidestick1.apdisc' : 'fcu.ap1',
        });
        break;
      case 'x':
        sim.command({ type: 'press', id: 'fcu.athr' });
        break;
      case 't':
        tla(TLA.TOGA);
        break;
      case 'r':
        tla(e.shiftKey ? 5 : 1.2);
        break;
      case 'f':
        tla(e.shiftKey ? -5 : -1.2);
        break;
      case 'backspace':
        if (s.flight.onGround)
          for (const id of ['thr.lever1', 'thr.lever2'])
            sim.command({ type: 'set', id, value: TLA.MAX_REV });
        break;
      default:
        return;
    }
    if (k !== 'f3') e.preventDefault();
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
  };

  private has(...k: string[]): boolean {
    return k.some((x) => this.keys.has(x));
  }

  setTouchStick(active: boolean, pitch: number, roll: number): void {
    this.touch.active = active;
    this.touch.pitch = pitch;
    this.touch.roll = roll;
  }

  setTouchRudder(v: number): void {
    this.touch.rudder = v;
  }

  setTouchBrake(v: number): void {
    this.touch.brake = v;
  }

  setHandlers(
    h: Partial<
      Pick<
        InputRouter,
        'onToggleCockpit' | 'onCycleCamera' | 'onTogglePause' | 'onToggleHud' | 'onToggleDev'
      >
    >,
  ): void {
    Object.assign(this, h);
  }

  async enableTilt(): Promise<boolean> {
    type DOE = typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    const D = window.DeviceOrientationEvent as DOE | undefined;
    if (!D) return false;
    try {
      if (typeof D.requestPermission === 'function') {
        const r = await D.requestPermission();
        if (r !== 'granted') return false;
      }
    } catch {
      return false;
    }
    this.tilt.calibrated = false;
    window.addEventListener('deviceorientation', this.onOrient);
    this.tiltEnabled = true;
    return true;
  }

  disableTilt(): void {
    window.removeEventListener('deviceorientation', this.onOrient);
    this.tiltEnabled = false;
    this.tilt.pitch = 0;
    this.tilt.roll = 0;
  }

  private readonly onOrient = (e: DeviceOrientationEvent): void => {
    const landscape = window.innerWidth > window.innerHeight;
    const beta = e.beta ?? 0;
    const gamma = e.gamma ?? 0;
    const a = landscape ? gamma : beta;
    const b = landscape ? -beta : gamma;
    if (!this.tilt.calibrated) {
      this.tilt.zeroBeta = a;
      this.tilt.zeroGamma = b;
      this.tilt.calibrated = true;
    }
    this.tilt.pitch = clamp((a - this.tilt.zeroBeta) / 25, -1, 1);
    this.tilt.roll = clamp((b - this.tilt.zeroGamma) / 30, -1, 1);
  };

  /** 每幀：合成使用者輸入（鍵盤斜坡、滑鼠飛行、觸控、傾斜），放開平滑回中 */
  update(dt: number): void {
    const s = this.engine.sim.state;
    const u = this.engine.sim.user;
    const rate = dt * 2.5;
    this.kb.pitch = approach(
      this.kb.pitch,
      this.has('arrowdown', 's') ? 1 : this.has('arrowup', 'w') ? -1 : 0,
      rate,
    );
    this.kb.roll = approach(
      this.kb.roll,
      this.has('arrowright', 'd') ? 1 : this.has('arrowleft', 'a') ? -1 : 0,
      rate * 1.2,
    );
    this.kb.rudder = approach(this.kb.rudder, this.has('e') ? 1 : this.has('q') ? -1 : 0, rate);
    let pitch = this.kb.pitch;
    let roll = this.kb.roll;
    if (this.mouse.active) {
      pitch = -this.mouse.y;
      roll = this.mouse.x;
    } else if (this.touch.active) {
      pitch = this.touch.pitch;
      roll = this.touch.roll;
    } else if (this.tiltEnabled) {
      pitch = this.tilt.pitch;
      roll = this.tilt.roll;
    }
    // 側桿回中具平滑（非瞬停）
    u.pitch = approach(u.pitch, clamp(pitch, -1, 1), dt * 6);
    u.roll = approach(u.roll, clamp(roll, -1, 1), dt * 6);
    const rudder = clamp(this.kb.rudder + this.touch.rudder, -1, 1);
    u.rudder = rudder;
    u.tiller = s.flight.onGround && s.flight.gs < 30 ? rudder : 0;
    const brake = this.has(' ') ? 1 : this.touch.brake;
    u.brakeL = brake || (this.has(',') ? 1 : 0);
    u.brakeR = brake || (this.has('.') ? 1 : 0);
  }
}
