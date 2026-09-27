/**
 * 座艙互動：對每個控制項的 OBB hitbox 做射線檢測（非猜座標），依控制項種類轉為 sim.command / setSidestick。
 * 觸控時 hitbox 放大（視覺尺寸不變）；旋鈕在觸控點選時通知 UI 顯示操作盤。
 */
import { Matrix4, Ray, Raycaster, Vector2, Vector3, type Camera, type Object3D } from 'three';
import type { SimApi } from '../../sim/api';
import { CONTROL_MAP, readControl } from '../../sim/controlDefs';
import { TLA } from '../../sim/constants';
import type { CockpitBuilder, Hitbox } from './builder';

type Hint = 'button' | 'knob' | 'lever' | 'switch' | 'guard' | 'key' | 'stick';

const THR_DETENTS = [TLA.MAX_REV, TLA.REV_IDLE, TLA.IDLE, TLA.CL, TLA.FLX, TLA.TOGA];
const TOP_IS_FIRST = new Set(['lt.annun', 'press.manvs']);
const KNOB_STEP = Math.PI / 12;

interface Hit {
  hb: Hitbox;
  local: Vector3; // 命中點（hitbox 所屬物件區域座標，相對 hitbox 中心）
  dist: number;
}

interface Drag {
  hb: Hitbox;
  button: number;
  shift: boolean;
  touch: boolean;
  moved: number;
  accX: number;
  accY: number;
  startValue: number;
  steps: number;
  local: Vector3;
}

const hintOf = (hb: Hitbox): Hint => {
  switch (hb.def.kind) {
    case 'knob':
    case 'selector':
    case 'pot':
      return 'knob';
    case 'lever':
      return hb.id.startsWith('sidestick') ? 'stick' : 'lever';
    case 'switch':
      return 'switch';
    case 'guard':
      return 'guard';
    case 'key':
      return 'key';
    default:
      return 'button';
  }
};

export class CockpitInteraction {
  enabled = false;
  hover: { id: string; label: string; hint: Hint } | null = null;
  onKnobSelect: ((id: string | null) => void) | null = null;

  private readonly raycaster = new Raycaster();
  private readonly ndc = new Vector2();
  private readonly inv = new Matrix4();
  private readonly localRay = new Ray();
  private readonly tmp = new Vector3();
  private readonly tmp2 = new Vector3();
  private drag: Drag | null = null;
  private readonly byObj = new Map<Object3D, Hitbox[]>();

  constructor(
    private readonly sim: SimApi,
    private readonly b: CockpitBuilder,
    private readonly now: () => number,
  ) {
    for (const hb of b.hitboxes) {
      const list = this.byObj.get(hb.obj);
      if (list) list.push(hb);
      else this.byObj.set(hb.obj, [hb]);
    }
  }

  isDragging(): boolean {
    return this.drag !== null;
  }

  /** 公開：外部（例如 UI 旋鈕操作盤）也可直接轉動旋鈕以同步視覺角 */
  rotateKnob(id: string, delta: number): void {
    this.sim.command({ type: 'rotate', id, delta });
    this.b.knobAngle.set(id, (this.b.knobAngle.get(id) ?? 0) + delta * KNOB_STEP);
  }

  pushKnob(id: string, pull: boolean): void {
    if (pull) {
      this.sim.command({ type: 'pull', id });
      this.b.pullTime.set(id, this.now());
    } else {
      this.sim.command({ type: 'push', id });
      this.b.pressTime.set(id, this.now());
    }
  }

  pick(ndcX: number, ndcY: number, camera: Camera, touch: boolean): Hit | null {
    this.ndc.set(ndcX, ndcY);
    this.raycaster.setFromCamera(this.ndc, camera);
    const scale = touch ? 1.8 : 1;
    let best: Hit | null = null;
    for (const [obj, list] of this.byObj) {
      if (!obj.visible) continue;
      obj.updateWorldMatrix(true, false);
      this.inv.copy(obj.matrixWorld).invert();
      this.localRay.copy(this.raycaster.ray).applyMatrix4(this.inv);
      for (const hb of list) {
        this.tmp.copy(hb.half).multiplyScalar(scale);
        const t = rayBox(this.localRay, hb.center, this.tmp);
        if (t === null) continue;
        const p = this.localRay.at(t, this.tmp2);
        const world = p.clone().applyMatrix4(obj.matrixWorld);
        const dist = world.distanceTo(this.raycaster.ray.origin);
        if (
          !best ||
          dist < best.dist - 1e-4 ||
          (Math.abs(dist - best.dist) < 1e-4 && hb.half.lengthSq() < best.hb.half.lengthSq())
        ) {
          best = { hb, local: p.sub(hb.center), dist };
        }
      }
    }
    return best;
  }

  pointerDown(
    ndcX: number,
    ndcY: number,
    camera: Camera,
    button: number,
    shift: boolean,
    pointerType: string,
  ): boolean {
    if (!this.enabled) return false;
    const touch = pointerType === 'touch' || pointerType === 'pen';
    const hit = this.pick(ndcX, ndcY, camera, touch);
    if (!hit) {
      if (touch) this.onKnobSelect?.(null);
      return false;
    }
    const { hb } = hit;
    const s = this.sim.state;
    const id = hb.id;
    const view = readControl(s, id);
    this.drag = {
      hb,
      button,
      shift,
      touch,
      moved: 0,
      accX: 0,
      accY: 0,
      startValue: view.value,
      steps: 0,
      local: hit.local.clone(),
    };
    const kind = hb.def.kind;
    const t = this.now();
    if (kind === 'pb' || kind === 'momentary' || kind === 'key') {
      const guardFor = id.startsWith('fire.') && id !== 'fire.test' ? id : null;
      if (guardFor && !readControl(s, id).guardOpen) return true;
      this.sim.command({ type: 'press', id });
      this.b.pressTime.set(id, t);
    } else if (kind === 'guard') {
      this.sim.command({ type: 'guard', id, open: !view.guardOpen });
    } else if (kind === 'switch') {
      const n = hb.def.positions?.length ?? 2;
      const up = hit.local.y > 0 !== TOP_IS_FIRST.has(id);
      let next = Math.round(view.value) + (up ? 1 : -1);
      if (next < 0 || next >= n) next = Math.round(view.value) + (up ? -1 : 1);
      this.sim.command({ type: 'set', id, value: Math.max(0, Math.min(n - 1, next)) });
    } else if (kind === 'lever') {
      if (id === 'gear.lever' || id === 'pbrk')
        this.sim.command({ type: 'set', id, value: view.value ? 0 : 1 });
    } else if (kind === 'knob' && touch) {
      this.onKnobSelect?.(id);
    }
    return true;
  }

  pointerMove(ndcX: number, ndcY: number, camera: Camera, dxPx: number, dyPx: number): boolean {
    if (!this.enabled) {
      this.hover = null;
      return false;
    }
    const d = this.drag;
    if (!d) {
      const hit = this.pick(ndcX, ndcY, camera, false);
      this.hover = hit ? { id: hit.hb.id, label: hit.hb.def.label, hint: hintOf(hit.hb) } : null;
      return false;
    }
    d.moved += Math.abs(dxPx) + Math.abs(dyPx);
    d.accX += dxPx;
    d.accY += dyPx;
    const id = d.hb.id;
    const kind = d.hb.def.kind;
    const s = this.sim.state;
    if (id === 'sidestick1' || id === 'sidestick2') {
      const k = d.touch ? 90 : 140;
      this.sim.setSidestick(
        id === 'sidestick1' ? 1 : 2,
        clamp(d.accX / k, -1, 1),
        clamp(d.accY / k, -1, 1),
        true,
      );
    } else if (id === 'thr.lever1' || id === 'thr.lever2') {
      let tla = clamp(d.startValue - d.accY * 0.22, TLA.MAX_REV, TLA.TOGA);
      for (const det of THR_DETENTS) if (Math.abs(tla - det) < 1.6) tla = det;
      const ids = d.shift ? [id] : ['thr.lever1', 'thr.lever2'];
      for (const lid of ids) {
        if (Math.abs(readControl(s, lid).value - tla) > 0.05)
          this.sim.command({ type: 'set', id: lid, value: tla });
      }
    } else if (id === 'spdbrk') {
      const v = clamp(Math.max(0, d.startValue) + d.accY * 0.006, 0, 1);
      if (d.moved > 4 && Math.abs(readControl(s, id).value - v) > 0.01)
        this.sim.command({ type: 'set', id, value: v });
    } else if (id === 'flaps') {
      const steps = Math.trunc(d.accY / 28);
      if (steps !== d.steps) {
        d.steps = steps;
        this.sim.command({ type: 'set', id, value: clamp(Math.round(d.startValue) + steps, 0, 4) });
      }
    } else if (kind === 'knob' || kind === 'selector') {
      const steps = Math.trunc((kind === 'selector' ? d.accX : -d.accY) / 18);
      if (steps !== d.steps) {
        this.rotate(id, steps - d.steps);
        d.steps = steps;
      }
    } else if (kind === 'pot') {
      this.sim.command({ type: 'set', id, value: clamp(d.startValue - d.accY * 0.006, 0, 1) });
    }
    return true;
  }

  pointerUp(): boolean {
    const d = this.drag;
    if (!d) return false;
    this.drag = null;
    const { id } = d.hb;
    const kind = d.hb.def.kind;
    const click = d.moved < 5;
    if (id === 'sidestick1' || id === 'sidestick2') {
      this.sim.setSidestick(id === 'sidestick1' ? 1 : 2, 0, 0, false);
    } else if (kind === 'momentary' || id === 'press.manvs') {
      this.sim.command({ type: 'release', id });
    } else if (click && kind === 'knob' && !d.touch) {
      this.pushKnob(id, d.button === 2 || d.shift);
    } else if (click && kind === 'selector') {
      this.rotate(id, d.local.x < 0 ? -1 : 1);
    } else if (click && id === 'flaps') {
      // 點擊前半 → 收（-1），後半 → 放（+1）
      const v = Math.round(readControl(this.sim.state, id).value);
      this.sim.command({ type: 'set', id, value: clamp(v + (d.local.y > 0 ? -1 : 1), 0, 4) });
    } else if (click && id === 'spdbrk') {
      const v = readControl(this.sim.state, id).value;
      if (v <= 0.02) this.sim.command({ type: 'set', id, value: v < 0 ? 0 : -0.1 });
      else this.sim.command({ type: 'set', id, value: 0 });
    }
    return true;
  }

  wheel(ndcX: number, ndcY: number, camera: Camera, deltaY: number): boolean {
    if (!this.enabled || deltaY === 0) return false;
    const hit = this.pick(ndcX, ndcY, camera, false);
    if (!hit) return false;
    const { id } = hit.hb;
    const kind = hit.hb.def.kind;
    const steps =
      -Math.sign(deltaY) * Math.max(1, Math.min(10, Math.round(Math.abs(deltaY) / 100)));
    if (kind === 'knob' || kind === 'selector') this.rotate(id, steps);
    else if (kind === 'pot')
      this.sim.command({
        type: 'set',
        id,
        value: clamp(readControl(this.sim.state, id).value + steps * 0.05, 0, 1),
      });
    else if (id === 'flaps')
      this.sim.command({
        type: 'set',
        id,
        value: clamp(Math.round(readControl(this.sim.state, id).value) - steps, 0, 4),
      });
    else if (id === 'spdbrk')
      this.sim.command({
        type: 'set',
        id,
        value: clamp(readControl(this.sim.state, id).value - steps * 0.1, 0, 1),
      });
    else if (id === 'thr.lever1' || id === 'thr.lever2') {
      const v = clamp(readControl(this.sim.state, id).value + steps * 1.5, TLA.MAX_REV, TLA.TOGA);
      this.sim.command({ type: 'set', id: 'thr.lever1', value: v });
      this.sim.command({ type: 'set', id: 'thr.lever2', value: v });
    } else return false;
    return true;
  }

  private rotate(id: string, delta: number): void {
    if (delta === 0) return;
    const def = CONTROL_MAP.get(id);
    if (def?.kind === 'knob') {
      this.b.knobAngle.set(id, (this.b.knobAngle.get(id) ?? 0) + delta * KNOB_STEP);
    }
    this.sim.command({ type: 'rotate', id, delta });
  }
}

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

/** 射線 vs AABB（slab），回傳進入距離 */
function rayBox(ray: Ray, c: Vector3, h: Vector3): number | null {
  let tmin = -Infinity;
  let tmax = Infinity;
  for (const ax of ['x', 'y', 'z'] as const) {
    const o = ray.origin[ax];
    const d = ray.direction[ax];
    const lo = c[ax] - h[ax];
    const hi = c[ax] + h[ax];
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return null;
      continue;
    }
    let t1 = (lo - o) / d;
    let t2 = (hi - o) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (tmax < 0) return null;
  return Math.max(0, tmin);
}
