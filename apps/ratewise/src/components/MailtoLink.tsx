import { useEffect, useRef } from 'react';

interface MailtoLinkProps {
  email: string;
  className?: string;
}

/**
 * Renders an email address as a mailto link, but defers the href to client-side
 * hydration so Cloudflare Email Obfuscation cannot transform it during SSG.
 *
 * Without this, Cloudflare rewrites `mailto:` hrefs into
 * `/cdn-cgi/l/email-protection#…` which returns 404 for crawlers without JS.
 *
 * SSG output  → <a>email@example.com</a>            (no href, no obfuscation)
 * After hydration → <a href="mailto:…">email@example.com</a>  (works for users)
 */
export function MailtoLink({ email, className }: MailtoLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute('href', `mailto:${email}`);
    }
  }, [email]);

  return (
    <a ref={ref} className={className}>
      {email}
    </a>
  );
}
