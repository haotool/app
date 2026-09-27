/**
 * 模擬中介面：頂列、面板（設定/說明/系統/天氣）、外部 HUD、座艙懸停提示、Demo 橫幅、重播列、疊加狀態。
 * 所有數值直接讀 SimState（唯一真相來源）。
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InputRouter } from '../input/InputRouter';
import type { Engine } from '../render/Engine';
import { CAMERA_MODES, type CameraMode } from '../render/camera/CameraDirector';
import type { QualityLevel } from '../render/types';
import { COLD_DARK_CHECKLIST } from '../sim/checklist';
import type { WeatherPreset } from '../sim/types';
import { useIsMobile, useTick } from './useTick';
import { LangToggle, Panel, Stat } from './Widgets';
import { MobileControls } from './MobileControls';

type PanelKind = 'settings' | 'help' | 'systems' | 'weather' | null;

export interface UiSettings {
  hud: boolean;
  dev: boolean;
  assist: boolean;
}

const fmt = (v: number, d = 0): string => (Number.isFinite(v) ? v.toFixed(d) : '---');

export function SimUi({
  engine,
  input,
  onMenu,
}: {
  engine: Engine;
  input: InputRouter;
  onMenu: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  useTick(engine);
  const { mobile, portrait } = useIsMobile();
  const [panel, setPanel] = useState<PanelKind>(null);
  const [ui, setUi] = useState<UiSettings>({
    hud: true,
    dev: false,
    assist: engine.sim.state.meta.scenario === 'coldDark',
  });
  const [, force] = useState(0);
  const s = engine.sim.state;
  const director = engine.director;

  useEffect(() => {
    input.setHandlers({
      onToggleCockpit: () => {
        engine.setCockpitMode(!engine.cockpitMode);
        force((n) => n + 1);
      },
      onCycleCamera: () => director.cycleQuick(),
      onTogglePause: () => engine.sim.setPaused(!engine.sim.state.meta.paused),
      onToggleHud: () => setUi((u) => ({ ...u, hud: !u.hud })),
      onToggleDev: () => setUi((u) => ({ ...u, dev: !u.dev })),
    });
  }, [engine, input, director]);

  const step = s.meta.scenario === 'coldDark' && ui.assist ? engine.sim.assistStep() : -1;
  const highlight = step >= 0 && ui.assist ? COLD_DARK_CHECKLIST[step].ids : [];
  const hlKey = highlight.join(',');
  useEffect(() => {
    engine.cockpit.setHighlight(hlKey ? hlKey.split(',') : []);
  }, [engine, hlKey]);

  const inCockpit = director.inCockpit;
  const hover = engine.cockpit.interaction.hover;
  const td = s.meta.lastTouchdown;
  const recentTd = td && s.meta.time - td.time < 8;
  const replay = engine.replay;

  return (
    <div className={`sim-ui ${mobile ? 'is-mobile' : ''} ${portrait ? 'is-portrait' : ''}`}>
      <header className="topbar">
        <div className="tb-left">
          <button type="button" className="brand-btn" onClick={onMenu} aria-label={t('top.menu')}>
            A320<span>neo</span>
          </button>
          <span className="phase-chip" title={t('status.phase')}>
            {s.meta.phase.replace('_', ' ')}
          </span>
        </div>
        <div className="tb-center">
          <div className="seg" role="group">
            <button
              type="button"
              className={!engine.cockpitMode ? 'on' : ''}
              onClick={() => {
                engine.setCockpitMode(false);
                force((n) => n + 1);
              }}
            >
              {t('top.fly')}
            </button>
            <button
              type="button"
              className={engine.cockpitMode ? 'on' : ''}
              onClick={() => {
                engine.setCockpitMode(true);
                if (!director.inCockpit) director.setMode('CAPTAIN_EYE');
                force((n) => n + 1);
              }}
            >
              {t('top.cockpit')}
            </button>
          </div>
          {!mobile ? (
            <select
              className="cam-select"
              value={director.mode}
              onChange={(e) => director.setMode(e.target.value as CameraMode)}
              aria-label={t('top.camera')}
            >
              {CAMERA_MODES.map((m) => (
                <option key={m} value={m}>
                  {t(`cam.${m}`)}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <div className="tb-right">
          {s.meta.scenario === 'coldDark' ? (
            <button
              type="button"
              className={`chip-btn ${ui.assist ? 'on' : ''}`}
              onClick={() => setUi((u) => ({ ...u, assist: !u.assist }))}
            >
              {t('top.checklist')}
            </button>
          ) : null}
          <button
            type="button"
            className="chip-btn"
            onClick={() => engine.sim.setPaused(!s.meta.paused)}
          >
            {s.meta.paused ? t('top.resume') : t('top.pause')}
          </button>
          {!mobile ? (
            <div className="seg small" role="group" aria-label={t('settings.timeScale')}>
              {([1, 2, 4] as const).map((ts) => (
                <button
                  key={ts}
                  type="button"
                  className={s.meta.timeScale === ts ? 'on' : ''}
                  onClick={() => engine.sim.setTimeScale(ts)}
                >
                  {ts}×
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            className="chip-btn"
            disabled={engine.sim.replay.duration < 5}
            onClick={() => (replay.active ? engine.stopReplay() : engine.startReplay())}
          >
            {t('top.replay')}
          </button>
          <button
            type="button"
            className={`chip-btn ${panel === 'weather' ? 'on' : ''}`}
            onClick={() => setPanel(panel === 'weather' ? null : 'weather')}
          >
            {t('top.weather')}
          </button>
          <button
            type="button"
            className={`chip-btn ${panel === 'systems' ? 'on' : ''}`}
            onClick={() => setPanel(panel === 'systems' ? null : 'systems')}
          >
            {t('top.systems')}
          </button>
          <button
            type="button"
            className={`chip-btn ${panel === 'settings' ? 'on' : ''}`}
            onClick={() => setPanel(panel === 'settings' ? null : 'settings')}
          >
            {t('top.settings')}
          </button>
          {!mobile ? (
            <button
              type="button"
              className={`chip-btn ${panel === 'help' ? 'on' : ''}`}
              onClick={() => setPanel(panel === 'help' ? null : 'help')}
            >
              {t('top.help')}
            </button>
          ) : null}
          {!mobile ? <LangToggle /> : null}
        </div>
      </header>

      {s.meta.demoActive && engine.sim.demoFlying ? (
        <div className="demo-banner">
          <span className="pulse" aria-hidden />
          {t('status.demo')}
          <button
            type="button"
            className="primary small"
            onClick={() => {
              engine.sim.takeControl();
              director.setMode('CAPTAIN_EYE');
            }}
          >
            {t('top.takeControl')}
          </button>
        </div>
      ) : null}

      {!inCockpit && ui.hud && !replay.active && director.mode !== 'CINEMATIC_AUTO' ? (
        <ExternalHud engine={engine} />
      ) : null}
      {input.mouse.active ? <MouseReticle input={input} /> : null}
      {!mobile && !engine.cockpitMode && inCockpit && !input.mouse.active ? (
        <div className="center-reticle" aria-hidden />
      ) : null}
      {hover && engine.cockpit.interaction.enabled ? (
        <div className="hover-tip">
          <strong>{hover.label}</strong>
          <span>{hoverHint(hover.hint, t)}</span>
        </div>
      ) : null}
      {mobile && portrait && !replay.active ? <PfdRepeater engine={engine} /> : null}
      {step >= 0 && ui.assist ? (
        <div className="assist">
          <div className="assist-head">
            {t('assist.title')} · {step + 1}/{COLD_DARK_CHECKLIST.length}
          </div>
          <div className="assist-text">{t(`assist.${COLD_DARK_CHECKLIST[step].key}`)}</div>
        </div>
      ) : s.meta.scenario === 'coldDark' && ui.assist && step < 0 ? (
        <div className="assist done">{t('assist.done')}</div>
      ) : null}
      {recentTd && td ? (
        <div className="toast">{t('status.touchdown', { vs: fmt(td.vs), g: fmt(td.g, 2) })}</div>
      ) : null}
      {s.meta.paused && !replay.active && !s.meta.crashed ? (
        <div className="paused-badge">{t('status.paused')}</div>
      ) : null}
      {replay.active ? (
        <div className="replay-bar">
          <span className="rec">● {t('status.replaying')}</span>
          <input
            type="range"
            min={0}
            max={engine.sim.replay.duration}
            step={0.1}
            value={replay.t}
            onChange={(e) => engine.setReplayTime(Number(e.target.value))}
            aria-label={t('top.replay')}
          />
          <div className="seg small">
            {[0.5, 1, 2].map((sp) => (
              <button
                key={sp}
                type="button"
                className={replay.speed === sp ? 'on' : ''}
                onClick={() => engine.setReplaySpeed(sp)}
              >
                {sp}×
              </button>
            ))}
          </div>
          <button type="button" className="chip-btn" onClick={() => engine.stopReplay()}>
            {t('status.exitReplay')}
          </button>
        </div>
      ) : null}
      {ui.dev ? <DevOverlay engine={engine} /> : null}

      {panel === 'settings' ? (
        <SettingsPanel
          engine={engine}
          input={input}
          ui={ui}
          setUi={setUi}
          onClose={() => setPanel(null)}
        />
      ) : null}
      {panel === 'help' ? <HelpPanel onClose={() => setPanel(null)} /> : null}
      {panel === 'systems' ? <SystemsPanel engine={engine} onClose={() => setPanel(null)} /> : null}
      {panel === 'weather' ? <WeatherPanel engine={engine} onClose={() => setPanel(null)} /> : null}

      {mobile && !replay.active ? (
        <MobileControls engine={engine} input={input} portrait={portrait} />
      ) : null}

      {s.meta.crashed ? (
        <div className="overlay">
          <div className="overlay-card">
            <h2>{t('status.crashed')}</h2>
            <p>{t('status.crashDesc')}</p>
            <button type="button" className="primary" onClick={onMenu}>
              {t('status.reset')}
            </button>
          </div>
        </div>
      ) : null}
      {engine.contextLost ? (
        <div className="overlay">
          <div className="overlay-card">
            <h2>{t('status.ctxLost')}</h2>
            <p>{t('status.ctxRecover')}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function hoverHint(h: string, t: (k: string) => string): string {
  switch (h) {
    case 'knob':
      return `${t('knob.push')} / ${t('knob.pull')} · ⟳`;
    default:
      return '';
  }
}

function ExternalHud({ engine }: { engine: Engine }): React.JSX.Element {
  const { t } = useTranslation();
  const f = engine.sim.state.flight;
  const a = engine.sim.state.afs;
  return (
    <div className="ext-hud" aria-label="HUD">
      <Stat label={t('hud.ias')} value={`${fmt(f.ias)} kt`} />
      <Stat label={t('hud.alt')} value={`${fmt(f.altitudeMsl)} ft`} />
      <Stat label={t('hud.vs')} value={`${f.vs > 0 ? '+' : ''}${fmt(f.vs)}`} />
      <Stat
        label={t('hud.hdg')}
        value={`${String(Math.round(f.heading) % 360).padStart(3, '0')}°`}
      />
      <Stat label={t('hud.gs')} value={`${fmt(f.gs)} kt`} />
      <Stat
        label={t('hud.ap')}
        value={`${a.ap1 ? 'AP1 ' : ''}${a.ap2 ? 'AP2 ' : ''}${a.athrActive ? 'A/THR' : a.ap1 || a.ap2 ? '' : 'OFF'}`}
        tone={a.ap1 || a.ap2 ? 'ok' : undefined}
      />
    </div>
  );
}

function MouseReticle({ input }: { input: InputRouter }): React.JSX.Element {
  const m = input.mouse;
  const range = Math.min(window.innerWidth, window.innerHeight) * 0.22;
  return (
    <div
      className="mouse-reticle"
      style={{ left: m.cx, top: m.cy, width: range * 2, height: range * 2 }}
      aria-hidden
    >
      <div
        className="mr-dot"
        style={{ transform: `translate(${m.x * range}px, ${m.y * range}px)` }}
      />
    </div>
  );
}

/** 手機直式：PFD 小型複示（直接複製座艙 PFD 畫布） */
function PfdRepeater({ engine }: { engine: Engine }): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);
  useTick(engine, 10);
  useEffect(() => {
    const c = ref.current;
    const src = engine.displays.textures.pfd1.image as HTMLCanvasElement | undefined;
    const ctx = c?.getContext('2d');
    if (c && ctx && src) ctx.drawImage(src, 0, 0, c.width, c.height);
  });
  return <canvas ref={ref} className="pfd-repeater" width={256} height={256} aria-label="PFD" />;
}

function DevOverlay({ engine }: { engine: Engine }): React.JSX.Element {
  const st = engine.stats;
  return (
    <div className="dev-overlay">
      <div>
        FPS {fmt(st.fps)} · {fmt(st.frameMs, 1)} ms
      </div>
      <div>
        Draw {st.drawCalls} · Tri {(st.triangles / 1000).toFixed(0)}k
      </div>
      <div>
        Tex {st.textures} · Prog {st.programs}
      </div>
      <div>
        Scale {st.renderScale.toFixed(2)} · {st.quality}
      </div>
      <div>Physics {fmt(st.physicsSteps)} Hz</div>
    </div>
  );
}

function SettingsPanel({
  engine,
  input,
  ui,
  setUi,
  onClose,
}: {
  engine: Engine;
  input: InputRouter;
  ui: UiSettings;
  setUi: (f: (u: UiSettings) => UiSettings) => void;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [vol, setVol] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [tiltMsg, setTiltMsg] = useState('');
  const s = engine.sim.state;
  const toggleFailure = (k: keyof typeof s.failures): void =>
    engine.sim.setFailure(k, !s.failures[k]);
  return (
    <Panel title={t('top.settings')} onClose={onClose}>
      <label className="field">
        <span>{t('settings.quality')}</span>
        <select
          value={engine.quality.level}
          onChange={(e) => engine.setQualityLevel(e.target.value as QualityLevel)}
        >
          {(['ULTRA', 'HIGH', 'MEDIUM', 'LOW'] as QualityLevel[]).map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{t('settings.volume')}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={vol}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVol(v);
            engine.sound.setVolume(v);
          }}
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={muted}
          onChange={(e) => {
            setMuted(e.target.checked);
            engine.sound.setMuted(e.target.checked);
          }}
        />
        {t('settings.mute')}
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={engine.reducedMotion}
          onChange={(e) => engine.setReducedMotion(e.target.checked)}
        />
        {t('settings.reducedMotion')}
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={ui.hud}
          onChange={(e) => setUi((u) => ({ ...u, hud: e.target.checked }))}
        />
        {t('settings.hud')}
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={ui.dev}
          onChange={(e) => setUi((u) => ({ ...u, dev: e.target.checked }))}
        />
        {t('settings.dev')}
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={engine.sim.keepApOnTakeover}
          onChange={(e) => engine.sim.setKeepApOnTakeover(e.target.checked)}
        />
        {t('settings.keepAp')}
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={s.adirs.fastAlign}
          onChange={(e) => engine.sim.setFastAlign(e.target.checked)}
        />
        {t('settings.fastAlign')}
      </label>
      <div className="field">
        <span>{t('settings.tilt')}</span>
        <button
          type="button"
          className="chip-btn"
          onClick={() => {
            if (input.tiltEnabled) {
              input.disableTilt();
              setTiltMsg('');
              return;
            }
            void input.enableTilt().then((ok) => setTiltMsg(ok ? '' : t('settings.tiltDenied')));
          }}
        >
          {input.tiltEnabled ? t('settings.tiltOff') : t('settings.tiltOn')}
        </button>
        {tiltMsg ? <small className="note">{tiltMsg}</small> : null}
      </div>
      <div className="field">
        <span>{t('settings.timeScale')}</span>
        <div className="seg small">
          {([1, 2, 4] as const).map((ts) => (
            <button
              key={ts}
              type="button"
              className={s.meta.timeScale === ts ? 'on' : ''}
              onClick={() => engine.sim.setTimeScale(ts)}
            >
              {ts}×
            </button>
          ))}
        </div>
        <small className="note">{t('settings.timeScaleNote')}</small>
      </div>
      <div className="field">
        <span>{t('settings.failures')}</span>
        <label className="check">
          <input
            type="checkbox"
            checked={s.failures.eng1Fail}
            onChange={() => toggleFailure('eng1Fail')}
          />
          {t('settings.eng1Fail')}
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={s.failures.gen1Fail}
            onChange={() => toggleFailure('gen1Fail')}
          />
          {t('settings.gen1Fail')}
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={s.failures.hydGreenLeak}
            onChange={() => toggleFailure('hydGreenLeak')}
          />
          {t('settings.hydLeak')}
        </label>
      </div>
      <div className="field">
        <span>{t('app.lang')}</span>
        <LangToggle />
      </div>
    </Panel>
  );
}

function HelpPanel({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Panel title={t('help.title')} onClose={onClose}>
      <ul className="help-list">
        {(
          [
            'pitchRoll',
            'rudder',
            'thrust',
            'brakes',
            'gearFlaps',
            'ap',
            'mouse',
            'cockpit',
            'misc',
          ] as const
        ).map((k) => (
          <li key={k}>{t(`help.${k}`)}</li>
        ))}
      </ul>
    </Panel>
  );
}

function SystemsPanel({
  engine,
  onClose,
}: {
  engine: Engine;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const s = engine.sim.state;
  const e = s.elec;
  const on = (b: boolean): 'ok' | 'bad' => (b ? 'ok' : 'bad');
  const psi = (p: number): 'ok' | 'warn' | 'bad' => (p > 2500 ? 'ok' : p > 1450 ? 'warn' : 'bad');
  return (
    <Panel title={t('sys.title')} onClose={onClose} className="systems">
      <h3>{t('sys.elec')}</h3>
      <div className="stat-grid">
        <Stat
          label="AC BUS 1"
          value={e.acBus1 ? `ON · ${e.ac1Source ?? ''}` : 'OFF'}
          tone={on(e.acBus1)}
        />
        <Stat
          label="AC BUS 2"
          value={e.acBus2 ? `ON · ${e.ac2Source ?? ''}` : 'OFF'}
          tone={on(e.acBus2)}
        />
        <Stat label="DC BAT" value={e.dcBat ? 'ON' : 'OFF'} tone={on(e.dcBat)} />
        <Stat label="BAT 1/2" value={`${fmt(e.bat1V, 1)} / ${fmt(e.bat2V, 1)} V`} />
      </div>
      <h3>{t('sys.hyd')}</h3>
      <div className="stat-grid">
        <Stat
          label="GREEN"
          value={`${fmt(s.hyd.green.pressure)} psi`}
          tone={psi(s.hyd.green.pressure)}
        />
        <Stat
          label="BLUE"
          value={`${fmt(s.hyd.blue.pressure)} psi`}
          tone={psi(s.hyd.blue.pressure)}
        />
        <Stat
          label="YELLOW"
          value={`${fmt(s.hyd.yellow.pressure)} psi`}
          tone={psi(s.hyd.yellow.pressure)}
        />
      </div>
      <h3>{t('sys.fuel')}</h3>
      <div className="stat-grid">
        <Stat
          label="L / CTR / R"
          value={`${fmt(s.fuel.left)} / ${fmt(s.fuel.center)} / ${fmt(s.fuel.right)} kg`}
        />
        <Stat label="FOB" value={`${fmt(s.fuel.fob)} kg`} />
      </div>
      <h3>{t('sys.engines')}</h3>
      <div className="stat-grid">
        {s.engines.map((en, i) => (
          <Stat
            key={i}
            label={`ENG ${i + 1} · ${en.state}`}
            value={`N1 ${fmt(en.n1, 1)} · N2 ${fmt(en.n2, 1)} · EGT ${fmt(en.egt)}`}
            tone={en.state === 'OFF' ? undefined : 'ok'}
          />
        ))}
        <Stat
          label={t('sys.athr')}
          value={
            s.afs.athrActive
              ? `${s.afs.athrMode ?? ''} · N1 ${fmt(s.engines[0].n1Cmd, 1)}`
              : s.afs.athrArmed
                ? 'ARMED'
                : 'OFF'
          }
          tone={s.afs.athrActive ? 'ok' : undefined}
        />
      </div>
      <h3>
        {t('sys.gear')} · {t('sys.flaps')}
      </h3>
      <div className="stat-grid">
        <Stat
          label="L/G"
          value={`${s.gear.lever} · ${s.gear.position.map((p) => (p > 0.999 ? 'DN' : p < 0.001 ? 'UP' : 'TRANS')).join(' ')}`}
          tone={s.gear.downLocked.every(Boolean) ? 'ok' : 'warn'}
        />
        <Stat
          label="FLAPS"
          value={`${s.controls.flapConfig} · S ${fmt(s.controls.slatsAngle)}° F ${fmt(s.controls.flapsAngle)}°`}
        />
        <Stat
          label="BRK"
          value={`${s.gear.autobrake} · ${fmt(s.gear.brakeTemp[0])}/${fmt(s.gear.brakeTemp[1])}°C`}
          tone={s.gear.brakeTemp[0] > 300 ? 'bad' : undefined}
        />
      </div>
    </Panel>
  );
}

const PRESETS: WeatherPreset[] = [
  'CLEAR',
  'SCATTERED',
  'OVERCAST',
  'RAIN',
  'FOG',
  'CROSSWIND',
  'TURBULENCE',
];

function WeatherPanel({
  engine,
  onClose,
}: {
  engine: Engine;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [, force] = useState(0);
  const w = engine.sim.state.weather;
  const custom = (patch: Parameters<typeof engine.sim.setWeather>[0]): void => {
    engine.sim.setWeather(patch);
    force((n) => n + 1);
  };
  const hh = Math.floor(w.timeOfDay);
  const mm = Math.round((w.timeOfDay % 1) * 60);
  return (
    <Panel title={t('top.weather')} onClose={onClose}>
      <div className="chip-wrap">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className={`chip-btn ${w.preset === p ? 'on' : ''}`}
            onClick={() => {
              engine.sim.setWeatherPreset(p);
              force((n) => n + 1);
            }}
          >
            {t(`wx.${p}`)}
          </button>
        ))}
      </div>
      <label className="field">
        <span>
          {t('top.time')} · {String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')}
        </span>
        <input
          type="range"
          min={0}
          max={24}
          step={0.05}
          value={w.timeOfDay}
          onChange={(e) => {
            engine.sim.setWeather({ timeOfDay: Number(e.target.value), preset: w.preset });
            force((n) => n + 1);
          }}
        />
      </label>
      <label className="field">
        <span>
          {t('wx.wind')} · {String(Math.round(w.windDir)).padStart(3, '0')}° /{' '}
          {Math.round(w.windSpeed)} kt
        </span>
        <input
          type="range"
          min={0}
          max={360}
          step={5}
          value={w.windDir}
          onChange={(e) => custom({ windDir: Number(e.target.value) })}
        />
        <input
          type="range"
          min={0}
          max={40}
          step={1}
          value={w.windSpeed}
          onChange={(e) => custom({ windSpeed: Number(e.target.value) })}
        />
      </label>
      <label className="field">
        <span>
          {t('wx.visibility')} · {(w.visibility / 1000).toFixed(1)} km
        </span>
        <input
          type="range"
          min={300}
          max={40000}
          step={100}
          value={w.visibility}
          onChange={(e) => custom({ visibility: Number(e.target.value) })}
        />
      </label>
      <label className="field">
        <span>
          {t('wx.clouds')} · {Math.round(w.cloudCover * 100)}%
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={w.cloudCover}
          onChange={(e) => custom({ cloudCover: Number(e.target.value) })}
        />
      </label>
    </Panel>
  );
}
