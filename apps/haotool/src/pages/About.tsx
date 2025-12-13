/**
 * About Page Component
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Code2, Cpu, Cloud, Sparkles, ArrowRight } from 'lucide-react';
import { AccordionItem } from '../components/Accordion';
import { FAQS } from '../constants';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

const SKILLS = [
  {
    icon: Code2,
    title: 'Frontend Development',
    description: 'React, TypeScript, Next.js, Vue, Tailwind CSS, and modern UI frameworks.',
  },
  {
    icon: Cpu,
    title: 'Backend Development',
    description: 'Node.js, Python, Go, REST APIs, GraphQL, and database design.',
  },
  {
    icon: Cloud,
    title: 'Cloud & DevOps',
    description: 'AWS, Docker, Kubernetes, CI/CD, and infrastructure as code.',
  },
  {
    icon: Sparkles,
    title: 'AI Integration',
    description: 'OpenAI, LangChain, vector databases, and ML model deployment.',
  },
];

export default function About() {
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
            About Me
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Crafting Code with{' '}
            <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              Purpose
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            I&apos;m a passionate full-stack developer dedicated to building elegant, performant,
            and user-centric applications that make a difference.
          </p>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASING_NEBULA }}
          className="mb-20"
        >
          <div className="p-8 rounded-2xl bg-[#0a0a0a] border border-white/5">
            <h2 className="text-xl font-bold text-white mb-4">My Journey</h2>
            <div className="space-y-4 text-slate-400 leading-relaxed">
              <p>
                I started my coding journey with a simple curiosity about how websites work. That
                curiosity quickly evolved into a passion for creating digital experiences that are
                both beautiful and functional.
              </p>
              <p>
                Today, I focus on building high-performance web applications using modern
                technologies. I believe in writing clean, maintainable code and following best
                practices that stand the test of time.
              </p>
              <p>
                When I&apos;m not coding, you&apos;ll find me exploring new technologies,
                contributing to open source projects, or sharing knowledge with the developer
                community.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Skills Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASING_NEBULA }}
          className="mb-20"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">Skills & Expertise</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {SKILLS.map((skill, index) => (
              <motion.div
                key={skill.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: EASING_NEBULA }}
                className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/5 hover:border-brand-500/30 transition-colors"
              >
                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 w-fit mb-4">
                  <skill.icon className="h-6 w-6 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{skill.title}</h3>
                <p className="text-sm text-slate-400">{skill.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASING_NEBULA }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/5">
            {FAQS.map((faq) => (
              <AccordionItem key={faq.question} item={faq} />
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASING_NEBULA }}
          className="text-center"
        >
          <Link
            to="/contact"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-medium rounded-full transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
          >
            Let&apos;s Work Together
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
