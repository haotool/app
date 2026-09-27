import { useEffect, useRef, useState } from 'react';
import { InputRouter } from '../input/InputRouter';
import { detectQuality, Engine, type LoadStage } from '../render/Engine';
import type { QualityLevel } from '../render/types';
import { Simulation } from '../sim/simulation';
import type { WeatherPreset } from '../sim/types';
import { LoadingScreen, MainMenu, type Conditions, type StartOptions } from './Screens';
import { SimUi } from './SimUi';

const CONDITIONS: Record<Conditions, { weather: WeatherPreset; time: number }> = {
  day: { weather: 'SCATTERED', time: 10.5 },
  sunset: { weather: 'SCATTERED', time: 17.55 },
  night: { weather: 'CLEAR', time: 21.5 },
  rain: { weather: 'RAIN', time: 14 },
};

export function App(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [input, setInput] = useState<InputRouter | null>(null);
  const [stage, setStage] = useState<LoadStage>('systems');
  const [screen, setScreen] = useState<'loading' | 'menu' | 'sim'>('loading');
  const [fading, setFading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const quality = useRef<QualityLevel>(detectQuality());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const sim = new Simulation('quick', 'SCATTERED', 10.5);
    const eng = new Engine(canvas, sim, quality.current);
    let cancelled = false;
    eng
      .build((st) => {
        if (!cancelled) setStage(st);
      })
      .then(() => {
        if (cancelled) return;
        if (import.meta.env.DEV) (window as unknown as { __eng: Engine }).__eng = eng;
        const inp = new InputRouter(eng);
        eng.onBeforeFrame = (dt) => inp.update(dt);
        eng.director.setMode('ORBIT');
        eng.start();
        setInput(inp);
        setEngine(eng);
        setFading(true);
        window.setTimeout(() => setScreen('menu'), 650);
      })
      .catch((err: unknown) => {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
      eng.dispose();
    };
  }, []);

  const start = (o: StartOptions): void => {
    if (!engine) return;
    if (o.quality !== engine.quality.level) engine.setQualityLevel(o.quality);
    const c = CONDITIONS[o.conditions];
    engine.stopReplay();
    engine.sim.reset(o.scenario, c.weather, c.time);
    engine.setCockpitMode(o.scenario === 'coldDark');
    engine.director.setMode(
      o.scenario === 'demo' && o.cinematic ? 'CINEMATIC_AUTO' : 'CAPTAIN_EYE',
    );
    void engine.sound.resume();
    setScreen('sim');
  };

  return (
    <div className="app">
      <canvas ref={canvasRef} className="gl" />
      {error ? (
        <div className="overlay">
          <div className="overlay-card">
            <h2>WebGL</h2>
            <p>{error}</p>
          </div>
        </div>
      ) : null}
      {screen === 'loading' ? <LoadingScreen stage={stage} fading={fading} /> : null}
      {screen === 'menu' && engine ? (
        <MainMenu initialQuality={engine.quality.level} onStart={start} />
      ) : null}
      {screen === 'sim' && engine && input ? (
        <SimUi
          engine={engine}
          input={input}
          onMenu={() => {
            engine.stopReplay();
            engine.director.setMode('ORBIT');
            setScreen('menu');
          }}
        />
      ) : null}
    </div>
  );
}
