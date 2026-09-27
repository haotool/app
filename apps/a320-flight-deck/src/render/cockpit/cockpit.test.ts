import { Color, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import type { SimApi } from '../../sim/api';
import { CONTROL_DEFS, type Command } from '../../sim/controlDefs';
import { AIRCRAFT } from '../../sim/constants';
import { createInitialState } from '../../sim/state';
import { QUALITY_PRESETS, type FrameContext } from '../types';
import { Cockpit } from './index';

describe('Cockpit', () => {
  const state = createInitialState('quick');
  const cmds: Command[] = [];
  const sticks: number[][] = [];
  const sim: SimApi = {
    state,
    command: (c) => cmds.push(c),
    setSidestick: (side, x, y) => sticks.push([side, x, y]),
    on: () => () => undefined,
  };
  const cockpit = new Cockpit(sim, QUALITY_PRESETS.HIGH);

  it('every control def has an interactive hitbox', () => {
    const ids = new Set(
      (cockpit as unknown as { b: { hitboxes: { id: string }[] } }).b.hitboxes.map((h) => h.id),
    );
    const missing = CONTROL_DEFS.filter((d) => !ids.has(d.id)).map((d) => d.id);
    expect(missing).toEqual([]);
  });

  it('updates and routes a click on the AP1 button', () => {
    const camera = new PerspectiveCamera(60, 1.6, 0.02, 1000);
    const frame: FrameContext = {
      state,
      dt: 0.016,
      time: 1,
      camera,
      pose: { position: new Vector3(), quaternion: new Quaternion() },
      lighting: {
        sunDirection: new Vector3(0, 1, 0),
        sunColor: new Color(1, 1, 1),
        sunIntensity: 3,
        ambientIntensity: 0.3,
        night: 0,
        dusk: 0,
        fogColor: new Color(),
        skyHorizonColor: new Color(),
      },
      quality: QUALITY_PRESETS.HIGH,
      cameraInCockpit: true,
      reducedMotion: false,
    };
    cockpit.update(frame);
    // 以 AP1 hitbox 中心為目標
    const hb = (
      cockpit as unknown as {
        b: {
          hitboxes: { id: string; obj: { localToWorld(v: Vector3): Vector3 }; center: Vector3 }[];
        };
      }
    ).b.hitboxes.find((h) => h.id === 'fcu.ap1');
    expect(hb).toBeDefined();
    if (!hb) return;
    const target = hb.obj.localToWorld(hb.center.clone());
    const e = AIRCRAFT.eyeCaptain;
    camera.position.set(e.x, e.y, e.z);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    cockpit.interaction.enabled = true;
    expect(cockpit.interaction.pointerDown(0, 0, camera, 0, false, 'mouse')).toBe(true);
    cockpit.interaction.pointerUp();
    expect(cmds).toContainEqual({ type: 'press', id: 'fcu.ap1' });
    cockpit.setHighlight(['elec.bat1', 'elec.bat2']);
    cockpit.update({ ...frame, time: 2 });
    cockpit.dispose();
  });
});
