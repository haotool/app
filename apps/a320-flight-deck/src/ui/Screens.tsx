/**
 * 載入畫面（依實際建構階段）與主選單（情境 × 天候時段）。
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LoadStage } from '../render/Engine';
import type { QualityLevel } from '../render/types';
import type { Scenario } from '../sim/types';
import { LangToggle } from './Widgets';

const STAGES: LoadStage[] = ['systems', 'deck', 'avionics', 'airport', 'shaders'];

export function LoadingScreen({
  stage,
  fading,
}: {
  stage: LoadStage;
  fading: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const idx = stage === 'ready' ? STAGES.length : STAGES.indexOf(stage);
  return (
    <div className={`loading ${fading ? 'fade-out' : ''}`}>
      <div className="brand-block">
        <div className="brand-type">{t('app.title')}</div>
        <div className="brand-sub">{t('app.subtitle')}</div>
      </div>
      <ol className="load-steps">
        {STAGES.map((s, i) => (
          <li key={s} className={i < idx ? 'done' : i === idx ? 'active' : ''}>
            <span className="load-dot" aria-hidden />
            {t(`loading.${s}`)}
            {i < idx ? <span className="load-ok">OK</span> : null}
          </li>
        ))}
      </ol>
      <div
        className="load-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={STAGES.length}
        aria-valuenow={idx}
      >
        <div style={{ width: `${(idx / STAGES.length) * 100}%` }} />
      </div>
    </div>
  );
}

export type Conditions = 'day' | 'sunset' | 'night' | 'rain';

export interface StartOptions {
  scenario: Scenario;
  conditions: Conditions;
  quality: QualityLevel;
  cinematic: boolean;
}

export function MainMenu({
  initialQuality,
  onStart,
}: {
  initialQuality: QualityLevel;
  onStart: (o: StartOptions) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [scenario, setScenario] = useState<Scenario>('quick');
  const [conditions, setConditions] = useState<Conditions>('day');
  const [quality, setQuality] = useState<QualityLevel>(initialQuality);
  const [cinematic, setCinematic] = useState(true);
  const scenarios: Scenario[] = ['quick', 'coldDark', 'demo', 'free'];
  return (
    <div className="menu">
      <div className="menu-card">
        <header className="menu-head">
          <div>
            <div className="brand-type">{t('app.title')}</div>
            <div className="brand-sub">{t('app.subtitle')}</div>
          </div>
          <LangToggle />
        </header>
        <section>
          <h2 className="section-label">{t('menu.scenario')}</h2>
          <div className="scenario-grid">
            {scenarios.map((sc) => (
              <button
                key={sc}
                type="button"
                className={`scenario ${scenario === sc ? 'selected' : ''}`}
                onClick={() => setScenario(sc)}
                aria-pressed={scenario === sc}
              >
                <span className="scenario-title">{t(`menu.${sc}`)}</span>
                <span className="scenario-desc">{t(`menu.${sc}Desc`)}</span>
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2 className="section-label">{t('menu.conditions')}</h2>
          <div className="seg">
            {(['day', 'sunset', 'night', 'rain'] as Conditions[]).map((c) => (
              <button
                key={c}
                type="button"
                className={conditions === c ? 'on' : ''}
                onClick={() => setConditions(c)}
                aria-pressed={conditions === c}
              >
                {t(`menu.${c}`)}
              </button>
            ))}
          </div>
        </section>
        <section className="menu-row">
          <label className="field">
            <span>{t('menu.quality')}</span>
            <select value={quality} onChange={(e) => setQuality(e.target.value as QualityLevel)}>
              {(['ULTRA', 'HIGH', 'MEDIUM', 'LOW'] as QualityLevel[]).map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </label>
          {scenario === 'demo' ? (
            <label className="check">
              <input
                type="checkbox"
                checked={cinematic}
                onChange={(e) => setCinematic(e.target.checked)}
              />
              {t('menu.cinematic')}
            </label>
          ) : null}
        </section>
        <button
          type="button"
          className="primary start"
          onClick={() => onStart({ scenario, conditions, quality, cinematic })}
        >
          {t('menu.start')}
        </button>
      </div>
    </div>
  );
}
