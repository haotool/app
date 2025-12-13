/**
 * Projects Page Component
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ProjectCard, ProjectCardSkeleton } from '../components/ProjectCard';
import { PROJECTS } from '../constants';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

const CATEGORIES = [
  { id: 'all', label: 'All Projects' },
  { id: 'web', label: 'Web' },
  { id: 'ai', label: 'AI/ML' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'devops', label: 'DevOps' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [isLoading] = useState(false);

  const filteredProjects = PROJECTS.filter((project) =>
    activeCategory === 'all' ? true : project.category === activeCategory,
  );

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASING_NEBULA }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20">
            Portfolio
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Featured{' '}
            <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              Projects
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            A collection of projects I&apos;ve crafted with passion, showcasing my skills in
            full-stack development, design, and problem-solving.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASING_NEBULA }}
          className="flex flex-wrap items-center justify-center gap-2 mb-12"
        >
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                px-4 py-2 text-sm font-medium rounded-full transition-all
                ${
                  activeCategory === category.id
                    ? 'bg-brand-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                }
              `}
            >
              {category.label}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProjectCardSkeleton key={i} />)
            : filteredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
        </motion.div>

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-slate-400 text-lg">No projects found in this category yet.</p>
          </motion.div>
        )}

        {/* More Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASING_NEBULA }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-slate-400 text-sm">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            More projects coming soon
          </div>
        </motion.div>
      </div>
    </main>
  );
}
