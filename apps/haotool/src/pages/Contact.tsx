/**
 * Contact Page Component
 * Contact information and social links
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Github, AtSign, Check, Copy, ExternalLink } from 'lucide-react';
import { SOCIAL_LINKS, APP_NAME } from '../constants';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface ContactMethod {
  icon: typeof Mail;
  label: string;
  value: string;
  href: string;
  isCopyable?: boolean;
  isExternal?: boolean;
  color: 'brand' | 'slate' | 'purple';
}

const CONTACT_METHODS: ContactMethod[] = [
  {
    icon: Mail,
    label: 'Email',
    value: SOCIAL_LINKS.email,
    href: `mailto:${SOCIAL_LINKS.email}`,
    isCopyable: true,
    color: 'brand',
  },
  {
    icon: Github,
    label: 'GitHub',
    value: '@azlife',
    href: SOCIAL_LINKS.github,
    isExternal: true,
    color: 'slate',
  },
  {
    icon: AtSign,
    label: 'Threads',
    value: '@azlife_1224',
    href: SOCIAL_LINKS.threads,
    isExternal: true,
    color: 'purple',
  },
];

export default function Contact() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      console.error('Failed to copy to clipboard');
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-20 flex items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASING_NEBULA }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20">
            Get in Touch
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            與我{' '}
            <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              聯繫
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            有問題或想法想討論？歡迎透過以下方式與我聯繫，我會盡快回覆您。
          </p>
        </motion.div>

        {/* Contact Methods */}
        <div className="grid gap-4 max-w-lg mx-auto mb-16">
          {CONTACT_METHODS.map((method, index) => (
            <motion.div
              key={method.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: EASING_NEBULA }}
            >
              <div className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-500/30 hover:bg-white/[0.04] transition-all">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors
                    ${method.color === 'brand' ? 'bg-brand-500/10 text-brand-400 group-hover:bg-brand-500/20' : ''}
                    ${method.color === 'slate' ? 'bg-white/5 text-slate-400 group-hover:bg-white/10' : ''}
                    ${method.color === 'purple' ? 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20' : ''}
                  `}
                >
                  <method.icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    {method.label}
                  </p>
                  <p className="text-white font-medium truncate">{method.value}</p>
                </div>

                <div className="flex items-center gap-2">
                  {method.isCopyable && (
                    <motion.button
                      onClick={() => void copyToClipboard(method.value, method.label)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      aria-label={`Copy ${method.label}`}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {copiedItem === method.label ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Check className="h-4 w-4 text-green-400" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Copy className="h-4 w-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )}

                  {method.isExternal && (
                    <a
                      href={method.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      aria-label={`Open ${method.label}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center"
        >
          <p className="text-slate-500 text-sm">通常會在 24 小時內回覆 · {APP_NAME}</p>
        </motion.div>
      </div>
    </main>
  );
}
