/**
 * Project Card Component
 */
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { Project } from '../constants';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const isExternal = project.link.startsWith('http');

  return (
    <motion.a
      href={project.link}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: EASING_NEBULA }}
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 ring-1 ring-white/5 transition-all hover:ring-brand-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)] block"
    >
      {/* Featured Badge */}
      {project.featured && (
        <div className="absolute top-4 right-4 z-10">
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 rounded-full border border-brand-500/30">
            Featured
          </span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-900/20 to-purple-900/20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />

        {/* Placeholder gradient for now */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-white/10">{project.title[0]}</span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors">
            {project.title}
          </h3>
          <ArrowUpRight className="h-5 w-5 text-slate-500 group-hover:text-brand-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0" />
        </div>

        <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {project.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium bg-white/5 rounded text-slate-400 border border-white/5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.a>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 animate-pulse">
      <div className="aspect-[16/10] bg-slate-800/50" />
      <div className="p-6 space-y-4">
        <div className="h-6 bg-slate-800/50 rounded w-2/3" />
        <div className="h-4 bg-slate-800/30 rounded w-full" />
        <div className="h-4 bg-slate-800/30 rounded w-4/5" />
        <div className="flex gap-2">
          <div className="h-6 bg-slate-800/30 rounded w-16" />
          <div className="h-6 bg-slate-800/30 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;
