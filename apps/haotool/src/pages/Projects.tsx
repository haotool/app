/**
 * Projects Page Component
 * Display all projects with category filtering
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectCard, ProjectCardSkeleton } from '../components/ProjectCard';
import { PROJECTS } from '../constants';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

const CATEGORIES = [
  { id: 'all', label: '全部作品' },
  { id: 'web', label: 'Web' },
  { id: 'ai', label: 'AI/ML' },
  { id: 'tool', label: '工具' },
  { id: 'mobile', label: 'Mobile' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading when category changes
  const handleCategoryChange = (category: CategoryId) => {
    if (category === activeCategory) return;
    setIsLoading(true);
    setActiveCategory(category);
    setTimeout(() => setIsLoading(false), 300);
  };

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
            所有{' '}
            <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              作品
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            每個專案都傾注了對細節的執著，展現我在全端開發、設計與問題解決方面的技能。
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASING_NEBULA }}
          className="flex flex-wrap items-center justify-center gap-2 mb-12"
          role="group"
          aria-label="Filter projects by category"
        >
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              aria-pressed={activeCategory === category.id}
              className={`
                relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300
                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50
                ${
                  activeCategory === category.id
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5'
                }
              `}
            >
              {activeCategory === category.id && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 rounded-full bg-brand-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{category.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <motion.div layout className="grid sm:grid-cols-2 gap-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  >
                    <ProjectCardSkeleton />
                  </motion.div>
                ))
              : filteredProjects.map((project, index) => (
                  <ProjectCard key={project.id} project={project} index={index} />
                ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-slate-400 text-lg">這個類別目前還沒有專案。</p>
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
            更多專案持續開發中
          </div>
        </motion.div>
      </div>
    </main>
  );
}
