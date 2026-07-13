/**
 * 聯繫頁（design-deep-dive §5.3 + PRD §5.4 委託資訊區）：
 * 頁首 → 三張聯絡卡 → 委託資訊（承接範圍 / 三步流程 / SLA 承諾列）。
 * Email 卡不可整卡點擊（互動集中於複製鈕；FR-005 預填主旨連結為卡內 MailtoLink）；
 * GitHub / Threads 整卡外連。SSG HTML 零 mailto: href（CF Email Obfuscation 治理）。
 */
import { useCallback, useRef, useState } from 'react';
import { ArrowUpRight, AtSign, Github, Mail } from 'lucide-react';
import { AUTHOR_CONTACT_LINK_MAP } from '../config/app-info';
import CopyField from '../components/CopyField';
import MailtoLink from '../components/MailtoLink';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import Toast, { type ToastMessage } from '../components/Toast';

// 三張聯絡卡資料 SSOT：config/app-info 的作者聯絡連結。
const EMAIL_CONTACT = AUTHOR_CONTACT_LINK_MAP.email;
const GITHUB_CONTACT = AUTHOR_CONTACT_LINK_MAP.github;
const THREADS_CONTACT = AUTHOR_CONTACT_LINK_MAP.threads;

const CARD_CLASS = 'flex items-center gap-4 rounded-card border border-border bg-surface p-6';
const ICON_WRAP_CLASS =
  'inline-flex size-12 shrink-0 items-center justify-center rounded-icon bg-primary-bg';

// 委託資訊（PRD §5.4）：承接範圍與合作流程三步。
const HIRE_SCOPES = ['Web 前端', 'PWA', '效能優化', '技術顧問'] as const;

const HIRE_STEPS = [
  { title: '聊需求', description: '說說你想解決的問題，快速對齊方向與範圍。' },
  { title: '報價與時程', description: '給出明確報價與交付時程，沒有隱藏成本。' },
  { title: '迭代交付', description: '小步交付、隨時看得到進度，驗收後才算完成。' },
] as const;

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
                <h2 className="text-[17px] font-bold text-text">{EMAIL_CONTACT.label}</h2>
                <div className="mt-2">
                  <CopyField value={EMAIL_CONTACT.value} onToast={showToast} />
                </div>
                <MailtoLink
                  email={EMAIL_CONTACT.value}
                  subject="專案合作洽詢"
                  className="press focus-ring mt-2 inline-flex text-caption text-text-muted hover:text-primary-strong"
                >
                  或直接開啟郵件程式 →
                </MailtoLink>
              </div>
            </li>

            <li>
              <a
                href={GITHUB_CONTACT.href}
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
                  <h2 className="text-[17px] font-bold text-text">{GITHUB_CONTACT.label}</h2>
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
                href={THREADS_CONTACT.href}
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
                  <h2 className="text-[17px] font-bold text-text">{THREADS_CONTACT.label}</h2>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {THREADS_CONTACT.value} — 日常分享與快速提問。
                  </p>
                </div>
                <ArrowUpRight
                  className="size-5 shrink-0 text-text-muted ease-out-quart motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* 委託資訊（PRD §5.4）：承接範圍 → 合作流程三步 → SLA 承諾列（deep-dive 承諾列併於此，避免同句重複） */}
      <section aria-labelledby="hire-heading" className="bg-background">
        <div className="shell section-pad">
          <Reveal>
            <SectionHeading
              overline="WORK WITH ME"
              id="hire-heading"
              title="委託與合作"
              sub="從一頁式網站到完整 PWA，這些是我能幫上忙的事。"
            />

            <ul className="mt-8 flex flex-wrap justify-center gap-2" aria-label="承接範圍">
              {HIRE_SCOPES.map((scope) => (
                <li
                  key={scope}
                  className="rounded-chip border border-border bg-surface px-4 py-2 text-[15px] font-medium text-text"
                >
                  {scope}
                </li>
              ))}
            </ul>

            <ol className="mx-auto mt-8 grid max-w-[720px] grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              {HIRE_STEPS.map((step, index) => (
                <li key={step.title} className="rounded-card border border-border bg-surface p-6">
                  <span
                    className="text-[20px] font-extrabold tabular-nums text-primary-strong"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <h3 className="mt-2 text-[17px] font-bold text-text">{step.title}</h3>
                  <p className="mt-1 text-body-sm text-text-muted">{step.description}</p>
                </li>
              ))}
            </ol>

            <p className="mt-8 flex items-center justify-center gap-2 text-center text-caption text-text-muted">
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />
              通常在 24 小時內回覆。
            </p>
          </Reveal>
        </div>
      </section>

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
