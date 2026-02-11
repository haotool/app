/**
 * ProjectCard Component
 * Interactive project card with spotlight effect
 * [context7:/websites/motion-dev-docs:2025-12-14] - Motion integration
 */
import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import type { Project } from '../constants';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-sm h-full w-full"
      aria-hidden="true"
    >
      {/* Image Skeleton */}
      <div className="relative h-48 w-full bg-white/5 animate-pulse" />

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col p-6 space-y-5">
        <div className="flex justify-between items-start">
          <div className="h-7 w-2/3 bg-white/10 rounded-md animate-pulse" />
          <div className="h-5 w-5 bg-white/10 rounded-full animate-pulse" />
        </div>

        <div className="space-y-2 flex-1">
          <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-white/5 rounded animate-pulse" />
        </div>

        <div className="flex gap-2 mt-4">
          <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
          <div className="h-6 w-12 bg-white/5 rounded animate-pulse" />
          <div className="h-6 w-20 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const isExternal = project.link.startsWith('http');
  const statusColors = {
    live: 'bg-emerald-500',
    beta: 'bg-amber-500',
    development: 'bg-blue-500',
  };

  return (
    <motion.div
      layout
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: EASING_NEBULA }}
      whileHover={{
        y: -8,
        scale: 1.02,
        borderColor: 'rgba(99, 102, 241, 0.4)',
        boxShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.2)',
      }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-sm transition-colors hover:bg-slate-900/60"
    >
      {/* Main Card Link */}
      <a
        href={project.link}
        target={isExternal ? '_blank' : '_self'}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="absolute inset-0 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl"
        aria-label={`View ${project.title}`}
      >
        <span className="sr-only">View {project.title}</span>
      </a>

      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.08),
              transparent 40%
            )
          `,
        }}
        aria-hidden="true"
      />

      {/* Border Spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100 z-10"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(99, 102, 241, 0.3),
              transparent 40%
            )
          `,
          maskImage: `linear-gradient(black, black) content-box, linear-gradient(black, black)`,
          WebkitMaskImage: `linear-gradient(black, black) content-box, linear-gradient(black, black)`,
          maskComposite: `exclude`,
          WebkitMaskComposite: `xor`,
          padding: `1px`,
        }}
        aria-hidden="true"
      />

      {/* Image Section */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-800">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800" />

        {/* Project OG image */}
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={`${project.title} 預覽圖`}
            width={1200}
            height={630}
            loading={index < 2 ? 'eager' : 'lazy'}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
          />
        ) : null}

        {/* Stylized overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-purple-500/20 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-70" />

        {/* Status Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10 z-20">
          <span className={`w-2 h-2 rounded-full ${statusColors[project.status]}`} />
          <span className="capitalize">{project.status}</span>
        </div>

        {/* Category Badge */}
        <span className="absolute top-4 right-4 rounded-full bg-brand-500/20 px-3 py-1 text-xs font-medium text-brand-300 backdrop-blur-md border border-brand-500/30 z-20 capitalize">
          {project.category}
        </span>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-6 z-0 relative pointer-events-none">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors">
            {project.title}
          </h3>
          {isExternal ? (
            <ExternalLink
              className="h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-400"
              aria-hidden="true"
            />
          ) : (
            <ArrowUpRight
              className="h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-400"
              aria-hidden="true"
            />
          )}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-400 flex-1 line-clamp-3">
          {project.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono text-brand-300 bg-brand-500/10 px-2 py-1 rounded border border-transparent group-hover:border-brand-500/20 transition-all"
            >
              #{tag}
            </span>
          ))}
          {project.tags.length > 4 && (
            <span className="text-xs text-slate-500">+{project.tags.length - 4}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ProjectCard;
