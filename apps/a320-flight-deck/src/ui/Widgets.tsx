import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n';

export function LangToggle(): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const zh = i18n.language === 'zh-TW';
  return (
    <div className="seg small lang" role="group" aria-label={t('app.lang')}>
      <button
        type="button"
        className={zh ? 'on' : ''}
        onClick={() => setLanguage('zh-TW')}
        aria-pressed={zh}
      >
        中文
      </button>
      <button
        type="button"
        className={!zh ? 'on' : ''}
        onClick={() => setLanguage('en')}
        aria-pressed={!zh}
      >
        EN
      </button>
    </div>
  );
}

export function Panel({
  title,
  onClose,
  children,
  className = '',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className={`panel ${className}`} role="dialog" aria-label={title}>
      <div className="panel-head">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label={t('settings.close')}
        >
          ✕
        </button>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}

/** 狀態數值（顏色之外同時以文字標示狀態） */
export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'warn' | 'bad' | 'info';
}): React.JSX.Element {
  return (
    <div className={`stat ${tone ?? ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
