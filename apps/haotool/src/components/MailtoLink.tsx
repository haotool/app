import type { ReactNode } from 'react';

interface MailtoLinkProps {
  email: string;
  subject?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Email 連結（RateWise MailtoLink 模式；CF Email Obfuscation 治理）：
 * SSG HTML 零 mailto: href（用 <button>，crawlable-anchors 不觸發缺 href 警告）；
 * hydration 後點擊才組出 mailto URL，可帶預填主旨（PRD §5.4）。
 */
export default function MailtoLink({ email, subject, className, children }: MailtoLinkProps) {
  const handleClick = () => {
    const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    window.location.href = `mailto:${email}${query}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`cursor-pointer border-0 bg-transparent p-0 text-left ${className ?? ''}`.trim()}
    >
      {children}
    </button>
  );
}
