import { useEffect, useRef } from 'react';

interface MailtoLinkProps {
  email: string;
  className?: string;
}

/**
 * Renders an email "link" that:
 *   1. Avoids Cloudflare Email Obfuscation (no `mailto:` href in SSG HTML).
 *   2. Avoids raw email in SSG HTML (anti-scraper, displays "x [at] y").
 *   3. Stays crawlable for Lighthouse SEO (uses `<button>`, so the
 *      `crawlable-anchors` audit does not flag a missing `href`).
 *
 * SSG output       → <button>email [at] example.com</button>
 * After hydration  → <button data-email="email@example.com">email@example.com</button>
 * On click         → opens `mailto:email@example.com`
 */
export function MailtoLink({ email, className }: MailtoLinkProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const safeLabel = email.replace('@', ' [at] ');

  useEffect(() => {
    if (ref.current) {
      ref.current.dataset['email'] = email;
      ref.current.textContent = email;
    }
  }, [email]);

  const handleClick = () => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={`bg-transparent border-0 p-0 cursor-pointer ${className ?? ''}`.trim()}
    >
      {safeLabel}
    </button>
  );
}
