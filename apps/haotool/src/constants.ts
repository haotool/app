/**
 * Application Constants
 */

export const APP_NAME = 'HAOTOOL.ORG';

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  link: string;
  featured?: boolean;
  category: 'web' | 'mobile' | 'ai' | 'devops';
}

export const PROJECTS: Project[] = [
  {
    id: 'nihonname',
    title: 'NihonName',
    description:
      'Generate beautiful Japanese names with AI-powered suggestions. Built with React, TypeScript, and Vite SSG for optimal SEO and performance.',
    tags: ['React', 'TypeScript', 'Vite SSG', 'OpenAI', 'Tailwind CSS'],
    link: '/nihonname/',
    featured: true,
    category: 'ai',
  },
  {
    id: 'ratewise',
    title: 'RateWise',
    description:
      'Real-time currency exchange rate calculator with historical data visualization. A modern PWA built with React and Vite for seamless offline experience.',
    tags: ['React', 'TypeScript', 'PWA', 'Chart.js', 'Tailwind CSS'],
    link: '/ratewise/',
    featured: true,
    category: 'web',
  },
];

export interface Stat {
  value: string;
  suffix?: string;
  label: string;
}

export const STATS: Stat[] = [
  { value: '3', suffix: '+', label: 'Years Experience' },
  { value: '10', suffix: '+', label: 'Projects Completed' },
  { value: '100', suffix: '%', label: 'Open Source' },
  { value: '24', suffix: '/7', label: 'Learning Mode' },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    question: 'What technologies do you specialize in?',
    answer:
      'I specialize in modern web development with React, TypeScript, and Node.js. I also have extensive experience with cloud platforms (AWS, Cloudflare), DevOps practices, and AI/ML integrations.',
  },
  {
    question: 'Do you work on open source projects?',
    answer:
      'Absolutely! All projects showcased here are open source. I believe in contributing to the community and building tools that others can use, learn from, and improve upon.',
  },
  {
    question: 'Are you available for freelance work?',
    answer:
      "Yes, I'm open to freelance opportunities and collaborations. Whether it's a full project or consulting on specific technical challenges, feel free to reach out.",
  },
  {
    question: 'How do you approach new projects?',
    answer:
      'I follow a structured approach: understanding requirements thoroughly, creating an MVP first, then iterating based on feedback. I prioritize maintainability, performance, and user experience.',
  },
];
