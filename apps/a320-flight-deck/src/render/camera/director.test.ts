import { Color, PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../sim/state';
import type { FlightPhase } from '../../sim/types';
import { QUALITY_PRESETS, type FrameContext } from '../types';
import { CameraDirector } from './CameraDirector';
import { NO_REPEAT_WINDOW, SHOTS } from './shots';

const PHASES: FlightPhase[] = [
  'COLD_DARK',
  'POWERED',
  'ENGINE_START',
  'TAXI',
  'TAKEOFF_ROLL',
  'ROTATION',
  'INITIAL_CLIMB',
  'CLIMB',
  'CRUISE',
  'DESCENT',
  'APPROACH',
  'FINAL',
  'FLARE',
  'TOUCHDOWN',
  'ROLLOUT',
  'TAXI_IN',
  'PARKED',
];

/** 5 分鐘：每階段約 17.6 s，依階段擺放合理位置 */
function placement(
  phase: FlightPhase,
  t: number,
): { x: number; y: number; z: number; ground: boolean } {
  switch (phase) {
    case 'INITIAL_CLIMB':
      return { x: -500 - t * 70, y: 150, z: 0, ground: false };
    case 'CLIMB':
    case 'CRUISE':
    case 'DESCENT':
      return { x: -9000 - t * 120, y: 3000, z: -8000, ground: false };
    case 'APPROACH':
      return { x: 16000 - t * 80, y: 700, z: 0, ground: false };
    case 'FINAL':
      return { x: 6000 - t * 70, y: 250, z: 0, ground: false };
    case 'FLARE':
      return { x: 1700 - t * 70, y: 10, z: 0, ground: false };
    default:
      return { x: 1500 - t * 20, y: 3.9, z: 0, ground: true };
  }
}

describe('CameraDirector CINEMATIC_AUTO', () => {
  it('every phase has enough shots to honour the no-repeat window', () => {
    for (const p of PHASES) {
      expect(SHOTS.filter((s) => s.phases.includes(p)).length, p).toBeGreaterThan(NO_REPEAT_WINDOW);
    }
  });

  it('never repeats a shot within 8 cuts and respects event cooldown', () => {
    const cam = new PerspectiveCamera(55, 16 / 9, 0.1, 1000);
    const dir = new CameraDirector(cam);
    dir.setMode('CINEMATIC_AUTO');
    const state = createInitialState('demo');
    const pose = { position: new Vector3(), quaternion: state.aircraft.quaternion.clone() };
    const lighting = {
      sunDirection: new Vector3(0, 1, 0),
      sunColor: new Color(1, 1, 1),
      sunIntensity: 3,
      ambientIntensity: 0.4,
      night: 0,
      dusk: 0.2,
      fogColor: new Color(),
      skyHorizonColor: new Color(),
    };
    const frame: FrameContext = {
      state,
      dt: 0.1,
      time: 0,
      camera: cam,
      pose,
      lighting,
      quality: QUALITY_PRESETS.HIGH,
      cameraInCockpit: false,
      reducedMotion: false,
    };

    const cuts: string[] = [];
    let last = '';
    const segment = 300 / PHASES.length;
    let gearShotAt100 = '';
    for (let step = 0; step < 3000; step++) {
      const t = step * 0.1;
      const phase = PHASES[Math.min(PHASES.length - 1, Math.floor(t / segment))];
      const pl = placement(phase, t % segment);
      state.meta.phase = phase;
      state.flight.onGround = pl.ground;
      pose.position.set(pl.x, pl.y, pl.z);
      frame.time = t;
      if (step === 1000) dir.onSimEvent({ type: 'GEAR_LEVER', down: false });
      if (step === 1010) dir.onSimEvent({ type: 'GEAR_LEVER', down: true });
      dir.update(frame);
      const id = dir.currentShot?.id ?? '';
      expect(Number.isFinite(cam.position.x) && Number.isFinite(cam.fov)).toBe(true);
      if (id !== last) {
        cuts.push(id);
        last = id;
      }
      if (step === 1005) gearShotAt100 = id;
      if (step === 1015) expect(id).toBe(gearShotAt100); // 冷卻期內同類事件不再切鏡
    }
    expect(cuts.length).toBeGreaterThan(20);
    for (let i = 1; i < cuts.length; i++) {
      expect(cuts[i]).not.toBe(cuts[i - 1]);
      const window = cuts.slice(Math.max(0, i - NO_REPEAT_WINDOW), i);
      expect(window, `cut ${i} ${cuts[i]}`).not.toContain(cuts[i]);
    }
  });
});
