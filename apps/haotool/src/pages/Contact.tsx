/**
 * Contact Page Component
 */
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Mail, ArrowUpRight } from 'lucide-react';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

const SOCIAL_LINKS = [
  {
    name: 'GitHub',
    href: 'https://github.com/haotool',
    icon: Github,
    description: 'Check out my open source projects',
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/haotool',
    icon: Twitter,
    description: 'Follow for updates and tech insights',
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/haotool',
    icon: Linkedin,
    description: 'Connect with me professionally',
  },
  {
    name: 'Email',
    href: 'mailto:hello@haotool.org',
    icon: Mail,
    description: 'Direct contact for inquiries',
  },
];

export default function Contact() {
  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
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
            Let&apos;s Build Something{' '}
            <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              Amazing
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Whether you have a project in mind, want to collaborate, or just want to say hi,
            I&apos;d love to hear from you. Let&apos;s create something extraordinary together.
          </p>
        </motion.div>

        {/* Contact Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASING_NEBULA }}
          className="grid sm:grid-cols-2 gap-4"
        >
          {SOCIAL_LINKS.map((link, index) => (
            <motion.a
              key={link.name}
              href={link.href}
              target={link.href.startsWith('mailto') ? undefined : '_blank'}
              rel={link.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: EASING_NEBULA }}
              whileHover={{ y: -3 }}
              className="group p-6 rounded-2xl bg-[#0a0a0a] border border-white/5 ring-1 ring-white/5 hover:ring-brand-500/40 hover:border-brand-500/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 group-hover:bg-brand-500/20 transition-colors">
                  <link.icon className="h-6 w-6 text-brand-400" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-500 group-hover:text-brand-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-300 transition-colors">
                {link.name}
              </h3>
              <p className="text-sm text-slate-400">{link.description}</p>
            </motion.a>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: EASING_NEBULA }}
          className="mt-16 text-center"
        >
          <div className="p-8 rounded-2xl bg-gradient-to-br from-brand-500/10 to-purple-500/10 border border-brand-500/20">
            <h2 className="text-xl font-bold text-white mb-4">Ready to start a project?</h2>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              I&apos;m always interested in hearing about new opportunities and exciting projects.
              Drop me a line and let&apos;s discuss how we can work together.
            </p>
            <a
              href="mailto:hello@haotool.org"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-medium rounded-full transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
            >
              <Mail className="h-4 w-4" />
              Send me an email
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
