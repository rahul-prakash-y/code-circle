import React from 'react';
import {
  Sparkles,
  Clock,
  Code2,
  Terminal,
  Cpu,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface CoursesComingSoonViewProps {
  onRefresh?: () => void;
  onRequestAccess?: () => void;
}

export const CoursesComingSoonView: React.FC<CoursesComingSoonViewProps> = ({
  onRefresh,
}) => {
  const upcomingTeasers = [
    {
      title: 'Full Stack Web Engineering',
      desc: 'Master modern React patterns, high-throughput backend services, and database architecture.',
      icon: Code2,
      tag: 'Frontend & backend',
      levels: '5 levels planned',
    },
    {
      title: 'Artificial Intelligence & Deep Learning',
      desc: 'Foundations of PyTorch, transformers, vector embeddings, and neural inference pipelines.',
      icon: Cpu,
      tag: 'AI & machine learning',
      levels: '6 levels planned',
    },
    {
      title: 'Cloud Infrastructure & DevOps',
      desc: 'Production containerization with Docker, Kubernetes clusters, and automated delivery pipelines.',
      icon: Terminal,
      tag: 'Systems & cloud',
      levels: '4 levels planned',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-12 animate-in fade-in duration-300">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface border border-separator/80 p-8 sm:p-12 md:p-16 text-center shadow-sm">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-5">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curriculum in preparation • Coming soon</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-label-primary tracking-tight leading-[1.15]">
            Curated engineering courses <br className="hidden sm:inline" />
            are launching soon
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-[15px] text-label-secondary leading-relaxed max-w-prose mx-auto">
            Faculty coordinators and student leads are preparing interactive video walkthroughs, study notes, and hands-on coding challenges. The catalog will open shortly.
          </p>

          {/* Early Access Notice Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-secondary/70 border border-separator text-xs text-label-secondary flex items-center justify-center gap-2.5 max-w-lg mx-auto">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-left sm:text-center">
              Selected for early preview? Contact a club administrator for access permissions.
            </span>
          </div>

          {onRefresh && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium bg-surface border border-separator text-label-primary hover:bg-surface-secondary active:scale-98 transition shadow-xs cursor-pointer min-h-[40px]"
              >
                <Clock className="w-4 h-4 text-accent" />
                <span>Check availability status</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Curriculum Preview Section */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Preview</p>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-label-primary">
            Tracks currently in development
          </h2>
          <p className="text-xs sm:text-sm text-label-secondary max-w-prose mx-auto">
            A preview of upcoming hands-on learning pathways arriving this term.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {upcomingTeasers.map((teaser, idx) => {
            const Icon = teaser.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-surface border border-separator/80 shadow-xs flex flex-col justify-between hover:border-accent/30 transition group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center group-hover:scale-105 transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-secondary text-label-tertiary border border-separator">
                      Coming soon
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-accent block mb-1">
                    {teaser.tag}
                  </span>
                  <h3 className="text-base font-semibold text-label-primary mb-2 tracking-tight">
                    {teaser.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-label-secondary leading-relaxed">
                    {teaser.desc}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-separator/60 flex items-center justify-between text-xs text-label-tertiary">
                  <span className="flex items-center gap-1.5 font-medium tabular-nums">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {teaser.levels}
                  </span>
                  <span className="font-medium text-accent flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    Preview <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CoursesComingSoonView;
