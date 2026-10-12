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
      desc: 'Master React 19, high-throughput Node.js microservices, and database architecture.',
      icon: Code2,
      tag: 'Frontend & Backend',
      levels: '5 Levels Planned',
    },
    {
      title: 'Artificial Intelligence & Deep Learning',
      desc: 'Deep dive into PyTorch, transformers, embeddings, and generative neural pipelines.',
      icon: Cpu,
      tag: 'AI / ML Track',
      levels: '6 Levels Planned',
    },
    {
      title: 'Cloud Infrastructure & DevOps',
      desc: 'Production containerization with Docker, Kubernetes clustering, and CI/CD automation.',
      icon: Terminal,
      tag: 'Systems & Cloud',
      levels: '4 Levels Planned',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 space-y-12 animate-in fade-in duration-300">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface border border-separator/80 p-8 sm:p-12 md:p-16 text-center shadow-xl">
        {/* Ambient Gradient Background Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold tracking-wide uppercase shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curriculum In Preparation • Coming Soon</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-label-primary tracking-tight leading-tight">
            Exciting Courses Are <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-500 to-indigo-500">
              Launching Soon
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-label-secondary leading-relaxed max-w-xl mx-auto">
            Our faculty and mentors are fine-tuning interactive video quests, curated study materials, and real-time coding assessments. The full course catalog will unlock soon.
          </p>

          {/* Early Access Notice Card */}
          <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-separator text-xs text-label-secondary flex items-center justify-center gap-2.5 max-w-lg mx-auto shadow-xs">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Selected for early alpha testing? Contact your <strong className="text-label-primary">SuperAdmin</strong> to receive early access clearance.
            </span>
          </div>

          {onRefresh && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-surface border border-separator text-label-primary hover:bg-surface-secondary active:scale-98 transition shadow-xs cursor-pointer"
              >
                <Clock className="w-4 h-4 text-accent" />
                <span>Check Availability Status</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Curriculum Preview Section */}
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Upcoming Sneak Peek</p>
          <h2 className="text-xl sm:text-2xl font-bold text-label-primary mt-1">
            Tracks Under Active Development
          </h2>
          <p className="text-xs text-label-secondary mt-1">
            Here is a preview of the upcoming learning paths arriving this semester.
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
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-secondary text-label-tertiary border border-separator">
                      Coming Soon
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-accent block mb-1">
                    {teaser.tag}
                  </span>
                  <h3 className="text-base font-bold text-label-primary mb-2">
                    {teaser.title}
                  </h3>
                  <p className="text-xs text-label-secondary leading-relaxed">
                    {teaser.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-separator/60 flex items-center justify-between text-xs text-label-tertiary">
                  <span className="flex items-center gap-1.5 font-medium">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {teaser.levels}
                  </span>
                  <span className="font-semibold text-accent flex items-center gap-1 group-hover:translate-x-0.5 transition">
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
