/**
 * 聯繫頁（design-deep-dive §5.3）：頁首 → 三張聯絡卡 → 承諾列。
 * Email 卡不可整卡點擊（互動集中於複製鈕；FR-005 預填主旨連結為卡內 MailtoLink）；
 * GitHub / Threads 整卡外連。SSG HTML 零 mailto: href（CF Email Obfuscation 治理）。
 */
import { useCallback, useRef, useState } from 'react';
import { ArrowUpRight, AtSign, Github, Mail } from 'lucide-react';
import { APP_INFO } from '../config/app-info';
import CopyField from '../components/CopyField';
import MailtoLink from '../components/MailtoLink';
import Toast, { type ToastMessage } from '../components/Toast';

const CARD_CLASS = 'flex items-center gap-4 rounded-card border border-border bg-surface p-6';
const ICON_WRAP_CLASS =
  'inline-flex size-12 shrink-0 items-center justify-center rounded-icon bg-primary-bg';

export default function Contact() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastId = useRef(0);

  const showToast = useCallback((message: string, success: boolean) => {
    toastId.current += 1;
    setToast({ id: toastId.current, message, success });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return (
    <>
      <div className="bg-surface">
        <div className="shell pb-12 pt-16 text-center md:pt-20">
          <h1 className="text-h1 text-text">與我聯繫</h1>
          <p className="mt-3 text-body text-text-muted">
            合作委託、問題回報都歡迎——24 小時內回覆。
          </p>
        </div>
      </div>

      <div className="bg-surface">
        <div className="shell pb-20">
          <ul className="mx-auto flex max-w-[512px] flex-col gap-4">
            <li className={CARD_CLASS}>
              <span className={ICON_WRAP_CLASS}>
                <Mail className="size-6 text-primary-strong" strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[17px] font-bold text-text">Email</h2>
                <div className="mt-2">
                  <CopyField value={APP_INFO.email} onToast={showToast} />
                </div>
                <MailtoLink
                  email={APP_INFO.email}
                  subject="專案合作洽詢"
                  className="press focus-ring mt-2 inline-flex text-caption text-text-muted hover:text-primary-strong"
                >
                  或直接開啟郵件程式 →
                </MailtoLink>
              </div>
            </li>

            <li>
              <a
                href={APP_INFO.github}
                target="_blank"
                rel="noopener noreferrer"
                className={`press press-scale focus-ring group cursor-pointer [--press-scale:0.99] hover:border-primary ${CARD_CLASS}`}
              >
                <span className={ICON_WRAP_CLASS}>
                  <Github
                    className="size-6 text-primary-strong"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[17px] font-bold text-text">GitHub</h2>
                  <p className="mt-0.5 text-sm text-text-muted">看程式碼、開 issue 或參與討論。</p>
                </div>
                <ArrowUpRight
                  className="size-5 shrink-0 text-text-muted ease-out-quart motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>
            </li>

            <li>
              <a
                href={APP_INFO.threadsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`press press-scale focus-ring group cursor-pointer [--press-scale:0.99] hover:border-primary ${CARD_CLASS}`}
              >
                <span className={ICON_WRAP_CLASS}>
                  <AtSign
                    className="size-6 text-primary-strong"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[17px] font-bold text-text">Threads</h2>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {APP_INFO.socialHandle} — 日常分享與快速提問。
                  </p>
                </div>
                <ArrowUpRight
                  className="size-5 shrink-0 text-text-muted ease-out-quart motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>
            </li>
          </ul>

          <p className="mt-10 flex items-center justify-center gap-2 text-center text-caption text-text-muted">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            通常在 24 小時內回覆。
          </p>
        </div>
      </div>

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
