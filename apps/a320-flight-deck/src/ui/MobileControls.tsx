/**
 * 手機操控：左下虛擬側桿（俯仰+滾轉）、右側油門滑桿（卡位吸附）、底部方向舵與剎車、視角鍵（長按展開全部視角）、
 * 座艙旋鈕操作盤（觸控選取 FCU/BARO 旋鈕後出現）。
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InputRouter } from '../input/InputRouter';
import type { Engine } from '../render/Engine';
import { CAMERA_MODES } from '../render/camera/CameraDirector';
import { TLA } from '../sim/constants';

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const DETENTS = [
  { v: TLA.TOGA, l: 'TOGA' },
  { v: TLA.FLX, l: 'FLX' },
  { v: TLA.CL, l: 'CL' },
  { v: TLA.IDLE, l: 'IDLE' },
  { v: TLA.MAX_REV, l: 'REV' },
];

export function MobileControls({
  engine,
  input,
  portrait,
}: {
  engine: Engine;
  input: InputRouter;
  portrait: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [knob, setKnob] = useState<string | null>(null);
  const [camMenu, setCamMenu] = useState(false);
  useEffect(() => {
    engine.setKnobSelectHandler(setKnob);
    return () => engine.setKnobSelectHandler(null);
  }, [engine]);
  const showFlight = !engine.cockpitMode;
  return (
    <div className={`mobile-controls ${portrait ? 'portrait' : 'landscape'}`}>
      {showFlight ? <Joystick input={input} /> : null}
      {showFlight ? <Throttle engine={engine} /> : null}
      {showFlight ? <RudderBrake input={input} /> : null}
      <CameraButton engine={engine} open={camMenu} setOpen={setCamMenu} />
      {camMenu ? (
        <div className="cam-sheet" role="menu">
          {CAMERA_MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="menuitem"
              className={engine.director.mode === m ? 'on' : ''}
              onClick={() => {
                engine.director.setMode(m);
                setCamMenu(false);
              }}
            >
              {t(`cam.${m}`)}
            </button>
          ))}
        </div>
      ) : null}
      {knob ? <KnobPad engine={engine} id={knob} onClose={() => setKnob(null)} /> : null}
    </div>
  );
}

function Joystick({ input }: { input: InputRouter }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const id = useRef<number | null>(null);
  const update = (e: React.PointerEvent): void => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    const y = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    setPos({ x, y });
    input.setTouchStick(true, -y, x);
  };
  const end = (): void => {
    id.current = null;
    setPos({ x: 0, y: 0 });
    input.setTouchStick(false, 0, 0);
  };
  return (
    <div
      ref={ref}
      className="joystick"
      onPointerDown={(e) => {
        id.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (id.current === e.pointerId) update(e);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Sidestick"
    >
      <div className="joy-cross" aria-hidden />
      <div
        className="joy-knob"
        style={{ transform: `translate(calc(-50% + ${pos.x * 38}%), calc(-50% + ${pos.y * 38}%))` }}
      />
    </div>
  );
}

function Throttle({ engine }: { engine: Engine }): React.JSX.Element {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const tla = engine.sim.state.engines[0].tla;
  const frac = (tla - TLA.MAX_REV) / (TLA.TOGA - TLA.MAX_REV);
  const set = (e: React.PointerEvent): void => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const f = clamp(1 - (e.clientY - r.top) / r.height, 0, 1);
    const v = TLA.MAX_REV + f * (TLA.TOGA - TLA.MAX_REV);
    for (const id of ['thr.lever1', 'thr.lever2'])
      engine.sim.command({ type: 'set', id, value: v });
  };
  return (
    <div className="throttle" aria-label={t('mobile.thrust')}>
      <div
        ref={ref}
        className="thr-track"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          set(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons) set(e);
        }}
      >
        {DETENTS.map((d) => (
          <span
            key={d.l}
            className="thr-detent"
            style={{ bottom: `${((d.v - TLA.MAX_REV) / (TLA.TOGA - TLA.MAX_REV)) * 100}%` }}
          >
            {d.l}
          </span>
        ))}
        <div className="thr-handle" style={{ bottom: `${frac * 100}%` }} />
      </div>
      <div className="thr-n1">N1 {engine.sim.state.engines[0].n1.toFixed(0)}%</div>
    </div>
  );
}

function RudderBrake({ input }: { input: InputRouter }): React.JSX.Element {
  const { t } = useTranslation();
  const [r, setR] = useState(0);
  return (
    <div className="rudder-brake">
      <input
        type="range"
        min={-1}
        max={1}
        step={0.02}
        value={r}
        aria-label={t('mobile.rudder')}
        onChange={(e) => {
          const v = Number(e.target.value);
          setR(v);
          input.setTouchRudder(v);
        }}
        onPointerUp={() => {
          setR(0);
          input.setTouchRudder(0);
        }}
      />
      <button
        type="button"
        className="brake-btn"
        onPointerDown={() => input.setTouchBrake(1)}
        onPointerUp={() => input.setTouchBrake(0)}
        onPointerLeave={() => input.setTouchBrake(0)}
      >
        {t('mobile.brake')}
      </button>
    </div>
  );
}

function CameraButton({
  engine,
  open,
  setOpen,
}: {
  engine: Engine;
  open: boolean;
  setOpen: (v: boolean) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const timer = useRef<number | null>(null);
  const long = useRef(false);
  return (
    <button
      type="button"
      className="cam-btn"
      title={t('mobile.hold')}
      onPointerDown={() => {
        long.current = false;
        timer.current = window.setTimeout(() => {
          long.current = true;
          setOpen(!open);
        }, 450);
      }}
      onPointerUp={() => {
        if (timer.current) window.clearTimeout(timer.current);
        if (!long.current) engine.director.cycleQuick();
      }}
    >
      {t('mobile.camera')}
      <small>{t(`cam.${engine.director.mode}`)}</small>
    </button>
  );
}

function KnobPad({
  engine,
  id,
  onClose,
}: {
  engine: Engine;
  id: string;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const startY = useRef<number | null>(null);
  const it = engine.cockpit.interaction;
  return (
    <div
      className="knob-pad"
      onPointerDown={(e) => {
        startY.current = e.clientY;
      }}
      onPointerMove={(e) => {
        if (startY.current === null) return;
        const d = startY.current - e.clientY;
        if (Math.abs(d) > 14) {
          it.rotateKnob(id, Math.sign(d));
          startY.current = e.clientY;
        }
      }}
      onPointerUp={() => {
        startY.current = null;
      }}
    >
      <div className="knob-title">{id.toUpperCase()}</div>
      <div className="knob-row">
        <button type="button" onClick={() => it.rotateKnob(id, -1)} aria-label="−">
          −
        </button>
        <button type="button" onClick={() => it.rotateKnob(id, 1)} aria-label="+">
          +
        </button>
      </div>
      <div className="knob-row">
        <button type="button" onClick={() => it.pushKnob(id, false)}>
          {t('knob.push')}
        </button>
        <button type="button" onClick={() => it.pushKnob(id, true)}>
          {t('knob.pull')}
        </button>
      </div>
      <button type="button" className="knob-close" onClick={onClose}>
        {t('knob.close')}
      </button>
    </div>
  );
}
