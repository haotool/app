/**
 * 聯繫頁佔位（語意結構完整版）
 * Email 遵循 CF Email Obfuscation 治理：SSG HTML 不輸出 mailto: href，
 * 佔位版僅以純文字呈現；複製按鈕與 MailtoLink 模式由後續 wave 實作。
 */
import { AUTHOR_CONTACT_LINKS } from '../config/app-info';

export default function Contact() {
  return (
    <div className="mx-auto max-w-[1120px] px-5 py-16 md:px-6">
      <h1 className="text-3xl font-extrabold">與我聯繫</h1>
      <p className="mt-3 max-w-prose text-text-muted">
        合作委託、技術顧問或問題回報——通常 24 小時內回覆。
      </p>

      <ul className="mx-auto mt-10 max-w-lg space-y-4">
        {AUTHOR_CONTACT_LINKS.map((link) => (
          <li key={link.id} className="rounded-[20px] border border-border bg-surface p-6">
            <h2 className="text-lg font-bold">{link.label}</h2>
            {link.href ? (
              <a
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="mt-2 inline-block text-sm text-primary-strong"
              >
                {link.value}
              </a>
            ) : (
              <p className="mt-2 text-sm text-text-muted">{link.value}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
